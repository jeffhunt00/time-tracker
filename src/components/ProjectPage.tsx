import { useState, useMemo, useEffect, useRef } from 'react';
import type { Project, TimeEntry, TimerState, WaveConfig, Invoice } from '../types';
import { TimeEntryForm } from './TimeEntryForm';
import { TimeEntryList } from './TimeEntryList';
import { EntryToolbar } from './EntryToolbar';
import type { SortMode, DateFilter, BillingFilter } from './EntryToolbar';
import { InvoiceList } from './InvoiceList';
import { exportEntriesCSV } from '../utils/csv';
import { formatDuration, formatDecimalHours } from '../utils/time';

type View = 'entries' | 'invoice';
type GroupMode = 'none' | 'task' | 'date' | 'reference';

interface TaskGroup { task: string; totalMinutes: number; count: number; entries: TimeEntry[]; }
interface DateGroup { date: string; totalMinutes: number; entries: TimeEntry[]; }
interface RefGroup { reference: string; totalMinutes: number; count: number; entries: TimeEntry[]; }

function groupByTask(entries: TimeEntry[]): TaskGroup[] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) { const arr = map.get(e.task) ?? []; arr.push(e); map.set(e.task, arr); }
  return Array.from(map.entries())
    .map(([task, items]) => ({ task, totalMinutes: items.reduce((s, e) => s + e.duration, 0), count: items.length, entries: items }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

function groupByDate(entries: TimeEntry[], asc: boolean): DateGroup[] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) { const arr = map.get(e.date) ?? []; arr.push(e); map.set(e.date, arr); }
  return Array.from(map.entries())
    .map(([date, items]) => ({ date, totalMinutes: items.reduce((s, e) => s + e.duration, 0), entries: items }))
    .sort((a, b) => asc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
}

function groupByRef(entries: TimeEntry[]): RefGroup[] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) { const key = e.reference || '(No reference)'; const arr = map.get(key) ?? []; arr.push(e); map.set(key, arr); }
  return Array.from(map.entries())
    .map(([reference, items]) => ({ reference, totalMinutes: items.reduce((s, e) => s + e.duration, 0), count: items.length, entries: items }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  if (diff === 0) return `Today — ${formatted}`;
  if (diff === 1) return `Yesterday — ${formatted}`;
  if (diff > 1 && diff < 7) return `${weekday} — ${formatted}`;
  return `${weekday}, ${formatted}`;
}

interface Props {
  project: Project;
  autoFocusTitle?: boolean;
  allEntries: TimeEntry[];
  customTasks: string[];
  timerState: TimerState;
  onBack: () => void;
  onUpdateProject: (id: string, title: string) => void;
  onDeleteProject: (id: string) => void;
  onAddEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'billedStatus'>) => string;
  onUpdateEntry: (id: string, fields: Partial<Omit<TimeEntry, 'id' | 'createdAt'>>) => void;
  onDeleteEntry: (id: string) => void;
  onSaveCustomTask: (task: string) => void;
  onStartTimer: (projectId: string, task: string) => void;
  onStopTimer: () => number;
  onResetTimer: () => void;
  waveConfig: WaveConfig;
  invoices: Invoice[];
  onCreateInvoice: (projectId: string, dateInvoiced?: string) => string;
  onAddEntriesToInvoice: (invoiceId: string, entryIds: string[]) => void;
  onUpdateInvoice: (invoiceId: string, fields: Partial<Pick<Invoice, 'dateInvoiced' | 'status' | 'waveInvoiceId' | 'waveViewUrl'>>) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onMarkEntriesBilled: (entryIds: string[], invoiceId: string) => void;
  onMarkEntryUnbilled: (entryId: string) => void;
  onSetProjectHourlyRate: (projectId: string, rate: number) => void;
  onOpenWaveSetup: () => void;
}

