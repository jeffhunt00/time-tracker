/**
 * StatusBadge — displays an invoice status pill.
 * Maps to the `invoice-status-badge invoice-status-{variant}` CSS pattern.
 *
 * Variants:
 *   draft   → grey
 *   sent    → blue
 *   synced  → green ("Wave")
 */

export type StatusVariant = 'draft' | 'sent' | 'synced';

const LABELS: Record<StatusVariant, string> = {
  draft: 'Draft',
  sent: 'Sent',
  synced: 'Wave',
};

interface Props {
  status: StatusVariant;
  /** Override the default label for the given status. */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: Props) {
  const classes = [
    'invoice-status-badge',
    `invoice-status-${status}`,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{label ?? LABELS[status]}</span>;
}
