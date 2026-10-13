import { useEffect } from 'react'
import { Heading1, Type, X } from 'lucide-react'
import {
  createTextAtom,
  createTextShadowAtom,
  useDeckStore,
} from '../../store/useDeckStore'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Small chooser after place-first drag for「文字」:
 * 正文 (text-md) / 标题 (text-shadow) at pending layout.
 */
export function TextInsertChooser({ open, onClose }: Props) {
  const addAtom = useDeckStore((s) => s.addAtom)
  const pendingLayout = useDeckStore((s) => s.pendingLayout)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const layout = pendingLayout ?? undefined

  return (
    <div className="text-chooser-root" role="dialog" aria-label="选择文字类型">
      <button
        type="button"
        className="text-chooser-mask"
        aria-label="取消"
        onClick={onClose}
      />
      <div className="text-chooser-card">
        <header className="text-chooser-head">
          <h3>选择文字类型</h3>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </header>
        <p className="text-chooser-hint">
          {pendingLayout
            ? `将插入到已框选位置（${pendingLayout.w}×${pendingLayout.h}）· Esc 取消`
            : 'Esc 取消'}
        </p>
        <div className="text-chooser-actions">
          <button
            type="button"
            className="text-chooser-option"
            onClick={() => addAtom(createTextAtom(undefined, layout))}
            title="Markdown 正文（支持公式）"
          >
            <Type size={22} strokeWidth={1.75} />
            <span className="text-chooser-option-label">正文</span>
            <span className="text-chooser-option-sub">Markdown · text-md</span>
          </button>
          <button
            type="button"
            className="text-chooser-option"
            onClick={() => addAtom(createTextShadowAtom(undefined, layout))}
            title="大字阴影标题"
          >
            <Heading1 size={22} strokeWidth={1.75} />
            <span className="text-chooser-option-label">标题</span>
            <span className="text-chooser-option-sub">阴影标题 · text-shadow</span>
          </button>
        </div>
      </div>
    </div>
  )
}
