import React from 'react';

export type ButtonVariant = 'primary' | 'danger' | 'danger-text' | 'ghost' | 'icon-text';
export type ButtonSize = 'default' | 'small';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'default',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    variant === 'icon-text' ? 'btn-icon-text' : 'btn',
    variant === 'primary' ? 'btn-primary' : '',
    variant === 'danger' ? 'btn-danger' : '',
    variant === 'danger-text' ? 'btn-danger-text' : '',
    size === 'small' ? 'btn-small' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
