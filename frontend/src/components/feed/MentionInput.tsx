import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { useStore } from '@/lib/store'
import { getMentionTypeahead } from '@/lib/mentions'
import UserAvatar from '@/components/ui/UserAvatar'
import { cn } from '@/lib/cn'
import type { User } from '@/types'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  placeholder?: string
  multiline?: boolean
  className?: string
  autoFocus?: boolean
  /** When true, Enter triggers onSubmit instead of inserting a newline (single-line UX). */
  submitOnEnter?: boolean
}

export interface MentionInputHandle {
  focus: () => void
}

const MAX_MATCHES = 6

const MentionInput = forwardRef<MentionInputHandle, Props>(function MentionInput(
  { value, onChange, onSubmit, placeholder, multiline, className, autoFocus, submitOnEnter },
  ref,
) {
  const { users } = useStore()
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const [typeahead, setTypeahead] = useState<{ query: string; start: number } | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  // Reset active match index when the query changes
  useEffect(() => {
    setActiveIdx(0)
  }, [typeahead?.query])

  const matches: User[] =
    typeahead == null
      ? []
      : users
          .filter(
            (u) =>
              u.status === 'approved' &&
              u.firstName.toLowerCase().startsWith(typeahead.query.toLowerCase()),
          )
          .slice(0, MAX_MATCHES)

  const refreshTypeahead = () => {
    const el = inputRef.current
    if (!el) return
    const cursor = el.selectionStart ?? value.length
    setTypeahead(getMentionTypeahead(el.value, cursor))
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value)
    // After React applies the value, recompute typeahead from the live caret.
    requestAnimationFrame(refreshTypeahead)
  }

  const selectMatch = (user: User) => {
    if (!typeahead) return
    const el = inputRef.current
    const cursor = el?.selectionStart ?? value.length
    const before = value.slice(0, typeahead.start)
    const after = value.slice(cursor)
    const insert = `@${user.firstName} `
    const next = before + insert + after
    onChange(next)
    setTypeahead(null)
    requestAnimationFrame(() => {
      const newCursor = before.length + insert.length
      const target = inputRef.current
      if (target) {
        target.setSelectionRange(newCursor, newCursor)
        target.focus()
      }
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (typeahead && matches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (i + 1) % matches.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => (i - 1 + matches.length) % matches.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectMatch(matches[activeIdx])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setTypeahead(null)
        return
      }
    }
    // Enter submits in single-line mode (or always when submitOnEnter is set)
    if (e.key === 'Enter' && !e.shiftKey && submitOnEnter && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  const commonProps = {
    ref: inputRef as React.RefObject<any>,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onClick: refreshTypeahead,
    onKeyUp: refreshTypeahead,
    onBlur: () => setTimeout(() => setTypeahead(null), 150),
    placeholder,
    autoFocus,
    className,
  }

  return (
    <div className="relative w-full">
      {multiline ? (
        <textarea {...(commonProps as any)} />
      ) : (
        <input type="text" {...(commonProps as any)} />
      )}

      {typeahead && matches.length > 0 && (
        <ul
          className="absolute z-[200] bottom-full mb-1 left-0 min-w-[220px] max-w-[300px] bg-surface border border-line rounded-md shadow-lg overflow-hidden"
          role="listbox"
        >
          {matches.map((u, i) => (
            <li key={u.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectMatch(u)}
                className={cn(
                  'w-full text-left px-3 py-1.5 flex items-center gap-2 transition',
                  i === activeIdx ? 'bg-g-blue-l' : 'hover:bg-surface-soft',
                )}
              >
                <UserAvatar user={u} size="sm" />
                <div className="min-w-0">
                  <div className="text-base text-ink font-medium truncate">{u.name}</div>
                  <div className="text-xs text-ink-3 truncate">
                    @{u.firstName}
                    {u.team ? ` · ${u.team}` : ''}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

export default MentionInput
