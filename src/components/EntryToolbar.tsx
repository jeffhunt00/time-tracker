import { useState } from 'react';

export type SortMode = 'date-desc' | 'date-asc' | 'created-desc' | 'created-asc';

export interface DateFilter {
  from: string;
  to: string;
  label?: string;
}

const SORT_LABELS: Record<SortMode, string> = {
  'date-desc': 'Date (Latest)',
  'date-asc': 'Date (Oldest)',
  'created-desc': 'Added (Newest)',
  'created-asc': 'Added (Oldest)',
};

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getPresets(): { label: string; filter: DateFilter }[] {
  const now = new Date();
  const today = toDateStr(now);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return [
    { label: 'Today', filter: { from: today, to: today, label: 'Today' } },
    {
      label: 'This Week',
      filter: { from: toDateStr(weekStart), to: toDateStr(weekEnd), label: 'This Week' },
    },
    {
      label: 'This Month',
      filter: { from: toDateStr(monthStart), to: toDateStr(monthEnd), label: 'This Month' },
    },
  ];
}

interface Props {
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  activeFilter: DateFilter | null;
  onApplyFilter: (filter: DateFilter) => void;
  onClearFilter: () => void;
}

export function EntryToolbar({
  sortMode,
  onSortChange,
  activeFilter,
  onApplyFilter,
  onClearFilter,
}: Props) {
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const presets = getPresets();

  function handleApply() {
    if (!dateFrom && !dateTo) return;
    onApplyFilter({ from: dateFrom, to: dateTo });
    setShowFilterForm(false);
    setDateFrom('');
    setDateTo('');
  }

  function handleClear() {
    onClearFilter();
    setDateFrom('');
    setDateTo('');
    setShowFilterForm(false);
  }

  function formatFilterLabel(filter: DateFilter): string {
    if (filter.label) return filter.label;
    if (filter.from && filter.to) {
      if (filter.from === filter.to) return filter.from;
      return `${filter.from} to ${filter.to}`;
    }
    if (filter.from) return `From ${filter.from}`;
    return `Through ${filter.to}`;
  }

  return (
    <div className="entry-toolbar">
      <div className="toolbar-row">
        <div className="toolbar-left">
          {activeFilter ? (
            <span className="filter-badge">
              {formatFilterLabel(activeFilter)}
              <button
                className="filter-badge-remove"
                onClick={handleClear}
                title="Remove filter"
              >
                &times;
              </button>
            </span>
          ) : (
            <button
              className="btn btn-small"
              onClick={() => setShowFilterForm(!showFilterForm)}
            >
              Filter by Date
            </button>
          )}
        </div>
        <select
          className="sort-select"
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {showFilterForm && !activeFilter && (
        <div className="filter-form">
          <div className="filter-presets">
            {presets.map((p) => (
              <button
                key={p.label}
                className="btn btn-small"
                onClick={() => {
                  onApplyFilter(p.filter);
                  setShowFilterForm(false);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="filter-custom">
            <label>
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="form-input small"
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="form-input small"
              />
            </label>
            <button
              className="btn btn-small btn-primary"
              onClick={handleApply}
              disabled={!dateFrom && !dateTo}
            >
              Apply
            </button>
            <button className="btn btn-small" onClick={() => setShowFilterForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
