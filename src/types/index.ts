export interface Project {
  id: string;
  title: string;
  createdAt: string;
  hourlyRate?: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  task: string;
  duration: number; // in minutes
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  createdAt: string;
  billedStatus: 'unbilled' | 'billed';
  invoiceId?: string;
  reference?: string; // Jira ticket, PO number, etc.
}

export interface TimerState {
  isRunning: boolean;
  projectId: string | null;
  task: string;
  startTime: number | null; // timestamp
  elapsed: number; // ms accumulated before current run
}

export interface WaveConfig {
  connected: boolean;
  businessId?: string;
  businessName?: string;
  defaultCustomerId?: string;
  defaultCustomerName?: string;
  defaultProductId?: string;
  defaultProductName?: string;
  defaultHourlyRate?: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number; // decimal hours
  unitPrice: number; // hourly rate
  entryIds: string[];
}

export interface AppData {
  projects: Project[];
  timeEntries: TimeEntry[];
  customTasks: string[];
  timerState: TimerState;
  hasOnboarded: boolean;
  waveConfig: WaveConfig;
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
