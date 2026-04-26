/**
 * Figma Code Connect mapping for Button.
 *
 * This file documents the relationship between the Figma component and the
 * React component. Publishing to Figma Dev Mode requires an Organization plan
 * — run `npm run figma:publish` when that becomes available.
 *
 * Figma components:
 *   btn-primary_small  → node 25-22
 *   btn-icon-text      → node 25-23
 *
 * To enable live prop binding, add a "Label" Text property to each
 * Figma component, then restore the figma.string('Label') prop mapping below.
 */

// @ts-ignore — @figma/code-connect not installed; this file is documentation only
import figma from '@figma/code-connect';
import { Button } from './Button';

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
