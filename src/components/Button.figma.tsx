import figma from '@figma/code-connect';
import { Button } from './Button';

// Primary small button (e.g. "New project", "Export CSV")
// TODO: add a "Label" text property to this Figma component to enable live prop binding
figma.connect(
  Button,
  'https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker?node-id=25-22',
  {
    example: () => (
      <Button variant="primary" size="small">
        New project
      </Button>
    ),
  }
);

// Icon/text button (e.g. "···" settings trigger)
// TODO: add a "Label" text property to this Figma component to enable live prop binding
figma.connect(
  Button,
  'https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker?node-id=25-23',
  {
    example: () => (
      <Button variant="icon-text" aria-label="Settings">
        ···
      </Button>
    ),
  }
);
