import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const WIDTHS = {
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[820px]',
}

export default function Modal({ open, onClose, children, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`bg-surface rounded-lg ${WIDTHS[size]} w-full max-h-[90vh] overflow-y-auto sm:rounded-lg rounded-md`}
      >
        {children}
      </div>
    </div>
  )
}
