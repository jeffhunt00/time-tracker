import type { TimeEntry, Project } from '../types';
import { formatDecimalHours } from './time';

export function exportEntriesCSV(project: Project, entries: TimeEntry[]): void {
  if (entries.length === 0) return;

  const headers = ['Project', 'Task', 'Duration (hours)', 'Date', 'Description', 'Reference', 'Billed Status'];
  const rows = entries.map((e) => [
    csvEscape(project.title),
    csvEscape(e.task),
    formatDecimalHours(e.duration),
    e.date,
    csvEscape(e.description),
    csvEscape(e.reference ?? ''),
    e.billedStatus,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_time_entries.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
