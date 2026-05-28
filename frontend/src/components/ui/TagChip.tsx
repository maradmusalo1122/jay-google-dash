import { TAG_STYLES, type Tag } from '@/types'

export default function TagChip({ tag }: { tag: Tag }) {
  const s = TAG_STYLES[tag]
  return (
    <span
      className="inline-flex items-center text-xs px-2.5 py-1 rounded-pill font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {tag}
    </span>
  )
}
