# Phase 4 Summary: Suggestion Algorithm & Schedules (v0.4.0)

## Completed Features

### Cascade Suggestion Algorithm
- Added `web/lib/suggestions.ts`:
  - `suggestCascadedChore({ currentFrequency, userId? })` suggests a single cascaded chore from the next higher frequency.
  - `checkCascadePace()` emits warnings when the remaining chores outnumber the remaining available cascade slots in the current cycle.
- Cascade direction (one level only):
  - `DAILY <- WEEKLY`
  - `WEEKLY <- MONTHLY`
  - `MONTHLY <- YEARLY`
- Suggestion priority:
  - Never-completed chores first
  - Then least-recently completed
  - Prefer assigned chores when `userId` is provided and assigned candidates exist
- Avoids repeats within the current cycle by excluding chores already scheduled in the current week/month/year.

### Pace Warning Logic
- `checkCascadePace()` compares remaining chores vs remaining slots:
  - WEEKLY chores vs remaining days in the current week
  - MONTHLY chores vs remaining weeks in the current month (approx: `ceil(remainingDays/7)`)
  - YEARLY chores vs remaining months in the current year

### Schedules API
- Added schedule endpoints (all protected by `requireApprovedUserApi()`):
  - `GET /api/schedules` lists schedules with optional filters: `from`, `to`, `frequency` (filters by `slotType`)
  - `POST /api/schedules` creates a schedule: `{ choreId, scheduledFor, slotType, suggested? }`
  - `DELETE /api/schedules/[id]` deletes a schedule
  - `POST /api/schedules/suggest` returns `{ suggestion, paceWarnings }` for `{ currentFrequency, userId? }` (also accepts `slotType` as an alias)

### Zod Validation
- Extended `web/lib/validations.ts` with schedule schemas:
  - `createScheduleSchema`
  - `scheduleSuggestSchema` (supports both `currentFrequency` and `slotType`)
  - `listSchedulesQuerySchema` (validates date range + frequency)

### Repo Hygiene
- Updated `web/eslint.config.mjs` to ignore `coverage/**` so local test artifacts do not affect lint.

## File Structure

```text
web/
  app/api/schedules/
    route.ts
    __tests__/route.test.ts
    [id]/
      route.ts
      __tests__/route.test.ts
    suggest/
      route.ts
      __tests__/route.test.ts
  lib/
    suggestions.ts
    __tests__/suggestions.test.ts
    validations.ts
    __tests__/validations.test.ts
  docs/PHASE_4_SUMMARY.md
  eslint.config.mjs
```

## Key Implementation Details

- Suggestion and pace logic use UTC-based cycle windows to avoid local timezone drift in comparisons.
- `scheduleSuggestSchema` accepts both `currentFrequency` (PLAN.md) and `slotType` (existing API convention) to keep the API forward-compatible.
- Schedule suggestion endpoint returns both the suggested chore (or `null`) and pace warnings so the UI can display recommendations alongside urgency signals.

## Database Changes

No schema changes.

## Testing Status

- [x] `lib/suggestions.ts` unit tests (suggestion ordering, assignment preference, cycle exclusion, pace warnings)
- [x] `GET/POST /api/schedules` route tests
- [x] `DELETE /api/schedules/[id]` route tests
- [x] `POST /api/schedules/suggest` route tests
- [x] Updated validation tests for new schedule schemas
- [x] `npm run lint && npm run test && npm run build` passes

## Known Limitations

- Monthly pace uses a simple week approximation (`ceil(daysRemaining/7)`); a calendar-week aware model can be added once the schedule UI (Phase 6) clarifies semantics.
- `GET /api/schedules` currently returns all matching rows (no pagination), which is acceptable for single-household scope but may need pagination later.

## Next Steps

Phase 5 (v0.5.0) 
- Build the dashboard shell and chore management UI
- Wire UI to the CRUD + schedule APIs
- Add UI components and page-level tests per PLAN.md
