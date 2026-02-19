# KHA-19 Mobile-First UX Rulebook

## Objective
Redesign all app screens for phone-first usage with minimal content, clear action hierarchy, and full functional parity.

## Global Rules
1. One primary action at a time.
- Primary CTA must be in a sticky bottom action bar.
- Screen-level primary action cannot be duplicated in content body.

2. Low-frequency actions move to overflow.
- Sign out, statement access, and destructive options move to top-right overflow menus.
- Overflow items are always accessible but never visually primary.

3. Touch and spacing standards.
- Primary controls use min height 48dp.
- Secondary controls use min height 44dp.
- Horizontal page padding is 16dp.
- Card and list spacing follows 8/12/16 rhythm.

4. Predictable screen anatomy.
- Header/context
- Summary (if needed)
- Filters/scope controls (if needed)
- Content list/form
- Sticky CTA

5. Picker-first date input.
- Date actions use picker-first interactions.
- Manual date entry is never the primary path.

6. State container consistency.
- Every screen exposes concise loading, empty, and recoverable error feedback.
- Empty/error states must include next-step action when possible.

7. Copy budget.
- Keep only text required for understanding and immediate action.
- Remove duplicate subtitles when header already provides context.
- Long instructional copy moves to helper text or secondary surfaces.

8. Functional parity guardrail.
- No existing business action can be removed.
- If an action is moved, it must remain discoverable with <= 2 taps from prior location.

## Reusable Patterns
- Sticky action bar with safe-area support.
- Overflow menu for low-frequency actions.
- Empty state card with optional recovery CTA.
- Compact section cards and summary chips.
- Shared component variants for touch-size guarantees.

## Definition Of Done
- Rulebook checklist passes on all target screens.
- Each redesigned screen has exactly one obvious primary flow.
- Admin, coworker, recipient journeys retain all prior capabilities.
