export const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const

export type Frequency = (typeof FREQUENCIES)[number]
