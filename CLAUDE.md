# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chorus** is a slot-based chore tracking web application for couples and households. The core innovation is a slot-based scheduling system where users can pull tasks from frequency pools (daily, weekly, monthly, yearly) into their schedule.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Neon Auth (built on Better Auth)
- **Styling**: TailwindCSS + custom CSS variables
- **Animation**: Framer Motion
- **Deployment**: Vercel

## Common Commands

```bash
# Development
npm run dev              # Start development server (port 3000)
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma migrate dev   # Create and apply migrations
npx prisma db push       # Push schema changes without migrations
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Generate Prisma Client
npx prisma db seed       # Run seed script

# Code Quality
npm run lint             # Run ESLint
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run type-check       # Run TypeScript type checking

# Pre-commit workflow (ALWAYS run before committing)
npm run lint && npm run test && npm run build
```

## Architecture

### Slot-Based Scheduling System

The core architectural concept is that chores belong to frequency pools (DAILY, WEEKLY, MONTHLY, YEARLY), and users create "slots" that pull tasks from these pools:

- **Weekly Slot**: Can pull from DAILY or MONTHLY chore pools
- **Monthly Slot**: Can pull from YEARLY chore pool
- System suggests tasks based on least recently completed
- Users can manually override suggestions

### Key Models & Relationships

```
Household
  ├─ members (User[])
  ├─ chores (Chore[])
  └─ schedules (Schedule[])

User
  ├─ household (Household)
  ├─ assignedChores (ChoreAssignment[])
  └─ completions (ChoreCompletion[])

Chore
  ├─ frequency (DAILY | WEEKLY | MONTHLY | YEARLY)
  ├─ assignments (ChoreAssignment[])
  ├─ schedules (Schedule[])
  └─ completions (ChoreCompletion[])

Schedule (slot instance)
  ├─ chore (Chore)
  ├─ scheduledFor (DateTime)
  ├─ slotType (Frequency)
  ├─ suggested (boolean)
  └─ completions (ChoreCompletion[])
```

### Task Suggestion Algorithm

Located in `lib/suggestions.ts`, the algorithm prioritizes:
1. Never-completed tasks (highest priority)
2. Least recently completed tasks
3. User assignment matching
4. Slot type compatibility (respects frequency hierarchy)

### Directory Structure

- `app/(auth)/` - Authentication pages (login, signup)
- `app/(dashboard)/` - Protected dashboard routes with shared layout
- `app/api/` - API routes for CRUD operations and task suggestions
- `components/ui/` - Reusable UI primitives
- `components/` - Feature-specific components (chore-card, slot-picker, etc.)
- `lib/` - Shared utilities (auth config, database client, suggestion algorithm)
- `prisma/` - Database schema and migrations

## Design Philosophy: "Domestic Futurism"

The UI aesthetic is defined by:

- **Color Palette**: Terracotta (#E07A5F), Sage (#81B29A), Cream (#F4F1DE), Charcoal (#3D405B)
- **Typography**: Outfit (display) + Merriweather (body)
- **Visual Style**: Card-based layouts, organic rounded corners, generous spacing
- **Animations**: Smooth 200-300ms transitions, celebration effects on completion

When creating UI components, reference the CSS variables defined in `app/globals.css`:
- `--color-terracotta`, `--color-sage`, `--color-cream`, `--color-charcoal`
- `--font-display`, `--font-body`
- `--radius-sm/md/lg`, `--shadow-soft/lifted`

## Database Patterns

### Schema Organization
- App schema: Contains Household, Chore, Schedule, ChoreCompletion, ChoreAssignment, User
- `neon_auth` schema: Managed by Neon Auth, contains authentication tables (users, sessions, accounts)
- User model in app schema references Neon Auth user ID

### Creating Chores
Always associate chores with a household. Frequency is an enum (DAILY, WEEKLY, MONTHLY, YEARLY).

### Scheduling Flow
1. Create Schedule with `slotType` and `scheduledFor`
2. System generates suggestion via `/api/schedules/suggest`
3. User can accept or manually pick different chore
4. On completion, create ChoreCompletion linking schedule and user

### Cascading Deletes
- Deleting a Household cascades to Chores and Schedules
- Deleting a Chore cascades to Assignments and Completions
- Deleting a Schedule sets ChoreCompletion.scheduleId to null (SetNull)

## Authentication Flow

Neon Auth client configuration is in `lib/auth.ts`. The app uses:
- Neon Auth managed service (stores auth data in `neon_auth` schema)
- Session-based authentication with Better Auth SDK
- Email/password and OAuth (Google) providers
- Protected routes via middleware
- User model extension: Maps Neon Auth user ID to app User with household relationship
- Database branching: Auth state branches with database for preview environments

## API Conventions

All API routes follow RESTful patterns:
- `GET /api/chores` - List all chores for user's household
- `POST /api/chores` - Create new chore
- `GET /api/chores/[id]` - Get single chore
- `PUT /api/chores/[id]` - Update chore
- `DELETE /api/chores/[id]` - Delete chore

Special endpoints:
- `POST /api/schedules/suggest` - Get suggested task for a slot type
- `POST /api/completions` - Record task completion

## Environment Setup

Required environment variables (see `.env.example`):
```
DATABASE_URL="postgresql://..."
NEON_AUTH_PROJECT_ID="your-project-id"
NEON_AUTH_API_KEY="your-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# OAuth providers configured in Neon Auth dashboard
```

## Testing Requirements

**CRITICAL**: Unit tests are required for essentially every feature. Before implementing any feature, write tests first (TDD approach).

### Unit Testing
- Test framework: Jest + React Testing Library
- Write unit tests for all utility functions (`lib/suggestions.ts`, `lib/utils.ts`)
- Write component tests for all React components
- Write API route tests for all endpoints
- Test coverage target: >80%

### Test Organization
- `__tests__/` directory mirrors source structure
- `lib/__tests__/` for utility tests
- `components/__tests__/` for component tests
- `app/api/__tests__/` for API route tests

### Pre-Commit Workflow
**ALWAYS run before committing code:**
```bash
npm run lint && npm run test && npm run build
```
All three must pass before creating a commit. No exceptions.

### Manual Verification
In addition to automated tests, verify:
1. **Database integrity**: Use `npx prisma studio` to verify relationships
2. **Completion flow**: Create chore → schedule → complete → verify ChoreCompletion
3. **Suggestion algorithm**: Test that least-recent and never-completed tasks surface correctly
4. **Multi-user**: Create second user, verify household sharing and separate dashboards
5. **Responsive**: Test on mobile viewport, ensure touch-friendly interactions

## Implementation Status

This project is in early development. Refer to PLAN.md for the phased implementation roadmap. Current implementation follows these phases:
1. ✅ Project Setup & Foundation
2. Authentication & User Management
3. Core Data Layer & API
4. Dashboard & Main UI
5. Schedule System
6. Polish & Refinement

## Key Considerations

- **Testing**: Write unit tests for every feature BEFORE implementation (TDD). Always run lint → test → build before committing
- **Performance**: Use server components by default; only mark 'use client' when needed for interactivity
- **Accessibility**: Large touch targets (min 44x44px), semantic HTML, keyboard navigation
- **Mobile-first**: Design for mobile viewport first, then enhance for desktop
- **Animation performance**: Use transform and opacity for animations (GPU-accelerated)
- **Data consistency**: Always verify household ownership before mutations
- **Auth Integration**: User model in app schema extends Neon Auth user; always sync user ID from `neon_auth` schema
