type RedirectError = Error & { digest?: string | null }

export function isNextRedirectError(error: RedirectError): boolean {
  const digest = typeof error.digest === 'string' ? error.digest : ''
  const message = typeof error.message === 'string' ? error.message : ''

  return digest.includes('NEXT_REDIRECT') || message.includes('NEXT_REDIRECT')
}
