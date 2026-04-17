import { useState, useMemo } from 'react';
import type { Project, TimeEntry, TimerState, WaveConfig, Invoice } from '../types';
import { TimeEntryForm } from './TimeEntryForm';
import { TimeEntryList } from './TimeEntryList';
import { EntryToolbar } from './EntryToolbar';
import type { SortMode, DateFilter, BillingFilter } from './EntryToolbar';
import { SummaryView } from './SummaryView';
import { InvoiceList } from './InvoiceList';
import { exportEntriesCSV } from '../utils/csv';
import { formatDuration, formatDecimalHours } from '../utils/time';

type View = 'tracker' | 'summary' | 'invoice';

interface Props {
  project: Project;
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
  onMarkEntriesBilled: _onMarkEntriesBilled,
  onMarkEntryUnbilled: _onMarkEntryUnbilled,
  onSetProjectHourlyRate: _onSetProjectHourlyRate,
  onOpenWaveSetup,
}: Props) {
  const [view, setView] = useState<View>('tracker');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const [activeFilter, setActiveFilter] = useState<DateFilter | null>(null);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all');

  // Entry selection for invoicing
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
          return (
            new Date(b.date).getTime() - new Date(a.date).getTime() ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.date).getTime() - new Date(b.date).getTime() ||
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
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
    if (e.key === 'Escape') {
      setTitleDraft(project.title);
      setEditingTitle(false);
    }
  }

  function handleDelete() {
    onDeleteProject(project.id);
    onBack();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const visibleIds = processedEntries.map((e) => e.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  const projectInvoices = invoices.filter((inv) => inv.projectId === project.id);
  const draftInvoices = projectInvoices.filter((inv) => inv.status === 'draft');

  function handleAddToInvoice(invoiceId: string) {
    const ids = Array.from(selectedIds);
    onAddEntriesToInvoice(invoiceId, ids);
    setSelectedIds(new Set());
    setShowInvoicePicker(false);
  }

  function handleAddToNewInvoice() {
    const newId = onCreateInvoice(project.id);
    const ids = Array.from(selectedIds);
    onAddEntriesToInvoice(newId, ids);
    setSelectedIds(new Set());
    setShowInvoicePicker(false);
  }

  return (
    <div className="project-page">
      {/* Top bar */}
      <div className="project-page-topbar">
        <button className="back-btn" onClick={onBack}>
          <span className="back-btn-arrow">‹</span> Projects
        </button>
        <div className="project-page-topbar-right">
          {projectEntries.length > 0 && (
            <button className="btn btn-small" onClick={handleExport}>
              Export CSV
            </button>
          )}
          {showDeleteConfirm ? (
            <div className="delete-confirm-inline">
              <span className="delete-confirm-text">Delete this project?</span>
              <button className="btn btn-small btn-danger" onClick={handleDelete}>
                Yes, Delete
              </button>
              <button className="btn btn-small" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn btn-small btn-icon-text"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete project"
            >
              ···
            </button>
          )}
        </div>
      </div>

      {/* Project header */}
      <div className="project-page-header">
        <div className="project-page-title-row">
          {editingTitle ? (
            <input
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
              onClick={() => {
                setTitleDraft(project.title);
                setEditingTitle(true);
              }}
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
              <span className="muted"> · {formatDecimalHours(totalMinutes)}h total</span>
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

      {/* View toggle */}
      <div className="project-page-view-toggle">
        <nav className="view-toggle">
          <button
            className={`btn btn-small ${view === 'tracker' ? 'btn-primary' : ''}`}
            onClick={() => setView('tracker')}
          >
            Tracker
          </button>
          <button
            className={`btn btn-small ${view === 'summary' ? 'btn-primary' : ''}`}
            onClick={() => setView('summary')}
          >
            Summary
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
      ) : view === 'summary' ? (
        <SummaryView
          entries={processedEntries}
          sortMode={sortMode}
          onSortChange={setSortMode}
          activeFilter={activeFilter}
          onApplyFilter={setActiveFilter}
          onClearFilter={() => setActiveFilter(null)}
          billingFilter={billingFilter}
          onBillingFilterChange={setBillingFilter}
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
          />

          {/* Select all + action bar */}
          {processedEntries.length > 0 && (
            <div className="entry-select-bar">
              <label className="entry-select-all">
                <input
                  type="checkbox"
                  checked={processedEntries.length > 0 && processedEntries.every((e) => selectedIds.has(e.id))}
                  onChange={toggleSelectAll}
                />
                <span>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : 'Select all'}
                </span>
              </label>
              {selectedIds.size > 0 && (
                <div className="entry-select-actions">
                  <span className="entry-select-total">
                    {formatDuration(
                      processedEntries
                        .filter((e) => selectedIds.has(e.id))
                        .reduce((sum, e) => sum + e.duration, 0)
                    )}
                  </span>
                  <div className="invoice-picker-wrapper">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => setShowInvoicePicker(!showInvoicePicker)}
                    >
                      Add to Invoice
                    </button>
                    {showInvoicePicker && (
                      <div className="invoice-picker-dropdown">
                        <button
                          className="invoice-picker-option"
                          onClick={handleAddToNewInvoice}
                        >
                          + New Invoice
                        </button>
                        {draftInvoices.length > 0 && (
                          <>
                            <div className="invoice-picker-divider" />
                            {draftInvoices.map((inv) => (
                              <button
                                key={inv.id}
                                className="invoice-picker-option"
                                onClick={() => handleAddToInvoice(inv.id)}
                              >
                                <span className="invoice-picker-date">{inv.dateInvoiced}</span>
                                <span className="muted">
                                  {inv.entryIds.length > 0
                                    ? `${formatDuration(inv.totalMinutes)} · ${inv.entryIds.length} entries`
                                    : 'Empty'}
                                </span>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-small"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

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
        </div>
      )}
    </div>
  );
}
