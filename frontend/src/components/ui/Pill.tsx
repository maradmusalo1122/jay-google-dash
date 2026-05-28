import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** Generic pill button — used for filters, quarter switchers, etc. */
export default function Pill({ active, className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'text-xs px-3 py-1 rounded-pill border whitespace-nowrap transition',
        active
          ? 'bg-g-blue-l text-g-blue-d border-[#85B7EB] font-medium'
          : 'bg-surface text-ink-3 border-line hover:border-g-blue hover:text-g-blue',
        className,
      )}
      {...rest}
    />
  )
}
