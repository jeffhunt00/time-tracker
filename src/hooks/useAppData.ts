import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppData, Project, TimeEntry, TimerState, WaveConfig } from '../types';
import { loadData, saveData } from '../utils/storage';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Persist on every change
  useEffect(() => {
    saveData(data);
  }, [data]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      return next;
    });
  }, []);

  // --- Projects ---
  const addProject = useCallback(
    (title: string) => {
      const project: Project = {
        id: generateId(),
        title,
        createdAt: new Date().toISOString(),
      };
      update((d) => ({
        ...d,
        projects: [...d.projects, project],
        hasOnboarded: true,
      }));
      return project.id;
    },
    [update]
  );

  const updateProject = useCallback(
    (id: string, title: string) => {
      update((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === id ? { ...p, title } : p)),
      }));
    },
    [update]
  );

  const deleteProject = useCallback(
    (id: string) => {
      update((d) => ({
        ...d,
        projects: d.projects.filter((p) => p.id !== id),
        timeEntries: d.timeEntries.filter((e) => e.projectId !== id),
      }));
    },
    [update]
  );

  // --- Time Entries ---
  const addTimeEntry = useCallback(
    (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'billedStatus'>): string => {
      const timeEntry: TimeEntry = {
        ...entry,
        id: generateId(),
        createdAt: new Date().toISOString(),
        billedStatus: 'unbilled',
      };
      update((d) => ({
        ...d,
        timeEntries: [...d.timeEntries, timeEntry],
      }));
      return timeEntry.id;
    },
    [update]
  );

  const updateTimeEntry = useCallback(
    (id: string, fields: Partial<Omit<TimeEntry, 'id' | 'createdAt'>>) => {
      update((d) => ({
        ...d,
        timeEntries: d.timeEntries.map((e) => (e.id === id ? { ...e, ...fields } : e)),
      }));
    },
    [update]
  );

  const deleteTimeEntry = useCallback(
    (id: string) => {
      update((d) => ({
        ...d,
        timeEntries: d.timeEntries.filter((e) => e.id !== id),
      }));
    },
    [update]
  );

  // --- Custom Tasks ---
  const addCustomTask = useCallback(
    (task: string) => {
      update((d) => {
        if (d.customTasks.includes(task)) return d;
        return { ...d, customTasks: [...d.customTasks, task] };
      });
    },
    [update]
  );

  // --- Billing ---
  const markEntriesBilled = useCallback(
    (entryIds: string[], invoiceId: string) => {
      update((d) => ({
        ...d,
        timeEntries: d.timeEntries.map((e) =>
          entryIds.includes(e.id) ? { ...e, billedStatus: 'billed' as const, invoiceId } : e
        ),
      }));
    },
    [update]
  );

  const markEntryUnbilled = useCallback(
    (entryId: string) => {
      update((d) => ({
        ...d,
        timeEntries: d.timeEntries.map((e) =>
          e.id === entryId ? { ...e, billedStatus: 'unbilled' as const, invoiceId: undefined } : e
        ),
      }));
    },
    [update]
  );

  // --- Wave Config ---
  const updateWaveConfig = useCallback(
    (config: Partial<WaveConfig>) => {
      update((d) => ({
        ...d,
        waveConfig: { ...d.waveConfig, ...config },
      }));
    },
    [update]
  );

  // --- Project Hourly Rate ---
  const setProjectHourlyRate = useCallback(
    (projectId: string, rate: number) => {
      update((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId ? { ...p, hourlyRate: rate } : p
        ),
      }));
    },
    [update]
  );

  // --- Timer ---
  const updateTimer = useCallback(
    (timer: Partial<TimerState>) => {
      update((d) => ({
        ...d,
        timerState: { ...d.timerState, ...timer },
      }));
    },
    [update]
  );

  const startTimer = useCallback(
    (projectId: string, task: string) => {
      const current = dataRef.current.timerState;

      // If timer is running on a different project, stop it and save draft
      if (current.isRunning && current.projectId && current.projectId !== projectId) {
        const elapsed =
          current.elapsed + (current.startTime ? Date.now() - current.startTime : 0);
        const minutes = Math.round(elapsed / 60000);
        if (minutes > 0 && current.task) {
          addTimeEntry({
            projectId: current.projectId,
            task: current.task,
            duration: minutes,
            date: new Date().toISOString().split('T')[0],
            description: '',
          });
        }
      }

      updateTimer({
        isRunning: true,
        projectId,
        task,
        startTime: Date.now(),
        elapsed: 0,
      });
    },
    [updateTimer, addTimeEntry]
  );

  const stopTimer = useCallback((): number => {
    const current = dataRef.current.timerState;
    const elapsed =
      current.elapsed + (current.startTime ? Date.now() - current.startTime : 0);
    updateTimer({
      isRunning: false,
      startTime: null,
      elapsed,
    });
    return elapsed;
  }, [updateTimer]);

  const resetTimer = useCallback(() => {
    updateTimer({
      isRunning: false,
      projectId: null,
      task: '',
      startTime: null,
      elapsed: 0,
    });
  }, [updateTimer]);

  return {
    data,
    addProject,
    updateProject,
    deleteProject,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addCustomTask,
    markEntriesBilled,
    markEntryUnbilled,
    updateWaveConfig,
    setProjectHourlyRate,
    startTimer,
    stopTimer,
    resetTimer,
    updateTimer,
  };
}
