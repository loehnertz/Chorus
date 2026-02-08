import { Frequency } from '@prisma/client';

import { db } from '@/lib/db';
import { getCascadeSourceFrequency as getCascadeSourceFrequencyClient } from '@/lib/cascade';
import type { Frequency as AppFrequency } from '@/types/frequency';
import {
  startOfTodayUtc,
  startOfWeekUtc,
  endOfWeekUtc,
  startOfBiweekUtc,
  endOfBiweekUtc,
  startOfBimonthUtc,
  endOfBimonthUtc,
  startOfHalfYearUtc,
  endOfHalfYearUtc,
  startOfMonthUtc,
  endOfMonthUtc,
  startOfYearUtc,
  endOfYearUtc,
} from '@/lib/date';

export type PaceWarning = {
  sourceFrequency: Frequency;
  remainingChores: number;
  remainingSlots: number;
  scheduledChores: number;
  totalChores: number;
  cycleStart: Date;
  cycleEnd: Date;
  message: string;
};

export type CascadeSuggestion = {
  sourceFrequency: Frequency;
  cycleStart: Date;
  cycleEnd: Date;
  chore: {
    id: string;
    title: string;
    description: string | null;
    frequency: Frequency;
  };
};

type UtcRange = { start: Date; end: Date };

function getCycleRangeForSourceFrequency(sourceFrequency: Frequency, now: Date): UtcRange {
  switch (sourceFrequency) {
    case Frequency.WEEKLY:
      return { start: startOfWeekUtc(now), end: endOfWeekUtc(now) };
    case Frequency.BIWEEKLY:
      return { start: startOfBiweekUtc(now), end: endOfBiweekUtc(now) };
    case Frequency.MONTHLY:
      return { start: startOfMonthUtc(now), end: endOfMonthUtc(now) };
    case Frequency.BIMONTHLY:
      return { start: startOfBimonthUtc(now), end: endOfBimonthUtc(now) };
    case Frequency.SEMIANNUAL:
      return { start: startOfHalfYearUtc(now), end: endOfHalfYearUtc(now) };
    case Frequency.YEARLY:
      return { start: startOfYearUtc(now), end: endOfYearUtc(now) };
    default:
      // DAILY isn't a cascade source.
      return {
        start: startOfTodayUtc(now),
        end: new Date(startOfTodayUtc(now).getTime() + 24 * 60 * 60 * 1000),
      };
  }
}

