/**
 * Figma Code Connect mapping for EntryToolbar.
 *
 * This file documents the relationship between the Figma component and the
 * React component. Publishing to Figma Dev Mode requires an Organization plan
 * — run `npm run figma:publish` when that becomes available.
 *
 * Figma component: entry-toolbar → node 27-103
 */

// @ts-ignore — @figma/code-connect not installed; this file is documentation only
import figma from '@figma/code-connect';
import { EntryToolbar } from './EntryToolbar';

figma.connect(
  EntryToolbar,
  'https://www.figma.com/design/l3WUHgIFDSntp3Tr0ugXAc/Time-Tracker?node-id=27-103',
  {
    example: () => (
      <EntryToolbar
        sortMode="date-desc"
        onSortChange={(mode) => console.log(mode)}
        activeFilter={null}
        onApplyFilter={(filter) => console.log(filter)}
        onClearFilter={() => {}}
        billingFilter="all"
        onBillingFilterChange={(filter) => console.log(filter)}
        groupMode="none"
        onGroupModeChange={(mode) => console.log(mode)}
      />
    ),
  }
);
