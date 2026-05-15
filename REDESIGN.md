# Time Tracker Redesign Spec

Combined design critique and owner feedback, organized by area.

---

## Implementation decisions

Resolved questions for implementation:

- **Canonical field order** — Fixed-width fields first, variable-width last so columns align: date, duration, task, reference, description. Use this order everywhere: tracker entries, summary expanded rows, invoice line items.
- **Overflow menu ("...")** — Contains "Connect to Wave" (settings). On the home page and project page.
- **Tabs** — Two tabs on project page: Entries (merged tracker + summary) and Invoice. No third tab.
- **Dark mode** — Not implementing now. Structure CSS variables so a dark theme can be added later without refactoring (all colors via variables, no hardcoded values).
- **Timer persistence** — Timer keeps running in background when navigating away. No need to display running timer state on other pages for now.
- **Responsive grid breakpoints** — Home page project grid: 3 columns at desktop (>1024px), 2 at tablet (601–1024px), 1 at mobile (≤600px).
- **CSS variables** — Implementer chooses initial variable names and specific color values within the salmon range. Owner will review and request changes.
- **Dependencies** — Adding packages (e.g. Downshift, Radix, a date picker library) is fine.
- **Font** — Stick with system font stack (San Francisco on Mac). No custom typeface for now.
- **Components to remove/refactor** — `ProjectSidebar.tsx`: delete (not used in current flow). `SummaryView.tsx`: merge grouping logic into the tracker/entries view, then delete. `Timer.tsx`: refactor into inline timer within the add bar and duration field.

---

## 1. Home / landing

Cleaner header, card grid, streamlined creation.

- **Title row redesign** — Move "New project" button into the home title row alongside a "..." overflow menu (replacing the current "Settings" text button). Remove the standalone new-project-form input entirely.
- **Semantic nav** — Wrap the "New project" and "..." buttons in a `<nav>` element. No visual change needed — just proper semantics for assistive tech.
- **Responsive card grid** — Replace the single-column `.project-grid` list with a CSS grid that flows to 2+ columns on wider screens. Cards keep their current content (title, hours, entry count, last worked).

## 2. Project creation flow

Instant creation, inline naming.

- **Instant create + navigate** — Clicking "New project" immediately creates a project titled "New Project [date]" (e.g. "New Project Apr 24"), navigates to it, and focuses the title field with the text fully selected so typing replaces it without needing to delete first. Naming is optional.
- **Update onboarding** — The first-use empty state should also use this pattern: a single "Create your first project" button that does the same instant-create flow, no input field needed.

## 3. Project page layout

Tighter header, unified view, toolbar redesign.

- **Title row actions** — Move the export button and "..." menu into a `<nav>` container inline with the project title, matching the home page pattern.
- **Merge tracker and summary into one view** — Remove the tab toggle. The default view shows the entry list (currently "tracker"), with grouping controls (by task, by date, by reference) available in the toolbar — the same grouping that currently lives in the summary view. This eliminates the redundant split and keeps everything in one scrollable list.
- **Toolbar redesign** — The sort/filter/billing/date/select-all controls currently spill across three lines. Consolidate into a single compact row. The grouping toggle (none / by task / by date / by reference) should feel like the primary control, with sort and filters subordinate. Consider a filter-chip approach or a single "Filter" button that opens a popover with all options.
- **Custom dropdowns** — The date filter should use a modern date picker dropdown (not native `<input type="date">`), and the sort menu should use a matching custom dropdown. Both should be styled consistently with the rest of the UI.

## 4. Time entry creation

Collapsed by default, compact add bar, inline timer.

- **Collapsed entry form with add bar** — Hide the full log entry form by default. Show a compact horizontal bar with a prominent "+" button, a task label area, a tag icon, the timer display, and a play/pause button (reference: Toggl-style add bar). Clicking "+" or typing in the task area expands the full form below with all fields (task, duration, date, reference, description). The bar doubles as a quick-start timer — you can hit play directly from the bar to start timing, then fill in details when you stop.
- **Inline timer in Duration field** — When the full form is expanded, the timer lives within the Duration field area. A small play button beside the Duration input starts a timer displayed inline (replacing the text input with a running clock + stop button). Stopping fills the Duration field with elapsed time.
- **Live duration preview** — Show a small resolved value as the user types (e.g. typing "1.5" shows "= 1h 30m" below the input). Reinforces the flexible parser.
- **Accessible task selector** — Add combobox ARIA roles (`role="combobox"`, `aria-expanded`, `aria-activedescendant`), keyboard arrow-key navigation, and Escape to close. Consider Downshift or Radix for the heavy lifting.

