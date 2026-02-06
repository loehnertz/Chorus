import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white',
          'px-4 py-2.5 text-base leading-tight sm:min-h-12',
          'placeholder:text-[var(--color-charcoal)]/50',
          'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
          'focus-visible:border-[var(--color-terracotta)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
