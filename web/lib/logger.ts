export type LogMetadata = Record<string, unknown>

export function logError(context: string, error: unknown, metadata?: LogMetadata) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  if (process.env.NODE_ENV === 'production') {
    const payload = {
      level: 'error',
      context,
      message,
      stack,
      ...(metadata ? { metadata } : {}),
    }
    console.error(JSON.stringify(payload))
    return
  }

  console.error(`[${context}]`, error, metadata)
}

export function sanitizeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred. Please try again later.'
  }

  return error instanceof Error ? error.message : String(error)
}
