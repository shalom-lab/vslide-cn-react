import { useEffect, useRef, useState } from 'react'
import type { Atom } from '../../types/deck'

interface Props {
  atom: Atom
  onCommit: (patch: Record<string, unknown>) => void
  onCancel: () => void
}

/**
 * Double-click inline editor for text-md / text-shadow / custom-html.
 * Blur or Ctrl/Cmd+Enter commits; Esc cancels.
 */
export function InlineAtomEditor({ atom, onCommit, onCancel }: Props) {
  const name = atom.atomContent.atomName
  const detail = atom.atomContent.detail
  const initial =
    name === 'text-shadow'
      ? String(detail.text ?? '')
      : name === 'custom-html'
        ? String(detail.html ?? '')
        : String(detail.markdown ?? detail.text ?? '')

  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    if ('select' in el) el.select()
  }, [])

  const commit = () => {
    if (name === 'text-shadow') onCommit({ text: value })
    else if (name === 'custom-html') onCommit({ html: value })
    else onCommit({ markdown: value })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel()
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      commit()
    }
    // Stop canvas Delete/Backspace shortcuts while editing
    e.stopPropagation()
  }

  if (name === 'text-shadow') {
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        className="inline-atom-editor inline-atom-editor-title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="编辑标题"
      />
    )
  }

  return (
    <textarea
      ref={ref as React.RefObject<HTMLTextAreaElement>}
      className={
        'inline-atom-editor' +
        (name === 'custom-html' ? ' inline-atom-editor-html' : '')
      }
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      aria-label={name === 'custom-html' ? '编辑 HTML' : '编辑 Markdown'}
      spellCheck={name !== 'custom-html'}
    />
  )
}

export function isInlineEditableAtom(atom: Atom): boolean {
  const n = atom.atomContent.atomName
  return n === 'text-md' || n === 'text-shadow' || n === 'custom-html'
}