## 5. Tracker items and entry cards

Consistent data ordering, icon actions, card best practices.

- **Consistent data ordering** — Canonical field order is: date, duration, task, reference, description. Fixed-width fields first so columns align; variable-width fields (task, description) last. Use this order everywhere: tracker list, summary expanded rows, and invoice line items.
- **Icon-only edit/delete** — Replace the text "Edit" and "Delete" buttons with small icon buttons (pencil, trash). Position them in the card's top-right corner, visible on hover or always visible but muted. Add `aria-label` for accessibility. Less visual noise for infrequently-used actions.
- **Reference color demotion** — References currently use the accent color, giving them the same visual weight as durations. Demote to `--text-secondary` so durations remain the primary numeric focal point.

## 6. Invoice view

Consistent layout, contextual actions, better labeling.

- **Fix description layout shift** — The varying field order in invoice entry rows causes descriptions to shift left/right across items. Apply the same canonical field order from section 5 so every row aligns.
- **Rename "Connect Wave" to "Send to Wave"** — Clearer intent. "Connect" implies setup; "Send to" implies action.
- **Invoice card actions as icons** — Move "Mark as unsent," "Send to Wave," and "Delete" out of the card footer. Use icon buttons (positioned like the tracker card edit/delete) with `aria-label`. Same pattern as entry cards — infrequent actions, accessible but not prominent.

## 7. Visual design overhaul

The current design has a generic, boilerplate feel — every element wrapped in bordered rounded cards on a gray background. The target is editorial, typographic, modernist: bold type, high contrast, minimal chrome.

**Reference inspirations:** Toggl/Chronow (compact add bar, restrained accent), TeuxDeux (typographic hierarchy through weight and case, thin-rule separators, almost zero UI chrome), minimalist calendar apps (whitespace as structure, floating action buttons).

### The problem

Every element carries `border: 1px solid` and `border-radius: 8px`, creating "card soup" where nothing feels connected. The `#4f46e5` indigo accent is Tailwind's default indigo-600 — the most common SaaS template color. The `#f8f9fa` gray page background with white cards is the standard dashboard pattern. The type scale is narrow (12–32px) with most text clustered at 13–14px, giving everything equal weight. Spacing is consistent but undifferentiated — no visual rhythm between sections.

### Color palette

- **Background** — Pure white (`#ffffff`). No gray page background. Content lives directly on the surface, like TeuxDeux.
- **Primary text** — Near-black (`#1a1a1a`) for headings and body. Bold and high-contrast.
- **Secondary text** — Light gray for metadata, dates, references. Genuinely small and quiet.
- **Accent** — Salmon (`#e87461` to `#f28b7d` range) for durations, active timers, and primary actions. Used sparingly — one accent color, one purpose at a time. Replaces indigo everywhere.
- **Near-monochrome by default** — The design should feel almost black-and-white with salmon as the only color. No colored backgrounds on sections, no tinted cards, no blue/green/yellow UI elements outside of semantic states. TeuxDeux is nearly colorless — items are differentiated by type alone, with only occasional subtle background tints for calendar highlights. Aim for the same restraint.
- **Semantic colors** — Dark-mode-aware tokens for success, info, error states (`--success-bg`/`--success-text`, `--info-bg`/`--info-text`, `--error-bg`/`--error-text`). Replace all hardcoded hex in badges, statuses, toasts, and Wave errors. These should be the only non-salmon colors in the UI.

### Typography

- **Dramatic size contrast** — Project titles at 36–40px. Timer/total hours at 28–32px. Entry task names at 16px bold. Metadata (dates, references) at 12px light. The spread between large and small should feel intentional, not incremental.
- **Uppercase for labels and section headers** — Use small uppercase tracking for structural labels: group headers ("WIREFRAMING," "MEETINGS"), toolbar labels, form field labels, section dividers. Like TeuxDeux's "AFTERNOON," "CAR STUFF," and list titles ("GROCERY LIST," "RESTAURANTS"). This creates hierarchy through case and letterspacing rather than size or color. Use `text-transform: uppercase; letter-spacing: 0.08em; font-size: 11–12px` for these labels.
- **Two weights** — Bold for headings, task names, and durations. Regular for everything else. No semi-bold middle ground.
- **Monospace for numbers** — Keep SF Mono with `font-variant-numeric: tabular-nums` for durations and dates. This is one of the current design's strengths.

