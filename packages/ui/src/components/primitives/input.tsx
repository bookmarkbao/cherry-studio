import { cn } from '@cherrystudio/ui/utils'
import React, { useMemo } from 'react'

export interface InputProps extends React.ComponentPropsWithRef<'input'> {
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  label?: string
  caption?: string
}

export function Input({ className, type, required, label, caption, ...props }: InputProps) {
  const id = React.useId()

  const input = useMemo(() => {
    const input = (
      <input
        type={type}
        data-slot="input"
        id={id}
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-2xs border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        required={required}
        {...props}
      />
    )

    return input
  }, [className, id, props, required, type])

  if (label !== undefined) {
    return (
      <div className="flex flex-col w-full">
        <label htmlFor={id}>{label}</label>
        {input}
        {caption && <div className="text-muted-foreground">{caption}</div>}
      </div>
    )
  }

  return input
}
