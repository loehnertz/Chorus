import { Frequency } from '@prisma/client'

export interface UserSummary {
  id: string
  name: string | null
  image: string | null
}

export interface ChoreAssignmentSummary {
  id: string
  userId: string
  user: UserSummary
}

export interface ChoreWithMeta {
  id: string
  title: string
  description: string | null
  frequency: Frequency
  assignments: ChoreAssignmentSummary[]
  _count: {
    completions: number
    schedules: number
  }
}

export interface ScheduleWithChore {
  id: string
  scheduledFor: string | Date
  slotType: Frequency
  suggested: boolean
  chore: ChoreWithMeta
}
