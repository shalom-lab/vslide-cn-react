import { useEffect } from 'react'
import { Code2, Heading1, Type, X } from 'lucide-react'
import {
  createCustomHtmlAtom,
  createTextAtom,
  createTextShadowAtom,
  useDeckStore,
} from '../../store/useDeckStore'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Right-side insert drawer after place-first drag for「文字」/「HTML」:
 * 正文 (text-md) / 标题 (text-shadow) / HTML (custom-html) at pending layout.
 * Matches ChartInsertDrawer UX (right panel, Esc cancel).
 */
export function TextInsertDrawer({ open, onClose }: Props) {
  const addAtom = useDeckStore((s) => s.addAtom)
  const pendingLayout = useDeckStore((s) => s.pendingLayout)
  const placeMode = useDeckStore((s) => s.placeMode)

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
  const title =
    placeMode === 'html' ? '插入 HTML' : '插入文字 / HTML'

  return (
    <div className="drawer-root" role="dialog" aria-label={title}>
      <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
      <aside className="drawer-panel text-insert-drawer">
        <header className="drawer-header">
          <h3>{title}</h3>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>
        <div className="drawer-body">
          <p className="drawer-hint">
            {pendingLayout
              ? `将插入到已框选位置（${pendingLayout.w}×${pendingLayout.h}）· Esc 取消`
              : '点击选项插入到默认位置 · Esc 关闭'}
          </p>
          <div className="text-insert-options">
            <button
              type="button"
              className="text-insert-option"
              onClick={() => addAtom(createTextAtom(undefined, layout))}
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
              onClick={() => addAtom(createTextShadowAtom(undefined, layout))}
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
              onClick={() => addAtom(createCustomHtmlAtom(undefined, layout))}
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
