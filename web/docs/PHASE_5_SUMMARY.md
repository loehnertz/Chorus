# Phase 5 Summary (v0.5.0) - Dashboard & Main UI

## Completed Features

- Added dashboard navigation shell (desktop sidebar + mobile bottom bar) with active route styling and sign out
- Implemented toast notifications (Sonner) and wired Toaster into the app root layout
- Built new UI primitives: FrequencyBadge, Select, Textarea, Skeleton, EmptyState, Avatar, DropdownMenu
- Implemented chores management UI:
  - `/chores` page with frequency filter chips, chore grid, empty states
  - Dialog-based create/edit form with inline validation and assignee multi-select
  - Chore cards with assignments, completion counts, and edit/delete menu
- Implemented dashboard UI:
  - `/dashboard` page with stats, today's scheduled tasks, and recent activity
  - Completion checkbox interaction that records completions via `/api/completions`
- Added route-level loading skeletons for `/dashboard` and `/chores`

## File Structure

New or notable additions:

- `web/app/(dashboard)/chores/page.tsx`
- `web/app/(dashboard)/chores/loading.tsx`
- `web/app/(dashboard)/schedule/page.tsx` (Phase 6 placeholder)
- `web/app/(dashboard)/dashboard/page.tsx`
- `web/app/(dashboard)/dashboard/loading.tsx`

- `web/components/sidebar.tsx`
- `web/components/bottom-bar.tsx`
- `web/components/chore-card.tsx`
- `web/components/chore-form.tsx`
- `web/components/chores-view.tsx`
- `web/components/dashboard-stats.tsx`
- `web/components/dashboard-view.tsx`
- `web/components/todays-tasks.tsx`
- `web/components/completion-checkbox.tsx`

- `web/components/ui/frequency-badge.tsx`
- `web/components/ui/select.tsx`
- `web/components/ui/textarea.tsx`
- `web/components/ui/skeleton.tsx`
- `web/components/ui/empty-state.tsx`
- `web/components/ui/avatar.tsx`
- `web/components/ui/dropdown-menu.tsx`
- `web/components/ui/toaster.tsx`

- `web/lib/nav.ts`
- `web/lib/date.ts`
- `web/lib/streak.ts`
- `web/types/frequency.ts`

## Key Implementation Details

- Data access in pages continues to enforce approval via `requireApprovedUser()`.
- Pages fetch data server-side (Prisma) and use client components for interactions (forms, completion).
- Chore create/edit uses existing Phase 3 endpoints (`POST /api/chores`, `PUT /api/chores/[id]`, `DELETE /api/chores/[id]`).
- Task completion uses Phase 3 endpoint `POST /api/completions` and refreshes server-rendered data via `router.refresh()`.
- Deterministic Avatar background color is derived from a stable hash of `userId`.
- Dashboard streak computation is implemented in `web/lib/streak.ts` using UTC day keys.

## Database Changes

- None.

## Testing Status

- Added component tests for all new UI primitives and feature components introduced in Phase 5.
- Added page-level composition tests via `DashboardView` and `ChoresView` rendering/empty states.
- Verified `npm run lint && npm run test && npm run build` passes on this branch.

## Known Limitations

- `/schedule` is a placeholder page; the calendar/slot planning UI is implemented in Phase 6.
- Dashboard "Today's Tasks" currently shows schedules for today that are either unassigned or assigned to the current user.
- Completion duplication is not prevented at the database level (client disables re-checking per render, but the API will accept repeated completions).

## Next Steps

- Phase 6: Build the schedule/calendar view and slot planning workflow, reusing Phase 5 primitives and completion flow.
