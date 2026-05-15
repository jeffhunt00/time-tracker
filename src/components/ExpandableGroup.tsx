/**
 * ExpandableGroup — a collapsible card with a header row and expandable body.
 * Maps to the `summary-group-card` / `summary-group-header` CSS pattern used
 * three times in ProjectPage for task / date / reference grouped views.
 *
 * The header always shows:
 *   expand arrow · name · hours string · count pill
 *
 * When `expanded` is true the `children` are rendered inside
 * `summary-group-entries`.
 *
 * The caller owns expand state so it can manage multiple groups.
 */

import React from 'react';
import { CountPill } from './CountPill';

interface Props {
  /** Group label, e.g. "Design", "2024-03-01", "JIRA-42". */
  name: string;
  /** Pre-formatted hours string, e.g. "3h 15m (3.25h)". */
  hours: string;
  /** Entry count shown in the pill. */
  count: number;
  /** Whether the body is visible. */
  expanded: boolean;
  /** Called when the header is clicked. */
  onToggle: () => void;
  /** Row content rendered when expanded. */
  children: React.ReactNode;
  className?: string;
}

export function ExpandableGroup({
  name,
  hours,
  count,
  expanded,
  onToggle,
  children,
  className,
}: Props) {
  const cardClass = ['summary-group-card', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <button className="summary-group-header" onClick={onToggle}>
        <span className="summary-group-expand">{expanded ? '▾' : '▸'}</span>
        <span className="summary-group-name">{name}</span>
        <span className="summary-group-hours">{hours}</span>
        <CountPill count={count} />
      </button>
      {expanded && <div className="summary-group-entries">{children}</div>}
    </div>
  );
}
