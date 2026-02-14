import { dayKeyUtc } from '@/lib/date'

export type TodayProgress = {
  completed: number
  total: number
  percent: number
}

export type ProgressComputationTask = {
  scheduleId: string
}

export type ScheduleProgressItem = {
  scheduledFor: string
  completed: boolean
  chore: {
    assigneeIds: string[]
  }
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

const CELEBRATION_PREFIX = 'chorus:celebrated'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function getSafeSessionStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

export function toTodayProgress(completed: number, total: number): TodayProgress {
  const safeTotal = Math.max(0, total)
  const safeCompleted = clamp(completed, 0, safeTotal)
  return {
    completed: safeCompleted,
    total: safeTotal,
    percent: safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0,
  }
}

export function computeProgressFromCompletionMap(
  tasks: ProgressComputationTask[],
  completionById: Record<string, string | null>
): TodayProgress {
  let completed = 0
  for (const task of tasks) {
    if (Object.prototype.hasOwnProperty.call(completionById, task.scheduleId)) {
      completed += 1
    }
  }
  return toTodayProgress(completed, tasks.length)
}

export function isTaskActionableByUser(assigneeIds: string[], userId: string) {
  return assigneeIds.length === 0 || assigneeIds.includes(userId)
}

export function computeTodayProgressFromScheduleItems(
  items: ScheduleProgressItem[],
  userId: string,
  todayDayKey: string
): TodayProgress {
  let total = 0
  let completed = 0

  for (const item of items) {
    if (dayKeyUtc(new Date(item.scheduledFor)) !== todayDayKey) continue
    if (!isTaskActionableByUser(item.chore.assigneeIds, userId)) continue

    total += 1
    if (item.completed) completed += 1
  }

  return toTodayProgress(completed, total)
}

export function shouldTriggerZeroInboxCelebration(params: {
  prevCompleted: number
  nextCompleted: number
  total: number
  alreadyCelebrated: boolean
}) {
  const { prevCompleted, nextCompleted, total, alreadyCelebrated } = params
  if (alreadyCelebrated) return false
  if (total <= 0) return false
  if (prevCompleted >= total) return false
  return nextCompleted === total
}

export function getUtcDayKey(date = new Date()) {
  return dayKeyUtc(date)
}

export function getCelebrationStorageKey(userId: string, dayKey: string) {
  return `${CELEBRATION_PREFIX}:${userId}:${dayKey}`
}

export function hasCelebratedToday(userId: string, dayKey: string, storage?: StorageLike) {
  const safeStorage = getSafeSessionStorage(storage)
  if (!safeStorage) return false
  return safeStorage.getItem(getCelebrationStorageKey(userId, dayKey)) === '1'
}

export function markCelebratedToday(userId: string, dayKey: string, storage?: StorageLike) {
  const safeStorage = getSafeSessionStorage(storage)
  if (!safeStorage) return
  safeStorage.setItem(getCelebrationStorageKey(userId, dayKey), '1')
}