export function ProjectPage({
  project,
  autoFocusTitle,
  allEntries,
  customTasks,
  timerState,
  onBack,
  onUpdateProject,
  onDeleteProject,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSaveCustomTask,
  onStartTimer,
  onStopTimer,
  onResetTimer,
  waveConfig,
  invoices,
  onCreateInvoice,
  onAddEntriesToInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onOpenWaveSetup,
}: Props) {
  const [view, setView] = useState<View>('entries');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const [activeFilter, setActiveFilter] = useState<DateFilter | null>(null);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all');
  const [groupMode, setGroupMode] = useState<GroupMode>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);

  const [editingTitle, setEditingTitle] = useState(autoFocusTitle ?? false);
  const [titleDraft, setTitleDraft] = useState(project.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-focus and select-all on title when opened as new project
  useEffect(() => {
    if (autoFocusTitle && editingTitle) {
      titleInputRef.current?.select();
    }
  }, [autoFocusTitle, editingTitle]);

  const projectEntries = allEntries.filter((e) => e.projectId === project.id);
  const totalMinutes = projectEntries.reduce((sum, e) => sum + e.duration, 0);

  const processedEntries = useMemo(() => {
    let entries = [...projectEntries];
    if (activeFilter) {
      if (activeFilter.from) entries = entries.filter((e) => e.date >= activeFilter.from);
      if (activeFilter.to) entries = entries.filter((e) => e.date <= activeFilter.to);
    }
    if (billingFilter !== 'all') {
      entries = entries.filter((e) => e.billedStatus === billingFilter);
    }
    entries.sort((a, b) => {
      switch (sortMode) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime() || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
    return entries;
  }, [projectEntries, activeFilter, sortMode, billingFilter]);

  function handleAddEntry(entry: Omit<TimeEntry, 'id' | 'createdAt' | 'billedStatus'>) {
    const id = onAddEntry(entry);
    onResetTimer();
    setHighlightedEntryId(id);
  }

  function handleExport() {
    if (processedEntries.length === 0) return;
    exportEntriesCSV(project, processedEntries);
  }

  function saveTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== project.title) {
      onUpdateProject(project.id, trimmed);
    }
    setEditingTitle(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') { setTitleDraft(project.title); setEditingTitle(false); }
  }

  function handleDelete() {
    onDeleteProject(project.id);
    onBack();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const visibleIds = processedEntries.map((e) => e.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const projectInvoices = invoices.filter((inv) => inv.projectId === project.id);
  const draftInvoices = projectInvoices.filter((inv) => inv.status === 'draft');

  function handleAddToInvoice(invoiceId: string) {
    onAddEntriesToInvoice(invoiceId, Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowInvoicePicker(false);
  }

  function handleAddToNewInvoice() {
    const newId = onCreateInvoice(project.id);
    onAddEntriesToInvoice(newId, Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowInvoicePicker(false);
  }

  const isDateAsc = sortMode === 'date-asc' || sortMode === 'created-asc';
  const taskGroups = groupByTask(processedEntries);
  const dateGroups = groupByDate(processedEntries, isDateAsc);
  const refGroups = groupByRef(processedEntries);

  return (
    <div className="project-page">
      {/* Top bar */}
      <div className="project-page-topbar">
        <button className="back-btn" onClick={onBack}>
          ‹ Projects
        </button>
        <nav className="project-page-topbar-right">
          {projectEntries.length > 0 && (
            <button className="btn btn-small" onClick={handleExport}>
              Export CSV
            </button>
          )}
          {showDeleteConfirm ? (
            <div className="delete-confirm-inline">
              <span className="delete-confirm-text">Delete this project?</span>
              <button className="btn btn-small btn-danger" onClick={handleDelete}>Yes, Delete</button>
              <button className="btn btn-small" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          ) : (
            <button
              className="btn-icon-text"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete project"
              aria-label="Project options"
            >
              ···
            </button>
          )}
        </nav>
      </div>

      {/* Project header */}
      <div className="project-page-header">
        <div className="project-page-title-row">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="project-title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKeyDown}
              autoFocus
            />
          ) : (
            <h1
              className="project-page-title"
              onClick={() => { setTitleDraft(project.title); setEditingTitle(true); }}
              title="Click to rename"
            >
              {project.title}
            </h1>
          )}
        </div>
        <div className="project-page-meta">
          {totalMinutes > 0 ? (
            <span className="project-page-total">
              {formatDuration(totalMinutes)}
              <span className="muted"> · {formatDecimalHours(totalMinutes)}h</span>
            </span>
          ) : (
            <span className="muted">No time logged yet</span>
          )}
          {activeFilter && (
            <span className="project-page-filter-note muted">
              (filtered: {activeFilter.label ?? `${activeFilter.from}–${activeFilter.to}`})
            </span>
          )}
        </div>
      </div>

      {/* Tab toggle */}
      <div className="project-page-view-toggle">
        <nav className="view-toggle">
          <button
            className={`btn btn-small ${view === 'entries' ? 'btn-primary' : ''}`}
            onClick={() => setView('entries')}
          >
            Entries
          </button>
          <button
            className={`btn btn-small ${view === 'invoice' ? 'btn-primary' : ''}`}
            onClick={() => setView('invoice')}
          >
            Invoice
          </button>
        </nav>
      </div>

      {/* Content */}
      {view === 'invoice' ? (
        <InvoiceList
          invoices={projectInvoices}
          entries={projectEntries}
          waveConfig={waveConfig}
          onUpdateInvoice={onUpdateInvoice}
          onDeleteInvoice={onDeleteInvoice}
          onNewInvoice={() => onCreateInvoice(project.id)}
          onOpenWaveSetup={onOpenWaveSetup}
        />
      ) : (
        <div className="tracker-view">
          <TimeEntryForm
            projectId={project.id}
            timerState={timerState}
            customTasks={customTasks}
            onAddEntry={handleAddEntry}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
            onSaveCustomTask={onSaveCustomTask}
          />

          <EntryToolbar
            sortMode={sortMode}
            onSortChange={setSortMode}
            activeFilter={activeFilter}
            onApplyFilter={setActiveFilter}
            onClearFilter={() => setActiveFilter(null)}
            billingFilter={billingFilter}
            onBillingFilterChange={setBillingFilter}
            groupMode={groupMode}
            onGroupModeChange={setGroupMode}
          />

          {/* Select all + action bar */}
          {processedEntries.length > 0 && groupMode === 'none' && (
            <div className="entry-select-bar">
              <label className="entry-select-all">
                <input
                  type="checkbox"
                  checked={processedEntries.length > 0 && processedEntries.every((e) => selectedIds.has(e.id))}
                  onChange={toggleSelectAll}
                />
                <span>{selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}</span>
              </label>
              {selectedIds.size > 0 && (
                <div className="entry-select-actions">
                  <span className="entry-select-total">
                    {formatDuration(processedEntries.filter((e) => selectedIds.has(e.id)).reduce((sum, e) => sum + e.duration, 0))}
                  </span>
                  <div className="invoice-picker-wrapper">
                    <button className="btn btn-small btn-primary" onClick={() => setShowInvoicePicker(!showInvoicePicker)}>
                      Add to Invoice
                    </button>
                    {showInvoicePicker && (
                      <div className="invoice-picker-dropdown">
                        <button className="invoice-picker-option" onClick={handleAddToNewInvoice}>+ New Invoice</button>
                        {draftInvoices.length > 0 && (
                          <>
                            <div className="invoice-picker-divider" />
                            {draftInvoices.map((inv) => (
                              <button key={inv.id} className="invoice-picker-option" onClick={() => handleAddToInvoice(inv.id)}>
                                <span className="invoice-picker-date">{inv.dateInvoiced}</span>
                                <span className="muted">{inv.entryIds.length > 0 ? `${formatDuration(inv.totalMinutes)} · ${inv.entryIds.length} entries` : 'Empty'}</span>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-small" onClick={() => setSelectedIds(new Set())}>Clear</button>
                </div>
              )}
            </div>
          )}

          {/* Grouped or flat entry list */}
          {groupMode === 'none' ? (
            <TimeEntryList
              entries={processedEntries}
              customTasks={customTasks}
              onUpdate={onUpdateEntry}
              onDelete={onDeleteEntry}
              onSaveCustomTask={onSaveCustomTask}
              highlightedEntryId={highlightedEntryId}
              onHighlightComplete={() => setHighlightedEntryId(null)}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          ) : groupMode === 'task' ? (
            <div className="summary-groups">
              {taskGroups.length === 0 ? (
                <div className="empty-state"><p>No entries match the current filter.</p></div>
              ) : taskGroups.map((group) => {
                const expanded = expandedGroups.has(group.task);
                return (
                  <div key={group.task} className="summary-group-card">
                    <button className="summary-group-header" onClick={() => toggleGroup(group.task)}>
                      <span className="summary-group-expand">{expanded ? '▾' : '▸'}</span>
                      <span className="summary-group-name">{group.task}</span>
                      <span className="summary-group-hours">{formatDuration(group.totalMinutes)}<span className="muted"> ({formatDecimalHours(group.totalMinutes)}h)</span></span>
                      <span className="summary-group-count">{group.count}</span>
                    </button>
                    {expanded && (
                      <div className="summary-group-entries">
                        {group.entries.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                          <div key={e.id} className="summary-entry">
                            <span className="summary-entry-date">{e.date}</span>
                            <span className="summary-entry-duration">{formatDuration(e.duration)}</span>
                            {e.reference && <span className="summary-entry-ref">{e.reference}</span>}
                            {e.description && <span className="summary-entry-desc">{e.description}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : groupMode === 'date' ? (
            <div className="summary-groups">
              {dateGroups.length === 0 ? (
                <div className="empty-state"><p>No entries match the current filter.</p></div>
              ) : dateGroups.map((group) => {
                const expanded = expandedGroups.has(group.date);
                return (
                  <div key={group.date} className="summary-group-card">
                    <button className="summary-group-header" onClick={() => toggleGroup(group.date)}>
                      <span className="summary-group-expand">{expanded ? '▾' : '▸'}</span>
                      <span className="summary-group-name">{formatDateLabel(group.date)}</span>
                      <span className="summary-group-hours">{formatDuration(group.totalMinutes)}<span className="muted"> ({formatDecimalHours(group.totalMinutes)}h)</span></span>
                      <span className="summary-group-count">{group.entries.length}</span>
                    </button>
                    {expanded && (
                      <div className="summary-group-entries">
                        {group.entries.map((e) => (
                          <div key={e.id} className="summary-entry">
                            <span className="summary-entry-duration">{formatDuration(e.duration)}</span>
                            {e.reference && <span className="summary-entry-ref">{e.reference}</span>}
                            <span className="summary-entry-task">{e.task}</span>
                            {e.description && <span className="summary-entry-desc">{e.description}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="summary-groups">
              {refGroups.length === 0 ? (
                <div className="empty-state"><p>No entries match the current filter.</p></div>
              ) : refGroups.map((group) => {
                const expanded = expandedGroups.has(group.reference);
                return (
                  <div key={group.reference} className="summary-group-card">
                    <button className="summary-group-header" onClick={() => toggleGroup(group.reference)}>
                      <span className="summary-group-expand">{expanded ? '▾' : '▸'}</span>
                      <span className="summary-group-name">{group.reference}</span>
                      <span className="summary-group-hours">{formatDuration(group.totalMinutes)}<span className="muted"> ({formatDecimalHours(group.totalMinutes)}h)</span></span>
                      <span className="summary-group-count">{group.count}</span>
                    </button>
                    {expanded && (
                      <div className="summary-group-entries">
                        {group.entries.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                          <div key={e.id} className="summary-entry">
                            <span className="summary-entry-date">{e.date}</span>
                            <span className="summary-entry-duration">{formatDuration(e.duration)}</span>
                            <span className="summary-entry-task">{e.task}</span>
                            {e.description && <span className="summary-entry-desc">{e.description}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
