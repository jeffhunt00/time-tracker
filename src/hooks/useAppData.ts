import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppData, Project, TimeEntry, TimerState, WaveConfig, Invoice, InvoiceLineItem } from '../types';
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

  // --- Invoices ---
  const createInvoiceRecord = useCallback(
    (projectId: string, dateInvoiced?: string): string => {
      const invoice: Invoice = {
        id: generateId(),
        projectId,
        entryIds: [],
        lineItems: [],
        dateInvoiced: dateInvoiced ?? new Date().toISOString().split('T')[0],
        status: 'draft',
        totalAmount: 0,
        totalMinutes: 0,
        createdAt: new Date().toISOString(),
      };
      update((d) => ({
        ...d,
        invoices: [...d.invoices, invoice],
      }));
      return invoice.id;
    },
    [update]
  );

  const addEntriesToInvoice = useCallback(
    (invoiceId: string, entryIds: string[]) => {
      update((d) => {
        const invoice = d.invoices.find((inv) => inv.id === invoiceId);
        if (!invoice) return d;

        const newEntryIds = [...new Set([...invoice.entryIds, ...entryIds])];
        const relevantEntries = d.timeEntries.filter((e) => newEntryIds.includes(e.id));
        const totalMins = relevantEntries.reduce((sum, e) => sum + e.duration, 0);

        // Rebuild line items grouped by task
        const taskGroups = new Map<string, { minutes: number; ids: string[] }>();
        for (const e of relevantEntries) {
          const existing = taskGroups.get(e.task) || { minutes: 0, ids: [] };
          existing.minutes += e.duration;
          existing.ids.push(e.id);
          taskGroups.set(e.task, existing);
        }

        const hourlyRate = d.projects.find((p) => p.id === invoice.projectId)?.hourlyRate ?? d.waveConfig.defaultHourlyRate ?? 0;
        const lineItems: InvoiceLineItem[] = Array.from(taskGroups.entries()).map(([task, g]) => ({
          description: task,
          quantity: parseFloat((g.minutes / 60).toFixed(2)),
          unitPrice: hourlyRate,
          entryIds: g.ids,
        }));

        const totalAmount = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

        return {
          ...d,
          invoices: d.invoices.map((inv) =>
            inv.id === invoiceId
              ? { ...inv, entryIds: newEntryIds, lineItems, totalMinutes: totalMins, totalAmount }
              : inv
          ),
          timeEntries: d.timeEntries.map((e) =>
            entryIds.includes(e.id)
              ? { ...e, billedStatus: 'billed' as const, invoiceId }
              : e
          ),
        };
      });
    },
    [update]
  );

  const updateInvoice = useCallback(
    (invoiceId: string, fields: Partial<Pick<Invoice, 'dateInvoiced' | 'status' | 'waveInvoiceId' | 'waveViewUrl'>>) => {
      update((d) => {
        const invoice = d.invoices.find((inv) => inv.id === invoiceId);
        if (!invoice) return d;

        const updatedInvoice = { ...invoice, ...fields };
        const markBilled = fields.status === 'sent' || fields.status === 'synced';
        const markUnbilled = fields.status === 'draft';

        return {
          ...d,
          invoices: d.invoices.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv)),
          timeEntries: markBilled || markUnbilled
            ? d.timeEntries.map((e) =>
                invoice.entryIds.includes(e.id)
                  ? {
                      ...e,
                      billedStatus: markUnbilled ? 'unbilled' as const : 'billed' as const,
                      invoiceId: markUnbilled ? undefined : invoiceId,
                    }
                  : e
              )
            : d.timeEntries,
        };
      });
    },
    [update]
  );

  const deleteInvoice = useCallback(
    (invoiceId: string) => {
      update((d) => {
        const invoice = d.invoices.find((inv) => inv.id === invoiceId);
        return {
          ...d,
          invoices: d.invoices.filter((inv) => inv.id !== invoiceId),
          timeEntries: invoice
            ? d.timeEntries.map((e) =>
                invoice.entryIds.includes(e.id)
                  ? { ...e, billedStatus: 'unbilled' as const, invoiceId: undefined }
                  : e
              )
            : d.timeEntries,
        };
      });
    },
    [update]
  );

  // --- Billing (legacy compat) ---
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
    createInvoiceRecord,
    addEntriesToInvoice,
    updateInvoice,
    deleteInvoice,
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
