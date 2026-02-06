'use client'

import * as React from 'react'
import { Toaster as SonnerToaster } from 'sonner'

function useIsDesktop(breakpointPx = 768) {
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(`(min-width: ${breakpointPx}px)`)
    const onChange = () => setIsDesktop(media.matches)

    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [breakpointPx])

  return isDesktop
}

export function Toaster() {
  const isDesktop = useIsDesktop()

  return (
    <SonnerToaster
      position={isDesktop ? 'bottom-right' : 'bottom-center'}
      duration={4000}
      toastOptions={{
        className:
          'bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lifted)] border border-[var(--color-cream)] p-4 font-[var(--font-display)] text-sm',
        classNames: {
          success: 'border-l-4 border-l-[var(--color-sage)]',
          error: 'border-l-4 border-l-red-500',
          info: 'border-l-4 border-l-[var(--color-charcoal)]',
          warning: 'border-l-4 border-l-[var(--color-terracotta)]',
        },
      }}
    />
  )
}
