import type { AppData, TimerState, WaveConfig } from '../types';

const STORAGE_KEY = 'timetracker_data';

const DEFAULT_TIMER: TimerState = {
  isRunning: false,
  projectId: null,
  task: '',
  startTime: null,
  elapsed: 0,
};

const DEFAULT_WAVE_CONFIG: WaveConfig = {
  connected: false,
};

const DEFAULT_DATA: AppData = {
  projects: [],
  timeEntries: [],
  customTasks: [],
  timerState: DEFAULT_TIMER,
  hasOnboarded: false,
  waveConfig: DEFAULT_WAVE_CONFIG,
};

function migrateData(data: AppData): AppData {
  return {
    ...data,
    waveConfig: data.waveConfig ?? DEFAULT_WAVE_CONFIG,
    timeEntries: data.timeEntries.map((entry) => ({
      billedStatus: 'unbilled' as const,
      ...entry,
    })),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    return migrateData({ ...DEFAULT_DATA, ...parsed });
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
