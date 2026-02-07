# Phase 6 Summary (v0.6.0) - Schedule System & Calendar

## Completed Features

- Implemented `/schedule` calendar view with month navigation
- Added day detail view showing scheduled chores for the selected date
- Added upcoming tasks panel (next 14 days) filtered to chores assigned to the current user (or unassigned)
- Implemented planning workflow with three modes:
  - Daily: schedule daily chores + 1 cascaded weekly chore
  - Weekly: schedule weekly chores + 1 cascaded monthly chore
  - Monthly: schedule monthly chores + 1 cascaded yearly chore
- Built `SlotPicker` component to fetch cascade suggestions (`POST /api/schedules/suggest`) and allow manual override
- Added completion flow for scheduled tasks using `CompletionCheckbox` and `POST /api/completions`

## File Structure

New or notable additions:

- `web/app/(dashboard)/schedule/page.tsx`
- `web/components/schedule-view.tsx`
- `web/components/slot-picker.tsx`
- `web/lib/calendar.ts`
- `web/lib/cascade.ts`

Tests:

- `web/components/__tests__/schedule-view.test.tsx`
- `web/components/__tests__/slot-picker.test.tsx`
- `web/lib/__tests__/calendar.test.ts`

## Key Implementation Details

- `/schedule` is a server-rendered page that enforces approval via `requireApprovedUser()` and hydrates a client planner (`ScheduleView`).
- Calendar rendering is UTC-first via `buildMonthGridUtc()` to avoid timezone drift in day keys.
- Slot planning creates `Schedule` records via `POST /api/schedules` and removes them via `DELETE /api/schedules/[id]`.
- Cascade selection uses `SlotPicker`:
  - Loads a suggestion from `POST /api/schedules/suggest`.
  - Schedules the selected chore into the current slot type (DAILY/WEEKLY/MONTHLY), tracking whether the suggestion was accepted.
- Completion is recorded with `POST /api/completions` and the UI refreshes server-rendered data via `router.refresh()`.

## Database Changes

- None.

## Testing Status

- Added component tests for `ScheduleView` and `SlotPicker`.
- Added unit tests for calendar grid utilities.
- Verified `npm run lint && npm run test && npm run build` passes on this branch.

## Known Limitations

- Cascade suggestions are computed relative to the server's current time (the suggest endpoint does not yet accept a target planning date).
- The UI prevents obvious duplicate scheduling on a given date, but duplicates are not prevented at the database layer.
- Weekly/monthly planning schedules chores onto a specific selected date (it does not yet distribute chores across the week/month automatically).

## Next Steps

- Phase 7: Polish (loading/skeleton refinements, error boundaries, tighter motion/interaction QA, and a completion history view).
