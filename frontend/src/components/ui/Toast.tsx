import { useEffect } from 'react'

interface Props {
  message: string | null
  onDone: () => void
  duration?: number
}

/** Bottom-centre transient toast pill (matches prototype). */
export default function Toast({ message, onDone, duration = 2200 }: Props) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDone, duration)
    return () => clearTimeout(id)
  }, [message, onDone, duration])

  if (!message) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-ink text-white text-sm px-5 py-2 rounded-pill shadow-lg whitespace-nowrap pointer-events-none">
      {message}
    </div>
  )
}
