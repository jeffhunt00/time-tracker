import { useState, useEffect, useCallback } from 'react';
import type { TimerState } from '../types';
import { formatTimer } from '../utils/time';

interface Props {
  timerState: TimerState;
  activeProjectId: string | null;
  onStart: (projectId: string, task: string) => void;
  onStop: () => number;
  task: string;
}

export function Timer({ timerState, activeProjectId, onStart, onStop, task }: Props) {
  const [display, setDisplay] = useState('00:00:00');

  const getElapsed = useCallback(() => {
    if (!timerState.isRunning) return timerState.elapsed;
    const running = timerState.startTime ? Date.now() - timerState.startTime : 0;
    return timerState.elapsed + running;
  }, [timerState]);

  useEffect(() => {
    setDisplay(formatTimer(getElapsed()));
    if (!timerState.isRunning) return;

    const interval = setInterval(() => {
      setDisplay(formatTimer(getElapsed()));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState.isRunning, getElapsed]);

  const isRunningOnThisProject =
    timerState.isRunning && timerState.projectId === activeProjectId;

  function handleToggle() {
    if (isRunningOnThisProject) {
      onStop();
    } else if (activeProjectId) {
      onStart(activeProjectId, task);
    }
  }

  return (
    <div className="timer">
      <div className={`timer-display ${timerState.isRunning ? 'running' : ''}`}>
        {display}
      </div>
      <button
        type="button"
        className={`timer-btn ${isRunningOnThisProject ? 'stop' : 'start'}`}
        onClick={handleToggle}
        disabled={!activeProjectId || (!isRunningOnThisProject && !task)}
        title={!task && !isRunningOnThisProject ? 'Select a task first' : ''}
      >
        {isRunningOnThisProject ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
