import { useState } from 'react';
import type { Project, TimeEntry } from '../types';
import { formatDuration } from '../utils/time';

interface Props {
  projects: Project[];
  timeEntries: TimeEntry[];
  onSelectProject: (id: string) => void;
  onAddProject: (title: string) => string;
  onOpenWaveSetup: () => void;
}

function getProjectStats(projectId: string, timeEntries: TimeEntry[]) {
  const entries = timeEntries.filter((e) => e.projectId === projectId);
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const sortedByDate = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const lastEntry = sortedByDate[0] ?? null;
  return { count: entries.length, totalMinutes, lastEntry };
}

export function HomePage({ projects, timeEntries, onSelectProject, onAddProject, onOpenWaveSetup }: Props) {
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
          <div className="home-title-row">
            <h1>Time Tracker</h1>
            <button
              className="btn btn-small btn-icon-text"
              onClick={onOpenWaveSetup}
              title="Wave Integration Settings"
            >
              Settings
            </button>
          </div>
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
                const decimalHours = totalMinutes > 0
                  ? parseFloat((totalMinutes / 60).toFixed(1)) + 'h'
                  : null;
                const lastDate = lastEntry
                  ? new Date(lastEntry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : null;
                return (
                  <button
                    key={project.id}
                    className="project-card"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="project-card-inner">
                      <h2 className="project-card-title">{project.title}</h2>
                      <div className="project-card-hours">
                        {decimalHours ?? <span className="project-card-no-time">—</span>}
                      </div>
                      <div className="project-card-meta">
                        {lastDate && (
                          <div className="project-card-meta-item">
                            <span className="project-card-meta-label">Updated</span>
                            <span className="project-card-meta-value">{lastDate}</span>
                          </div>
                        )}
                        {count > 0 && (
                          <div className="project-card-meta-item">
                            <span className="project-card-meta-label">Entries</span>
                            <span className="project-card-meta-value">{count}</span>
                          </div>
                        )}
                      </div>
                    </div>
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
