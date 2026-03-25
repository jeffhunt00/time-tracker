import type { AppData, TimerState } from '../types';

const STORAGE_KEY = 'timetracker_data';

const DEFAULT_TIMER: TimerState = {
  isRunning: false,
  projectId: null,
  task: '',
  startTime: null,
  elapsed: 0,
};

const DEFAULT_DATA: AppData = {
  projects: [],
  timeEntries: [],
  customTasks: [],
  timerState: DEFAULT_TIMER,
  hasOnboarded: false,
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
