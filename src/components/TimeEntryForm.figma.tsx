/**
 * Figma Code Connect mapping for TimeEntryForm.
 *
 * This file documents the relationship between the Figma component and the
 * React component. Publishing to Figma Dev Mode requires an Organization plan
 * — run `npm run figma:publish` when that becomes available.
 *
 * Figma component: time-entry-form_collapsed → node 27-82
 */

// @ts-ignore — @figma/code-connect not installed; this file is documentation only
import figma from '@figma/code-connect';
import { TimeEntryForm } from './TimeEntryForm';

figma.connect(
  TimeEntryForm,
  'https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker?node-id=27-82',
  {
    example: () => (
      <TimeEntryForm
        projectId="project-id"
        timerState={{ isRunning: false, elapsed: 0, projectId: 'project-id', task: '', startTime: null }}
        customTasks={[]}
        onAddEntry={(entry) => console.log(entry)}
        onStartTimer={(projectId, task) => console.log(projectId, task)}
        onStopTimer={() => 0}
        onSaveCustomTask={(task) => console.log(task)}
      />
    ),
  }
);
