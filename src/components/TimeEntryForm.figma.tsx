import figma from '@figma/code-connect';
import { TimeEntryForm } from './TimeEntryForm';

// Collapsed "add bar" state shown in the Figma design
figma.connect(
  TimeEntryForm,
  'https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker?node-id=27-82',
  {
    example: () => (
      <TimeEntryForm
        projectId="project-id"
        timerState={{ isRunning: false, elapsed: 0, projectId: null, task: null, startTime: null }}
        customTasks={[]}
        onAddEntry={(entry) => console.log(entry)}
        onStartTimer={(projectId, task) => console.log(projectId, task)}
        onStopTimer={() => 0}
        onSaveCustomTask={(task) => console.log(task)}
      />
    ),
  }
);
