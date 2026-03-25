import { useState } from 'react';
import type { Project, TimeEntry } from '../types';
import { formatDuration, formatDecimalHours } from '../utils/time';

interface Props {
  projects: Project[];
  timeEntries: TimeEntry[];
  onSelectProject: (id: string) => void;
  onAddProject: (title: string) => string;
}

function getProjectStats(projectId: string, timeEntries: TimeEntry[]) {
  const entries = timeEntries.filter((e) => e.projectId === projectId);
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const sortedByDate = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const lastEntry = sortedByDate[0] ?? null;
  return { count: entries.length, totalMinutes, lastEntry };
}

function formatLastWorked(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diff > 365 ? 'numeric' : undefined });
}

export function HomePage({ projects, timeEntries, onSelectProject, onAddProject }: Props) {
  const [newTitle, setNewTitle] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const id = onAddProject(title);
    setNewTitle('');
    onSelectProject(id);
  }

  const totalTrackedMinutes = timeEntries.reduce((sum, e) => sum + e.duration, 0);

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-text">
          <h1>Time Tracker</h1>
          {totalTrackedMinutes > 0 && (
            <p className="home-header-sub">
              {formatDuration(totalTrackedMinutes)} tracked across {projects.length}{' '}
              {projects.length === 1 ? 'project' : 'projects'}
            </p>
          )}
        </div>
      </div>

      <div className="home-content">
        {projects.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">⏱</div>
            <h2>Start tracking your time</h2>
            <p>Create your first project to get started.</p>
            <form className="new-project-form new-project-form--hero" onSubmit={handleAdd}>
              <input
                type="text"
                className="form-input"
                placeholder="Project name..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={!newTitle.trim()}>
                Create Project
              </button>
            </form>
          </div>
        ) : (
          <>
            <form className="new-project-form" onSubmit={handleAdd}>
              <input
                type="text"
                className="form-input"
                placeholder="New project name..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!newTitle.trim()}>
                New Project
              </button>
            </form>

            <div className="project-grid">
              {projects.map((project) => {
                const { count, totalMinutes, lastEntry } = getProjectStats(project.id, timeEntries);
                return (
                  <button
                    key={project.id}
                    className="project-card"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="project-card-body">
                      <h2 className="project-card-title">{project.title}</h2>
                      <div className="project-card-hours">
                        {totalMinutes > 0 ? (
                          <>
                            {formatDuration(totalMinutes)}
                            <span className="project-card-decimal"> · {formatDecimalHours(totalMinutes)}h</span>
                          </>
                        ) : (
                          <span className="project-card-no-time">No time logged</span>
                        )}
                      </div>
                      <div className="project-card-meta">
                        {count > 0 && (
                          <span>{count} {count === 1 ? 'entry' : 'entries'}</span>
                        )}
                        {lastEntry && (
                          <span>Last worked {formatLastWorked(lastEntry.date)}</span>
                        )}
                      </div>
                    </div>
                    <span className="project-card-chevron">›</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
