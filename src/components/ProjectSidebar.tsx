import { useState } from 'react';
import type { Project, TimeEntry } from '../types';
import { formatDuration } from '../utils/time';

interface Props {
  projects: Project[];
  timeEntries: TimeEntry[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onAdd: (title: string) => string;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectSidebar({
  projects,
  timeEntries,
  activeProjectId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const id = onAdd(newTitle.trim());
    onSelect(id);
    setNewTitle('');
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setEditTitle(project.title);
  }

  function saveEdit(id: string) {
    if (editTitle.trim()) {
      onUpdate(id, editTitle.trim());
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const hasEntries = timeEntries.some((e) => e.projectId === id);
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else if (hasEntries) {
      setDeleteConfirm(id);
    } else {
      onDelete(id);
    }
  }

  function getProjectHours(projectId: string): number {
    return timeEntries
      .filter((e) => e.projectId === projectId)
      .reduce((sum, e) => sum + e.duration, 0);
  }

  return (
    <aside className="sidebar">
      <h2>Projects</h2>

      <form className="add-project-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New project..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="form-input"
        />
        <button type="submit" className="btn btn-primary btn-small">
          Add
        </button>
      </form>

      <div className="project-list">
        {projects.map((project) => {
          const totalMinutes = getProjectHours(project.id);
          return (
            <div
              key={project.id}
              className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
            >
              {editingId === project.id ? (
                <div className="project-edit">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(project.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="form-input"
                    autoFocus
                  />
                  <div className="project-edit-actions">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => saveEdit(project.id)}
                    >
                      Save
                    </button>
                    <button className="btn btn-small" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="project-info"
                    onClick={() => onSelect(project.id)}
                  >
                    <span className="project-title">{project.title}</span>
                    {totalMinutes > 0 && (
                      <span className="project-hours">{formatDuration(totalMinutes)}</span>
                    )}
                  </div>
                  <div className="project-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(project);
                      }}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className={`btn-icon ${deleteConfirm === project.id ? 'danger' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                      title={deleteConfirm === project.id ? 'Click again to confirm' : 'Delete'}
                    >
                      {deleteConfirm === project.id ? '⚠' : '✕'}
                    </button>
                    {deleteConfirm === project.id && (
                      <span className="delete-warning">
                        All entries will be deleted.{' '}
                        <button
                          className="btn btn-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(null);
                          }}
                        >
                          Cancel
                        </button>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
