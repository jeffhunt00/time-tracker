import type { Project, TimeEntry } from '../types';
import { formatDuration, formatDecimalHours } from '../utils/time';

interface Props {
  projects: Project[];
  timeEntries: TimeEntry[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onOpenWaveSetup: () => void;
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

export function HomePage({ projects, timeEntries, onSelectProject, onNewProject, onOpenWaveSetup }: Props) {
  const totalTrackedMinutes = timeEntries.reduce((sum, e) => sum + e.duration, 0);

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-title-row">
          <h1>Time Tracker</h1>
          <nav>
            <button className="btn btn-primary btn-small" onClick={onNewProject}>
              New project
            </button>
            <button
              className="btn-icon-text"
              onClick={onOpenWaveSetup}
              title="Settings"
              aria-label="Settings"
            >
              ···
            </button>
          </nav>
        </div>
        {totalTrackedMinutes > 0 && (
          <p className="home-header-sub">
            {formatDuration(totalTrackedMinutes)} tracked across {projects.length}{' '}
            {projects.length === 1 ? 'project' : 'projects'}
          </p>
        )}
      </div>

      <div className="home-content">
        {projects.length === 0 ? (
          <div className="home-empty">
            <h2>Start tracking your time</h2>
            <p>Create your first project to get started.</p>
            <button className="btn btn-primary" onClick={onNewProject}>
              Create your first project
            </button>
          </div>
        ) : (
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
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
