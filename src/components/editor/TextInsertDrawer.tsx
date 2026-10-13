import { useEffect } from 'react'
import { Code2, Heading1, Type, X } from 'lucide-react'
import { useDeckStore } from '../../store/useDeckStore'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Right-side text/HTML picker. Pick a type, then drag on canvas to place.
 * 正文 (text-md) / 标题 (text-shadow) / HTML (custom-html).
 */
export function TextInsertDrawer({ open, onClose }: Props) {
  const armPendingInsert = useDeckStore((s) => s.armPendingInsert)

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

  const pick = (atomName: 'text-md' | 'text-shadow' | 'custom-html') => {
    armPendingInsert({ kind: 'text', atomName })
  }

  return (
    <div className="drawer-root" role="dialog" aria-label="插入文字 / HTML">
      <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
      <aside className="drawer-panel text-insert-drawer">
        <header className="drawer-header">
          <h3>插入文字 / HTML</h3>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>
        <div className="drawer-body">
          <p className="drawer-hint">
            先选择类型，再到画布拖框放置 · Esc 关闭
          </p>
          <div className="text-insert-options">
            <button
              type="button"
              className="text-insert-option"
              onClick={() => pick('text-md')}
              title="Markdown 正文（支持公式）"
            >
              <span className="text-insert-option-icon">
                <Type size={22} strokeWidth={1.75} />
              </span>
              <span className="text-insert-option-text">
                <strong>正文</strong>
                <span>Markdown · text-md</span>
              </span>
            </button>
            <button
              type="button"
              className="text-insert-option"
              onClick={() => pick('text-shadow')}
              title="大字阴影标题"
            >
              <span className="text-insert-option-icon">
                <Heading1 size={22} strokeWidth={1.75} />
              </span>
              <span className="text-insert-option-text">
                <strong>标题</strong>
                <span>阴影标题 · text-shadow</span>
              </span>
            </button>
            <button
              type="button"
              className="text-insert-option"
              onClick={() => pick('custom-html')}
              title="安全自定义 HTML（不执行 JS）"
            >
              <span className="text-insert-option-icon">
                <Code2 size={22} strokeWidth={1.75} />
              </span>
              <span className="text-insert-option-text">
                <strong>HTML</strong>
                <span>安全子集 · custom-html</span>
              </span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
