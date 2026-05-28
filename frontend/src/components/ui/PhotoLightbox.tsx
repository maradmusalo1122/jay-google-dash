import { useEffect } from 'react'

interface Props {
  src: string | null
  alt?: string
  onClose: () => void
}

/**
 * Full-screen image viewer used to expand profile pictures and cover photos
 * (and anywhere else we want a quick lightbox without the full PhotoModal
 * chrome). Click anywhere outside the image, the X, or Esc to close.
 */
export default function PhotoLightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Prevent body scroll while open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/85 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <img
        src={src}
        alt={alt ?? ''}
        className="max-w-full max-h-full object-contain rounded-md shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none flex items-center justify-center backdrop-blur transition"
      >
        ×
      </button>
    </div>
  )
}
