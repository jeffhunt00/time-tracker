import { useState } from 'react';
import type { TimeEntry } from '../types';
import { formatDuration, formatDecimalHours } from '../utils/time';
import { EntryToolbar } from './EntryToolbar';
import type { SortMode, DateFilter } from './EntryToolbar';

type GroupMode = 'task' | 'date';

interface Props {
  entries: TimeEntry[];
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  activeFilter: DateFilter | null;
  onApplyFilter: (filter: DateFilter) => void;
  onClearFilter: () => void;
}

interface TaskGroup {
  task: string;
  totalMinutes: number;
  count: number;
  entries: TimeEntry[];
}

interface DateGroup {
  date: string;
  totalMinutes: number;
  entries: TimeEntry[];
}

function groupByTask(entries: TimeEntry[]): TaskGroup[] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.task) || [];
    arr.push(e);
    map.set(e.task, arr);
  }
  return Array.from(map.entries())
    .map(([task, items]) => ({
      task,
      totalMinutes: items.reduce((sum, e) => sum + e.duration, 0),
      count: items.length,
      entries: items,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

function groupByDate(entries: TimeEntry[], sortMode: SortMode): DateGroup[] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.date) || [];
    arr.push(e);
    map.set(e.date, arr);
  }
  const groups = Array.from(map.entries()).map(([date, items]) => ({
    date,
    totalMinutes: items.reduce((sum, e) => sum + e.duration, 0),
    entries: items,
  }));

  const asc = sortMode === 'date-asc' || sortMode === 'created-asc';
  groups.sort((a, b) =>
    asc
      ? a.date.localeCompare(b.date)
      : b.date.localeCompare(a.date)
  );
  return groups;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);

  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });

  if (diff === 0) return `Today \u2014 ${formatted}`;
  if (diff === 1) return `Yesterday \u2014 ${formatted}`;
  if (diff > 1 && diff < 7) return `${weekday} \u2014 ${formatted}`;
  return `${weekday}, ${formatted}`;
}

export function SummaryView({
  entries,
  sortMode,
  onSortChange,
  activeFilter,
  onApplyFilter,
  onClearFilter,
}: Props) {
  const [groupMode, setGroupMode] = useState<GroupMode>('task');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const taskGroups = groupByTask(entries);
  const dateGroups = groupByDate(entries, sortMode);

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="summary-view">
      <EntryToolbar
        sortMode={sortMode}
        onSortChange={onSortChange}
        activeFilter={activeFilter}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />

      <div className="summary-total">
        <span className="summary-total-label">Total</span>
        <span className="summary-total-value">
          {formatDuration(totalMinutes)}{' '}
          <span className="muted">({formatDecimalHours(totalMinutes)}h)</span>
        </span>
        <span className="muted">{entries.length} entries</span>
      </div>

      <div className="summary-group-toggle">
        <button
          className={`btn btn-small ${groupMode === 'task' ? 'btn-primary' : ''}`}
          onClick={() => setGroupMode('task')}
        >
          By Task
        </button>
        <button
          className={`btn btn-small ${groupMode === 'date' ? 'btn-primary' : ''}`}
          onClick={() => setGroupMode('date')}
        >
          By Date
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No entries match the current filter.</p>
        </div>
      ) : groupMode === 'task' ? (
        <div className="summary-groups">
          {taskGroups.map((group) => {
            const expanded = expandedGroups.has(group.task);
            return (
              <div key={group.task} className="summary-group-card">
                <button
                  className="summary-group-header"
                  onClick={() => toggleGroup(group.task)}
                >
                  <span className="summary-group-expand">{expanded ? '\u25BE' : '\u25B8'}</span>
                  <span className="summary-group-name">{group.task}</span>
                  <span className="summary-group-hours">
                    {formatDuration(group.totalMinutes)}
                    <span className="muted"> ({formatDecimalHours(group.totalMinutes)}h)</span>
                  </span>
                  <span className="muted">{group.count}x</span>
                </button>
                {expanded && (
                  <div className="summary-group-entries">
                    {group.entries
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((e) => (
                        <div key={e.id} className="summary-entry">
                          <span className="summary-entry-date">{e.date}</span>
                          <span className="summary-entry-duration">{formatDuration(e.duration)}</span>
                          {e.description && (
                            <span className="summary-entry-desc">{e.description}</span>
                          )}
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
          {dateGroups.map((group) => {
            const expanded = expandedGroups.has(group.date);
            return (
              <div key={group.date} className="summary-group-card">
                <button
                  className="summary-group-header"
                  onClick={() => toggleGroup(group.date)}
                >
                  <span className="summary-group-expand">{expanded ? '\u25BE' : '\u25B8'}</span>
                  <span className="summary-group-name">{formatDateLabel(group.date)}</span>
                  <span className="summary-group-hours">
                    {formatDuration(group.totalMinutes)}
                    <span className="muted"> ({formatDecimalHours(group.totalMinutes)}h)</span>
                  </span>
                  <span className="muted">{group.entries.length} entries</span>
                </button>
                {expanded && (
                  <div className="summary-group-entries">
                    {group.entries.map((e) => (
                      <div key={e.id} className="summary-entry">
                        <span className="summary-entry-task">{e.task}</span>
                        <span className="summary-entry-duration">{formatDuration(e.duration)}</span>
                        {e.description && (
                          <span className="summary-entry-desc">{e.description}</span>
                        )}
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
  );
}
