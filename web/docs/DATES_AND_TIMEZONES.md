# Dates and Timezones

Chorus uses a single canonical timezone for server-side logic: **UTC**.

This avoids ambiguous behavior across:
- local development machines
- Vercel serverless runtimes
- different user locales

## Canonical Storage

- Prisma `DateTime` values (e.g. `Schedule.scheduledFor`, `ChoreCompletion.completedAt`) are treated as **instants in UTC**.
- Cycle windows (week/month/year) are computed using **UTC midnight boundaries**.
- Weeks start on **Monday**.

## API Input Semantics

For all API endpoints that accept date inputs (body or query params):

Accepted formats:
- `YYYY-MM-DD` (date-only) -> interpreted as **UTC midnight** for that date
- ISO datetime with explicit timezone: `...Z` or `...+/-HH:MM`

Rejected:
- ISO datetime *without* timezone (e.g. `2026-02-15T00:00:00`) because JavaScript interprets it as **local time**, which is ambiguous.

## Planning / Suggestion Anchor

`POST /api/schedules/suggest` accepts an optional planning date (`forDate` or `scheduledFor`).

- If provided, all cycle computations (suggestion cycle + pace warnings) are anchored to that date.
- If omitted, computations are anchored to the server's current time.
