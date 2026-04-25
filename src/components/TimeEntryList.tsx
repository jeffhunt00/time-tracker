import { useState, useEffect, useRef } from 'react';
import type { TimeEntry } from '../types';
import { formatDuration, parseDuration } from '../utils/time';
import { TaskSelector } from './TaskSelector';

interface Props {
  entries: TimeEntry[];
  customTasks: string[];
  onUpdate: (id: string, fields: Partial<Omit<TimeEntry, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onSaveCustomTask: (task: string) => void;
  highlightedEntryId: string | null;
  onHighlightComplete: () => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function TimeEntryList({
  entries,
  customTasks,
  onUpdate,
  onDelete,
  onSaveCustomTask,
  highlightedEntryId,
  onHighlightComplete,
  selectedIds,
  onToggleSelect,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{
    task: string;
    duration: string;
    date: string;
    description: string;
    reference: string;
  }>({ task: '', duration: '', date: '', description: '', reference: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightedEntryId) return;
    requestAnimationFrame(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const timer = setTimeout(() => {
      onHighlightComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [highlightedEntryId, onHighlightComplete]);

  function startEdit(entry: TimeEntry) {
    setEditingId(entry.id);
    setEditFields({
      task: entry.task,
      duration: formatDuration(entry.duration),
      date: entry.date,
      description: entry.description,
      reference: entry.reference ?? '',
    });
  }

  function saveEdit(id: string) {
    const minutes = parseDuration(editFields.duration);
    if (!editFields.task.trim() || !minutes || minutes <= 0) return;
    onUpdate(id, {
      task: editFields.task.trim(),
      duration: minutes,
      date: editFields.date,
      description: editFields.description.trim(),
      reference: editFields.reference.trim() || undefined,
    });
    setEditingId(null);
  }

  function confirmDelete(id: string) {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>No time entries yet. Use the form above to log your first entry.</p>
      </div>
    );
  }

  return (
    <div className="time-entry-list">
      {entries.map((entry) => {
        const isHighlighted = entry.id === highlightedEntryId;
        return (
          <div
            key={entry.id}
            ref={isHighlighted ? highlightRef : undefined}
            className={`time-entry-item ${isHighlighted ? 'entry-highlight' : ''} ${entry.billedStatus === 'billed' ? 'is-billed' : ''}`}
          >
            {onToggleSelect && selectedIds && (
              <div className="entry-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => onToggleSelect(entry.id)}
                />
              </div>
            )}
            {editingId === entry.id ? (
              <div className="entry-edit">
                <div className="form-row">
                  <TaskSelector
                    value={editFields.task}
                    onChange={(v) => setEditFields((f) => ({ ...f, task: v }))}
                    customTasks={customTasks}
                    onSaveCustomTask={onSaveCustomTask}
                  />
                </div>
                <div className="form-row inline">
                  <input
                    type="text"
                    value={editFields.duration}
                    onChange={(e) =>
                      setEditFields((f) => ({ ...f, duration: e.target.value }))
                    }
                    className="form-input small"
                    placeholder="Duration"
                  />
                  <input
                    type="date"
                    value={editFields.date}
                    onChange={(e) =>
                      setEditFields((f) => ({ ...f, date: e.target.value }))
                    }
                    className="form-input small"
                  />
                </div>
                <input
                  type="text"
                  value={editFields.reference}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, reference: e.target.value }))
                  }
                  className="form-input small"
                  placeholder="Reference (JIRA-123, PO#, etc.)"
                />
                <textarea
                  value={editFields.description}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, description: e.target.value }))
                  }
                  className="form-input"
                  rows={2}
                  placeholder="Description"
                />
                <div className="entry-actions">
                  <button className="btn btn-small btn-primary" onClick={() => saveEdit(entry.id)}>
                    Save
                  </button>
                  <button className="btn btn-small" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="entry-main">
                  <span className="entry-date">{entry.date}</span>
                  <span className="entry-duration">{formatDuration(entry.duration)}</span>
                  <span className="entry-task">{entry.task}</span>
                </div>
                {entry.reference && (
                  <div className="entry-reference">{entry.reference}</div>
                )}
                {entry.description && (
                  <div className="entry-description">{entry.description}</div>
                )}
                <div className="entry-actions">
                  <button className="btn btn-small" onClick={() => startEdit(entry)}>
                    Edit
                  </button>
                  <button
                    className={`btn btn-small ${deleteConfirm === entry.id ? 'btn-danger' : ''}`}
                    onClick={() => confirmDelete(entry.id)}
                  >
                    {deleteConfirm === entry.id ? 'Confirm Delete' : 'Delete'}
                  </button>
                  {deleteConfirm === entry.id && (
                    <button className="btn btn-small" onClick={() => setDeleteConfirm(null)}>
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
