/**
 * TabBar — a row of toggle buttons where one is active at a time.
 *
 * Used for view toggles (Entries / Invoice) and filter groups
 * (group-by mode, billing filter, etc.).
 *
 * Each tab item supplies:
 *   value    — the identifier compared against `activeValue`
 *   label    — display text
 *   disabled — optional
 *
 * Renders using the existing `btn btn-small` CSS system; the active tab
 * gets `btn-primary`.  Wrap in whatever container class the call-site needs.
 */

interface TabItem<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  items: TabItem<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  className?: string;
}

export function TabBar<T extends string>({
  items,
  activeValue,
  onChange,
  className,
}: Props<T>) {
  const wrapperClass = ['view-toggle', className ?? ''].filter(Boolean).join(' ');
  return (
    <nav className={wrapperClass}>
      {items.map((item) => (
        <button
          key={item.value}
          className={`btn btn-small${activeValue === item.value ? ' btn-primary' : ''}`}
          onClick={() => onChange(item.value)}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
