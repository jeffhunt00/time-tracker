export interface Project {
  id: string;
  title: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  task: string;
  duration: number; // in minutes
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  createdAt: string;
}

export interface TimerState {
  isRunning: boolean;
  projectId: string | null;
  task: string;
  startTime: number | null; // timestamp
  elapsed: number; // ms accumulated before current run
}

export interface AppData {
  projects: Project[];
  timeEntries: TimeEntry[];
  customTasks: string[];
  timerState: TimerState;
  hasOnboarded: boolean;
}

export const PRESET_TASKS = {
  Design: [
    'Wireframing',
    'Prototyping',
    'Visual Design',
    'User Research',
    'Usability Testing',
    'Design Review',
    'Design System Work',
    'Information Architecture',
    'Interaction Design',
  ],
  General: [
    'Meetings',
    'Admin',
    'Email/Communication',
    'Project Management',
    'Invoicing',
    'Strategy/Planning',
  ],
} as const;
