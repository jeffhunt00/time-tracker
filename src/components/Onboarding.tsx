import { useState } from 'react';

interface Props {
  isFirstUse: boolean;
  onCreateProject: (title: string) => string;
  onSelectProject: (id: string) => void;
}

export function Onboarding({ isFirstUse, onCreateProject, onSelectProject }: Props) {
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const id = onCreateProject(title.trim());
    onSelectProject(id);
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        {isFirstUse ? (
          <>
            <h1>Welcome to TimeTracker</h1>
            <p>A simple way to track time on your client projects.</p>
            <p>Get started by creating your first project.</p>
          </>
        ) : (
          <>
            <h1>No Projects</h1>
            <p>Create a project to start tracking time.</p>
          </>
        )}
        <form onSubmit={handleSubmit} className="onboarding-form">
          <input
            type="text"
            placeholder="Project name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            autoFocus
          />
          <button type="submit" className="btn btn-primary">
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
}
