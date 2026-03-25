import { useState, useEffect } from 'react';
import type { TimerState } from '../types';
import { TaskSelector } from './TaskSelector';
import { Timer } from './Timer';
import { parseDuration, formatDuration, msToMinutes } from '../utils/time';

interface Props {
  projectId: string;
  timerState: TimerState;
  customTasks: string[];
  onAddEntry: (entry: {
    projectId: string;
    task: string;
    duration: number;
    date: string;
    description: string;
  }) => void;
  onStartTimer: (projectId: string, task: string) => void;
  onStopTimer: () => number;
  onSaveCustomTask: (task: string) => void;
}

export function TimeEntryForm({
  projectId,
  timerState,
  customTasks,
  onAddEntry,
  onStartTimer,
  onStopTimer,
  onSaveCustomTask,
}: Props) {
  const [task, setTask] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // When timer stops, auto-fill duration
  useEffect(() => {
    if (
      !timerState.isRunning &&
      timerState.elapsed > 0 &&
      timerState.projectId === projectId
    ) {
      const minutes = msToMinutes(timerState.elapsed);
      if (minutes > 0) {
        setDurationInput(formatDuration(minutes));
      }
      if (timerState.task) {
        setTask(timerState.task);
      }
    }
  }, [timerState.isRunning, timerState.elapsed, timerState.projectId, projectId, timerState.task]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!task.trim()) newErrors.task = 'Task is required';
    const minutes = parseDuration(durationInput);
    if (minutes === null || minutes <= 0) newErrors.duration = 'Valid duration is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const minutes = parseDuration(durationInput)!;
    onAddEntry({
      projectId,
      task: task.trim(),
      duration: minutes,
      date: date || new Date().toISOString().split('T')[0],
      description: description.trim(),
    });

    // Reset form
    setTask('');
    setDurationInput('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setErrors({});
  }

  return (
    <form className="time-entry-form" onSubmit={handleSubmit}>
      <div className="form-row timer-row">
        <Timer
          timerState={timerState}
          activeProjectId={projectId}
          onStart={onStartTimer}
          onStop={() => {
            const elapsed = onStopTimer();
            const minutes = msToMinutes(elapsed);
            if (minutes > 0) {
              setDurationInput(formatDuration(minutes));
            }
            return elapsed;
          }}
          task={task}
        />
      </div>

      <div className="form-row">
        <label>
          Task <span className="required">*</span>
        </label>
        <TaskSelector
          value={task}
          onChange={setTask}
          customTasks={customTasks}
          onSaveCustomTask={onSaveCustomTask}
        />
        {errors.task && <span className="error">{errors.task}</span>}
      </div>

      <div className="form-row">
        <label>
          Duration <span className="required">*</span>
        </label>
        <input
          type="text"
          placeholder='e.g. "1h 30m", "1.5", "90m", "1:30"'
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          className="form-input"
        />
        {errors.duration && <span className="error">{errors.duration}</span>}
      </div>

      <div className="form-row">
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-row">
        <label>Description</label>
        <textarea
          placeholder="Optional notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Log Entry
      </button>
    </form>
  );
}
