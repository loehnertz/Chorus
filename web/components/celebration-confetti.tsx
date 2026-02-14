'use client'

import * as React from 'react'

export type CelebrationLaunchResult = {
  fired: boolean
  reducedMotion: boolean
}

export function useCelebrationConfetti() {
  return React.useCallback(async (): Promise<CelebrationLaunchResult> => {
    if (typeof window === 'undefined') {
      return { fired: false, reducedMotion: false }
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      return { fired: false, reducedMotion: true }
    }

    const { default: confetti } = await import('canvas-confetti')

    const colors = ['#E07A5F', '#81B29A', '#F4F1DE', '#3D405B']

    confetti({
      particleCount: 90,
      spread: 80,
      startVelocity: 48,
      scalar: 0.9,
      ticks: 170,
      origin: { x: 0.2, y: 0.72 },
      colors,
    })

    confetti({
      particleCount: 90,
      spread: 85,
      startVelocity: 48,
      scalar: 0.9,
      ticks: 170,
      origin: { x: 0.8, y: 0.72 },
      colors,
    })

    return { fired: true, reducedMotion: false }
  }, [])
}
