import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(
          'inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-[var(--radius-md)] text-center font-semibold leading-none tracking-[0.01em] whitespace-nowrap',
          'transform-gpu transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[var(--shadow-focus)]',
          'active:scale-[0.99] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-55',
          {
            'bg-[var(--color-terracotta)] text-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lifted)] hover:-translate-y-0.5':
              variant === 'primary',
            'bg-[var(--color-sage)] text-[var(--color-charcoal)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lifted)] hover:-translate-y-0.5':
              variant === 'secondary',
            'border border-[var(--color-charcoal)]/30 bg-white text-[var(--color-charcoal)] shadow-[var(--shadow-soft)]/40 hover:bg-[var(--color-cream)]/60':
              variant === 'tertiary',
          },
          {
            'min-h-11 px-5 py-2.5 text-sm sm:min-h-12 sm:px-6': size === 'default',
            'min-h-10 px-4 py-2 text-sm': size === 'sm',
            'min-h-12 px-7 py-3 text-base sm:min-h-13 sm:px-8': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
