import { useState, useEffect } from 'react';
import { useAppData } from './hooks/useAppData';
import { HomePage } from './components/HomePage';
import { ProjectPage } from './components/ProjectPage';
import { WaveSetup } from './components/WaveSetup';
import './App.css';

function App() {
  const {
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
  } = useAppData();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showWaveSetup, setShowWaveSetup] = useState(false);
  const [waveToast, setWaveToast] = useState('');

  const currentProject = data.projects.find((p) => p.id === currentProjectId) ?? null;

  // If the current project was deleted, go home
  if (currentProjectId && !currentProject) {
    setCurrentProjectId(null);
  }

  // Check for OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wave') === 'connected') {
      updateWaveConfig({ connected: true });
      setWaveToast('Connected to Wave!');
      window.history.replaceState({}, '', '/');
      setTimeout(() => setWaveToast(''), 3000);
    }
  }, [updateWaveConfig]);

  return (
    <div className="app">
      {waveToast && (
        <div className="toast toast-success">{waveToast}</div>
      )}

      {currentProject ? (
        <ProjectPage
          project={currentProject}
          allEntries={data.timeEntries}
          customTasks={data.customTasks}
          timerState={data.timerState}
          waveConfig={data.waveConfig}
          onBack={() => setCurrentProjectId(null)}
          onUpdateProject={updateProject}
          onDeleteProject={(id) => {
            deleteProject(id);
            setCurrentProjectId(null);
          }}
          onAddEntry={addTimeEntry}
          onUpdateEntry={updateTimeEntry}
          onDeleteEntry={deleteTimeEntry}
          onSaveCustomTask={addCustomTask}
          onStartTimer={startTimer}
          onStopTimer={stopTimer}
          onResetTimer={resetTimer}
          onMarkEntriesBilled={markEntriesBilled}
          onMarkEntryUnbilled={markEntryUnbilled}
          onSetProjectHourlyRate={setProjectHourlyRate}
          onOpenWaveSetup={() => setShowWaveSetup(true)}
        />
      ) : (
        <HomePage
          projects={data.projects}
          timeEntries={data.timeEntries}
          onSelectProject={setCurrentProjectId}
          onAddProject={addProject}
          onOpenWaveSetup={() => setShowWaveSetup(true)}
        />
      )}

      {showWaveSetup && (
        <WaveSetup
          waveConfig={data.waveConfig}
          onUpdateConfig={updateWaveConfig}
          onClose={() => setShowWaveSetup(false)}
        />
      )}
    </div>
  );
}

export default App;
