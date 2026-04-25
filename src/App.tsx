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
  } = useAppData();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [autoFocusTitle, setAutoFocusTitle] = useState(false);
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

  function handleNewProject() {
    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const day = now.getDate();
    const title = `New Project ${month} ${day}`;
    const id = addProject(title);
    setAutoFocusTitle(true);
    setCurrentProjectId(id);
  }

  function handleSelectProject(id: string) {
    setAutoFocusTitle(false);
    setCurrentProjectId(id);
  }

  function handleBack() {
    setAutoFocusTitle(false);
    setCurrentProjectId(null);
  }

  return (
    <div className="app">
      {waveToast && (
        <div className="toast toast-success">{waveToast}</div>
      )}

      {currentProject ? (
        <ProjectPage
          project={currentProject}
          autoFocusTitle={autoFocusTitle}
          allEntries={data.timeEntries}
          customTasks={data.customTasks}
          timerState={data.timerState}
          waveConfig={data.waveConfig}
          onBack={handleBack}
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
          invoices={data.invoices}
          onCreateInvoice={createInvoiceRecord}
          onAddEntriesToInvoice={addEntriesToInvoice}
          onUpdateInvoice={updateInvoice}
          onDeleteInvoice={deleteInvoice}
          onMarkEntriesBilled={markEntriesBilled}
          onMarkEntryUnbilled={markEntryUnbilled}
          onSetProjectHourlyRate={setProjectHourlyRate}
          onOpenWaveSetup={() => setShowWaveSetup(true)}
        />
      ) : (
        <HomePage
          projects={data.projects}
          timeEntries={data.timeEntries}
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
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