function getRemainingSlotsForSourceFrequency(sourceFrequency: Frequency, now: Date, cycleEnd: Date) {
  const dayStart = startOfTodayUtc(now);
  const remainingDays = Math.max(0, Math.ceil((cycleEnd.getTime() - dayStart.getTime()) / (24 * 60 * 60 * 1000)));

  const countRemainingCalendarWeeksInMonthUtc = () => {
    // Weeks are Monday-start in this codebase (see startOfWeekUtc).
    // Count how many distinct week-starts remain from the current week through the final week that overlaps this month.
    const lastDayInCycle = new Date(cycleEnd);
    lastDayInCycle.setUTCDate(lastDayInCycle.getUTCDate() - 1);

    const currentWeekStart = startOfWeekUtc(now);
    const lastWeekStart = startOfWeekUtc(lastDayInCycle);
    const diffDays = Math.floor((lastWeekStart.getTime() - currentWeekStart.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) return 0;
    return Math.floor(diffDays / 7) + 1;
  };

  switch (sourceFrequency) {
    case Frequency.WEEKLY:
      // Weekly chores should fit into remaining days of the week (1 per day).
      return remainingDays;
    case Frequency.BIWEEKLY:
      // Bi-weekly chores: remaining weeks in bi-week (max 2).
      return Math.max(1, Math.ceil(remainingDays / 7));
    case Frequency.MONTHLY:
      // Monthly chores should fit into remaining weeks of the month (1 per week).
      return Math.max(1, countRemainingCalendarWeeksInMonthUtc());
    case Frequency.BIMONTHLY:
      // Bi-monthly chores: remaining months in bi-month (max 2).
      return Math.max(1, Math.ceil(remainingDays / 30));
    case Frequency.SEMIANNUAL:
      // Semi-annual chores: remaining bi-months in half-year (max 3).
      return Math.max(1, Math.ceil(remainingDays / 60));
    case Frequency.YEARLY:
      // Yearly chores should fit into remaining months of the year (1 per month).
      return 12 - now.getUTCMonth();
    default:
      return 0;
  }
}

export function getCascadeSourceFrequency(currentFrequency: Frequency | `${Frequency}`): Frequency | null {
  // Keep server-side logic in sync with the client cascade mapping.
  const source = getCascadeSourceFrequencyClient(currentFrequency as unknown as AppFrequency);
  return source ? (source as unknown as Frequency) : null;
}

export async function suggestCascadedChore(params: {
  currentFrequency: Frequency | `${Frequency}`;
  userId?: string;
  now?: Date;
}): Promise<CascadeSuggestion | null> {
  const now = params.now ?? new Date();
  const sourceFrequency = getCascadeSourceFrequency(params.currentFrequency);
  if (!sourceFrequency) return null;

  const { start: cycleStart, end: cycleEnd } = getCycleRangeForSourceFrequency(sourceFrequency, now);

  const scheduled = await db.schedule.findMany({
    where: {
      hidden: false,
      scheduledFor: { gte: cycleStart, lt: cycleEnd },
      chore: { frequency: sourceFrequency },
    },
    distinct: ['choreId'],
    select: { choreId: true },
  });

  const scheduledIds = scheduled.map((s) => s.choreId);

  const baseWhere = {
    frequency: sourceFrequency,
    ...(scheduledIds.length ? { id: { notIn: scheduledIds } } : {}),
  } as const;

  const select = {
    id: true,
    title: true,
    description: true,
    frequency: true,
  } as const;

  // Prefer chores assigned to the user when possible, without pulling assignments for every chore.
  const userId = params.userId;
  const chores = userId
    ? await db.chore.findMany({
        where: { ...baseWhere, assignments: { some: { userId } } },
        select,
      })
    : [];

  const candidates = chores.length
    ? chores
    : await db.chore.findMany({
        where: baseWhere,
        select,
      });

  if (!candidates.length) return null;

  const ids = candidates.map((c) => c.id);

  const lastCompletion = await db.choreCompletion.groupBy({
    by: ['choreId'],
    where: { choreId: { in: ids } },
    _max: { completedAt: true },
  });
  const lastById = new Map(lastCompletion.map((r) => [r.choreId, r._max.completedAt] as const));

  candidates.sort((a, b) => {
    const aLast = lastById.get(a.id);
    const bLast = lastById.get(b.id);

    const aNever = !aLast;
    const bNever = !bLast;
    if (aNever !== bNever) return aNever ? -1 : 1;

    const aMs = aLast?.getTime() ?? 0;
    const bMs = bLast?.getTime() ?? 0;
    if (aMs !== bMs) return aMs - bMs;

    return a.title.localeCompare(b.title);
  });

  const top = candidates[0];
  return {
    sourceFrequency,
    cycleStart,
    cycleEnd,
    chore: {
      id: top.id,
      title: top.title,
      description: top.description ?? null,
      frequency: top.frequency,
    },
  };
}

export async function checkCascadePace(params?: { now?: Date }): Promise<PaceWarning[]> {
  const now = params?.now ?? new Date();
  const sources: Frequency[] = [
    Frequency.WEEKLY,
    Frequency.BIWEEKLY,
    Frequency.MONTHLY,
    Frequency.BIMONTHLY,
    Frequency.SEMIANNUAL,
    Frequency.YEARLY,
  ];

  const warnings = await Promise.all(
    sources.map(async (sourceFrequency) => {
      const { start: cycleStart, end: cycleEnd } = getCycleRangeForSourceFrequency(sourceFrequency, now);
      const remainingSlots = getRemainingSlotsForSourceFrequency(sourceFrequency, now, cycleEnd);

      const [totalChores, scheduledDistinct] = await Promise.all([
        db.chore.count({ where: { frequency: sourceFrequency } }),
        db.schedule.findMany({
          where: {
            hidden: false,
            scheduledFor: { gte: cycleStart, lt: cycleEnd },
            chore: { frequency: sourceFrequency },
          },
          distinct: ['choreId'],
          select: { choreId: true },
        }),
      ]);

      const scheduledChores = scheduledDistinct.length;
      const remainingChores = Math.max(0, totalChores - scheduledChores);

      if (remainingChores <= remainingSlots) return null;

      return {
        sourceFrequency,
        remainingChores,
        remainingSlots,
        scheduledChores,
        totalChores,
        cycleStart,
        cycleEnd,
        message: `Behind pace for ${sourceFrequency}: ${remainingChores} remaining with only ${remainingSlots} slots left in this cycle.`,
      } satisfies PaceWarning;
    }),
  );

  return warnings.filter((w): w is PaceWarning => w !== null);
}