### Borders and containers

- **Remove borders from cards and entries entirely.** Items are just text on a white surface. TeuxDeux separates list items with nothing more than a thin bottom rule — no card containers, no background color, no rounded corners. Apply the same approach to time entries and project items.
- **Thin horizontal rules as separators** — A single `1px` rule (light gray, ~`#e5e5e5`) between list items, like TeuxDeux's item separators. These rules should feel like lines on a ruled notebook, not box borders.
- **Borders only for inputs** — Form fields keep borders to signal interactivity. Consider underline-only inputs (bottom border only) for an even cleaner look.
- **Sharp corners** — `0` or `2px` border-radius on most elements. Reserve pill shapes for badges and the floating add bar only.

### Spacing

- **Bigger gaps between sections** — 48–64px between major areas (header, add bar, entry list, invoice section).
- **Tight within groups** — 4–8px between entries in a list, separated by thin rules. Entries should feel like lines on a page — close together, rhythmic, scannable. TeuxDeux's item spacing is very tight: items are separated by the thinnest possible rule, making the list feel continuous rather than chunked.
- **Generous breathing room** on the page overall — the 720px max-width is good, padding can be more generous.

### Interaction and state

- **Hover states** — Subtle and minimal. TeuxDeux shows edit controls (icons) on item hover, nothing else — no background color change, no shadow. For time entries: reveal edit/delete icon buttons on hover, otherwise hidden. The item itself doesn't change appearance.
- **Completed/billed state** — Consider strikethrough for billed entries (like TeuxDeux's completed items), with the text going to light gray. This is more editorial than a "Billed" badge and saves horizontal space.
- **Active/selected state** — A subtle background tint (barely perceptible warm gray) rather than a border or shadow.

### Shadows

- **Sparingly, for elevated interactive elements only** — The floating add bar, dropdown menus, modals. Not on cards or entries. A single soft shadow on the add bar is enough to lift it off the page. TeuxDeux uses zero shadows — everything is on the same plane. Shadows should feel like an exception, not a pattern.

### Buttons and actions

- **Primary actions** — Dark fill (`#1a1a1a`) with white text, minimal padding, sharp or barely-rounded corners. Not full-width blocks.
- **Secondary actions** — Plain text, no border, no background. Uppercase letterspaced like TeuxDeux's "+ NEW LIST" — just text that happens to be clickable. On hover, a subtle underline or color shift.
- **Timer play/stop** — The one element that gets the bold salmon circular treatment (like the Toggl/Chronow references).
- **Inline actions** — Edit/delete appear as small muted icons on hover (like TeuxDeux's item hover icons). No persistent action buttons taking up space on every entry.

### Applied to each screen

- **Home page** — Large bold title. Total hours in salmon, large. Project items are borderless: project name bold, hours in salmon below, metadata in small gray. Each separated by a thin rule. On hover, edit controls appear — no background shift. The grid layout uses whitespace between columns, not card borders.
- **Project page** — Project title at 36px bold. Total hours in salmon at 20px. The add bar floats with a light shadow — the only elevated element on the page. Below, entries are rows of text separated by thin rules: task name bold, duration in salmon monospace, date and reference in small gray. No card containers.
- **Entry form (expanded)** — Fields appear below the add bar on the white surface, no card container. Labels small, uppercase, letterspaced. Inputs use underline style (bottom border only). "Log Entry" button is small, dark, sharp-cornered — or just bold uppercase text.
- **Summary groups** — Group headers bold and uppercase with hours in salmon to the right. No card container — just bold text with a thin rule below. Expanded entries indented, tighter, smaller type. Entry count as a small salmon-tinted pill.
- **Invoice view** — Invoice headers are bold with date and total. Line items below as simple text rows. Status (Sent/Draft) as small uppercase labels, not colored badges. Actions (send, delete) as text links or hover-revealed icons.

## 8. Cross-cutting technical improvements

Accessibility and component fixes that apply everywhere.

- **SVG icon system** — Replace all unicode glyphs (✎, ✕, ▾, ›, ▸, ▾) with small inline SVGs. Consistent sizing, crisp rendering, and each gets a proper `aria-hidden="true"` paired with `aria-label` on the parent button.
- **Touch target sizing** — All icon buttons to at least 36px (44px on mobile). Use padding/min-size on the button, not the icon itself.
