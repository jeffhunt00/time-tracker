/**
 * Figma Code Connect mapping for ProjectCard.
 *
 * This file documents the relationship between the Figma component and the
 * React component. Publishing to Figma Dev Mode requires an Organization plan
 * — run `npm run figma:publish` when that becomes available.
 *
 * Figma component: project-card → node 25-38
 *
 * To enable live prop binding, add a "title" Text property to the Figma
 * component, then restore the figma.string('title') prop mapping below.
 */

// @ts-ignore — @figma/code-connect not installed; this file is documentation only
import figma from '@figma/code-connect';
import { ProjectCard } from './ProjectCard';

figma.connect(
  ProjectCard,
  'https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker?node-id=25-38',
  {
    example: () => (
      <ProjectCard
        title="Website Redesign"
        totalMinutes={1455}
        entryCount={8}
        lastWorkedLabel="Yesterday"
        onClick={() => {}}
      />
    ),
  }
);
