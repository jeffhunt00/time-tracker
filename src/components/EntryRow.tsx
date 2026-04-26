/**
 * EntryRow — a compact, read-only display row for a single time entry.
 * Maps to the `summary-entry` CSS pattern used in grouped views and InvoiceList.
 *
 * Which fields are shown is controlled by props; all are optional except
 * `duration`.  Call sites pass only what they need.
 */

interface Props {
  duration: string;       // pre-formatted (e.g. "1h 30m")
  date?: string;
  task?: string;
  reference?: string;
  description?: string;
  className?: string;
}

export function EntryRow({ duration, date, task, reference, description, className }: Props) {
  const classes = ['summary-entry', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      {date && <span className="summary-entry-date">{date}</span>}
      <span className="summary-entry-duration">{duration}</span>
      {task && <span className="summary-entry-task">{task}</span>}
      {reference && <span className="summary-entry-ref">{reference}</span>}
      {description && <span className="summary-entry-desc">{description}</span>}
    </div>
  );
}
