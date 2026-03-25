import { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { HomePage } from './components/HomePage';
import { ProjectPage } from './components/ProjectPage';
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
    startTimer,
    stopTimer,
    resetTimer,
  } = useAppData();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const currentProject = data.projects.find((p) => p.id === currentProjectId) ?? null;

  // If the current project was deleted, go home
  if (currentProjectId && !currentProject) {
    setCurrentProjectId(null);
  }

  return (
    <div className="app">
      {currentProject ? (
        <ProjectPage
          project={currentProject}
          allEntries={data.timeEntries}
          customTasks={data.customTasks}
          timerState={data.timerState}
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
        />
      ) : (
        <HomePage
          projects={data.projects}
          timeEntries={data.timeEntries}
          onSelectProject={setCurrentProjectId}
          onAddProject={addProject}
        />
      )}
    </div>
  );
}

export default App;
