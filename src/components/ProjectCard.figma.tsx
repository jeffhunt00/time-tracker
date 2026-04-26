import figma from '@figma/code-connect';
import { ProjectCard } from './ProjectCard';

figma.connect(
  ProjectCard,
  'https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker?node-id=25-38',
  {
    // TODO: add a "title" text property to this Figma component to enable live prop binding
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
