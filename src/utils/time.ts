/**
 * Parse a duration string into minutes.
 * Supports: "1h 30m", "1.5h", "1.5", "90m", "1:30", "90"
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // "1:30" format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  }

  // "1h 30m" or "1h" or "30m" format
  const hmMatch = trimmed.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?$/i);
  if (hmMatch && (hmMatch[1] || hmMatch[2])) {
    const hours = parseFloat(hmMatch[1] || '0');
    const minutes = parseFloat(hmMatch[2] || '0');
    return Math.round(hours * 60 + minutes);
  }

  // Plain number — treat as hours if it has a decimal, minutes if integer
  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (trimmed.includes('.')) {
      return Math.round(val * 60); // decimal hours
    }
    return val; // integer minutes
  }

  return null;
}

/**
 * Format minutes to display string like "1h 30m"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format minutes to decimal hours like "1.50"
 */
export function formatDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

/**
 * Format milliseconds to timer display "HH:MM:SS"
 */
export function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Format ms to duration in minutes
 */
export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}
