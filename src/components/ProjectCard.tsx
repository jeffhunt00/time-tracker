import { formatDuration, formatDecimalHours } from '../utils/time';

export interface ProjectCardProps {
  title: string;
  totalMinutes: number;
  entryCount: number;
  lastWorkedLabel?: string;
  onClick: () => void;
}

export function ProjectCard({
  title,
  totalMinutes,
  entryCount,
  lastWorkedLabel,
  onClick,
}: ProjectCardProps) {
  return (
    <button className="project-card" onClick={onClick}>
      <div className="project-card-body">
        <h2 className="project-card-title">{title}</h2>
        <div className="project-card-hours">
          {totalMinutes > 0 ? (
            <>
              {formatDuration(totalMinutes)}
              <span className="project-card-decimal">
                {' '}· {formatDecimalHours(totalMinutes)}h
              </span>
            </>
          ) : (
            <span className="project-card-no-time">No time logged</span>
          )}
        </div>
        <div className="project-card-meta">
          {entryCount > 0 && (
            <span>
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </span>
          )}
          {lastWorkedLabel && <span>Last worked {lastWorkedLabel}</span>}
        </div>
      </div>
    </button>
  );
}
