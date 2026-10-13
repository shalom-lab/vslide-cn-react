import { useEffect } from 'react'
import { X } from 'lucide-react'
import { SLIDE_TEMPLATES } from '../../data/slideTemplates'
import { useDeckStore } from '../../store/useDeckStore'

interface Props {
  open: boolean
  onClose: () => void
}

/** PPT-like slide layout templates — inserts a new slide after the active one. */
export function TemplateDrawer({ open, onClose }: Props) {
  const insertTemplateSlide = useDeckStore((s) => s.insertTemplateSlide)

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

  return (
    <div className="drawer-root" role="dialog" aria-label="幻灯片模板">
      <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
      <aside className="drawer-panel template-drawer">
        <header className="drawer-header">
          <h3>幻灯片模板</h3>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>
        <div className="drawer-body">
          <p className="drawer-hint">选择布局插入为新幻灯片 · Esc 关闭</p>
          <div className="template-grid">
            {SLIDE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className="template-card"
                title={tpl.hint}
                onClick={() => {
                  insertTemplateSlide(tpl.id)
                  onClose()
                }}
              >
                <div
                  className="template-swatch"
                  style={{ background: tpl.swatch }}
                  aria-hidden
                />
                <strong>{tpl.name}</strong>
                <span>{tpl.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
