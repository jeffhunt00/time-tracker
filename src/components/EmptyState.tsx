/**
 * EmptyState — zero-data placeholder.
 *
 * Two visual modes:
 *   inline (default) — uses `empty-state` CSS class; a simple centred message
 *                      used inside lists and grouped views.
 *   hero             — uses `home-empty` CSS class; larger block with an
 *                      optional heading, used on the home page.
 *
 * The `action` slot accepts any node (typically a <Button>) rendered below
 * the message.
 */

import React from 'react';

interface Props {
  /** Visual mode. Defaults to "inline". */
  mode?: 'inline' | 'hero';
  /** Optional heading text (rendered as <h2> in hero mode). */
  heading?: string;
  /** Descriptive message text. */
  message: string;
  /** Optional action element (e.g. a <Button>). */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ mode = 'inline', heading, message, action, className }: Props) {
  if (mode === 'hero') {
    const classes = ['home-empty', className ?? ''].filter(Boolean).join(' ');
    return (
      <div className={classes}>
        {heading && <h2 className="home-empty-heading">{heading}</h2>}
        <p>{message}</p>
        {action && <div className="home-empty-action">{action}</div>}
      </div>
    );
  }

  const classes = ['empty-state', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <p>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
