import { useState, useEffect, useCallback } from 'react';
import type { TimerState } from '../types';
import { TaskSelector } from './TaskSelector';
import { parseDuration, formatDuration, msToMinutes, formatTimer } from '../utils/time';

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
    reference?: string;
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
  const [collapsed, setCollapsed] = useState(true);
  const [task, setTask] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');

  const isRunningOnThisProject = timerState.isRunning && timerState.projectId === projectId;

  const getElapsed = useCallback(() => {
    if (!timerState.isRunning) return timerState.elapsed;
    const running = timerState.startTime ? Date.now() - timerState.startTime : 0;
    return timerState.elapsed + running;
  }, [timerState]);

  useEffect(() => {
    setTimerDisplay(formatTimer(getElapsed()));
    if (!timerState.isRunning) return;
    const interval = setInterval(() => setTimerDisplay(formatTimer(getElapsed())), 1000);
    return () => clearInterval(interval);
  }, [timerState.isRunning, getElapsed]);

  // When timer stops, auto-fill duration and expand form
  useEffect(() => {
    if (!timerState.isRunning && timerState.elapsed > 0 && timerState.projectId === projectId) {
      const minutes = msToMinutes(timerState.elapsed);
      if (minutes > 0) {
        setDurationInput(formatDuration(minutes));
        setCollapsed(false);
      }
      if (timerState.task) setTask(timerState.task);
    }
  }, [timerState.isRunning, timerState.elapsed, timerState.projectId, projectId, timerState.task]);

  function expand() {
    setCollapsed(false);
  }

  function handleBarTaskChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTask(e.target.value);
    if (e.target.value) setCollapsed(false);
  }

  function handleTimerToggle() {
    if (isRunningOnThisProject) {
      const elapsed = onStopTimer();
      const minutes = msToMinutes(elapsed);
      if (minutes > 0) setDurationInput(formatDuration(minutes));
      setCollapsed(false);
    } else if (projectId) {
      onStartTimer(projectId, task);
    }
  }

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
      reference: reference.trim() || undefined,
    });
    setTask('');
    setDurationInput('');
    setDescription('');
    setReference('');
    setDate(new Date().toISOString().split('T')[0]);
    setErrors({});
    setCollapsed(true);
  }

  function handleCancel() {
    setTask('');
    setDurationInput('');
    setDescription('');
    setReference('');
    setErrors({});
    setCollapsed(true);
  }

  const parsedDuration = parseDuration(durationInput);
  const durationPreview = parsedDuration && parsedDuration > 0 ? `= ${formatDuration(parsedDuration)}` : null;

  return (
    <form className={`time-entry-form${!collapsed ? ' form-expanded' : ''}`} onSubmit={handleSubmit}>
      {/* Add bar (always visible) */}
      <div className={`add-bar${!collapsed ? ' add-bar--expanded' : ''}`}>
        <button
          type="button"
          className="add-bar-plus"
          onClick={expand}
          aria-label="Add time entry"
        >
          +
        </button>
        <input
          className="add-bar-task-input"
          placeholder="What are you working on?"
          value={collapsed ? '' : task}
          onChange={handleBarTaskChange}
          onFocus={expand}
          aria-label="Task name"
        />
        <div className="add-bar-timer">
          <span className={`add-bar-timer-display${isRunningOnThisProject ? ' running' : ''}`}>
            {isRunningOnThisProject ? timerDisplay : '00:00:00'}
          </span>
          <button
            type="button"
            className={`timer-btn${isRunningOnThisProject ? ' stop' : ' start'}`}
            onClick={handleTimerToggle}
            aria-label={isRunningOnThisProject ? 'Stop timer' : 'Start timer'}
          >
            {isRunningOnThisProject ? '■' : '▶'}
          </button>
        </div>
      </div>

      {/* Expanded form */}
      {!collapsed && (
        <div className="add-form-expanded">
          <div className="form-row">
            <label>Task <span className="required">*</span></label>
            <TaskSelector
              value={task}
              onChange={setTask}
              customTasks={customTasks}
              onSaveCustomTask={onSaveCustomTask}
            />
            {errors.task && <span className="error">{errors.task}</span>}
          </div>

          <div className="form-row">
            <label>Duration <span className="required">*</span></label>
            <div className="duration-field">
              <input
                type="text"
                placeholder='e.g. "1h 30m", "1.5", "90m", "1:30"'
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                className="form-input duration-field-input"
              />
              {isRunningOnThisProject && (
                <span className="add-bar-timer-display running" style={{ fontSize: '12px', minWidth: 'auto' }}>
                  {timerDisplay}
                </span>
              )}
            </div>
            {durationPreview && <span className="duration-preview">{durationPreview}</span>}
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
            <label>Reference</label>
            <input
              type="text"
              placeholder="JIRA-123, PO#, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
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

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary btn-small">
              Log Entry
            </button>
            <button type="button" className="btn btn-small" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
