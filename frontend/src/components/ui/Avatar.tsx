import { cn } from '@/lib/cn'

interface Props {
  initials: string
  color?: string
  /** When set, renders the image instead of the initials. */
  photo?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  ring?: boolean
}

const SIZES = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-[11px]',
  lg: 'w-10 h-10 text-xs',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl',
}

/**
 * Mix an accent colour with white so the avatar's background is a solid
 * pastel. Solid > translucent — translucent backgrounds blend with whatever
 * sits behind them (e.g. a cover gradient), which looks muddy.
 */
function pastel(hex: string, ratio = 0.82): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i)
  if (!m) return hex
  const num = parseInt(m[1], 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const mix = (c: number) => Math.round(c + (255 - c) * ratio)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

/**
 * Initials avatar that falls back to a colour chip when no photo is set.
 * Pass `photo` (data URL or hosted URL) to render the actual image instead.
 */
export default function Avatar({
  initials,
  color = '#4285F4',
  photo,
  size = 'md',
  className,
  ring,
}: Props) {
  const sizeClass = SIZES[size]
  const ringClass = ring ? 'border-2 border-surface' : ''

  if (photo) {
    return (
      <img
        src={photo}
        alt={initials}
        className={cn(
          'inline-block rounded-full object-cover select-none',
          sizeClass,
          ringClass,
          className,
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold leading-none select-none',
        sizeClass,
        ringClass,
        className,
      )}
      style={{ backgroundColor: pastel(color), color }}
    >
      {initials}
    </span>
  )
}
