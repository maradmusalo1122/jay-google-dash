/**
 * The colourful Google-style ringed mark used as the SAPAC Chronicle brand mark.
 * Lifted from the prototype: four arcs in Google colours with a centred dot
 * and a small red accent.
 */
type Props = { size?: number; className?: string }

export default function GoogleLogo({ size = 56, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#E8E8E8" strokeWidth="1" />
      <path d="M32 4 A28 28 0 0 1 60 32" fill="none" stroke="#4285F4" strokeWidth="7" strokeLinecap="round" />
      <path d="M60 32 A28 28 0 0 1 32 60" fill="none" stroke="#EA4335" strokeWidth="7" strokeLinecap="round" />
      <path d="M32 60 A28 28 0 0 1 4 32" fill="none" stroke="#FBBC05" strokeWidth="7" strokeLinecap="round" />
      <path d="M4 32 A28 28 0 0 1 32 4" fill="none" stroke="#34A853" strokeWidth="7" strokeLinecap="round" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="#DDDDDD" strokeWidth="0.75" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="#4285F4" strokeWidth="2" />
      <circle cx="32" cy="32" r="4" fill="#4285F4" />
      <circle cx="48" cy="10" r="3.5" fill="#EA4335" />
    </svg>
  )
}
