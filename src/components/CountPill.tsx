/**
 * CountPill — a small numeric badge showing a count.
 * Maps to the `summary-group-count` CSS class.
 */

interface Props {
  count: number;
  className?: string;
}

export function CountPill({ count, className }: Props) {
  const classes = ['summary-group-count', className ?? ''].filter(Boolean).join(' ');
  return <span className={classes}>{count}</span>;
}
