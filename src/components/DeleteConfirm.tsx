/**
 * DeleteConfirm — inline two-step delete confirmation.
 * Maps to the `delete-confirm-inline` CSS pattern.
 *
 * Renders in one of two states controlled by `pending`:
 *   false  — a single trigger button (danger-text variant by default)
 *   true   — a confirmation row: label + "Yes" (danger) + "No" buttons
 *
 * The caller owns the `pending` state so it can manage multiple rows
 * independently (only one confirmation open at a time).
 */

import { Button } from './Button';

interface Props {
  /** Whether the confirmation prompt is currently visible. */
  pending: boolean;
  /** Called when the trigger button is clicked. */
  onRequest: () => void;
  /** Called when the user confirms deletion. */
  onConfirm: () => void;
  /** Called when the user cancels. */
  onCancel: () => void;
  /** Label for the trigger button. Defaults to "Delete". */
  triggerLabel?: string;
  /** Label for the confirmation prompt. Defaults to "Delete?". */
  confirmLabel?: string;
  /** Label for the confirm action button. Defaults to "Yes". */
  confirmActionLabel?: string;
  className?: string;
}

export function DeleteConfirm({
  pending,
  onRequest,
  onConfirm,
  onCancel,
  triggerLabel = 'Delete',
  confirmLabel = 'Delete?',
  confirmActionLabel = 'Yes',
  className,
}: Props) {
  if (pending) {
    const classes = ['delete-confirm-inline', className ?? ''].filter(Boolean).join(' ');
    return (
      <div className={classes}>
        <span className="delete-confirm-text">{confirmLabel}</span>
        <Button variant="danger" size="small" onClick={onConfirm}>
          {confirmActionLabel}
        </Button>
        <Button size="small" onClick={onCancel}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="danger-text"
      size="small"
      className={className}
      onClick={onRequest}
    >
      {triggerLabel}
    </Button>
  );
}
