import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  CHART_GROUPS,
  CHART_INSERT_LIST,
  type AtomRegistryEntry,
} from '../../atoms/registry'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { useDeckStore } from '../../store/useDeckStore'
import type { Atom } from '../../types/deck'

interface Props {
  open: boolean
  onClose: () => void
}

/** Stable preview atoms (one per registry entry) so ECharts does not remount every render. */
const previewAtoms: Record<string, Atom> = Object.fromEntries(
  CHART_INSERT_LIST.map((e) => {
    const a = e.create()
    a.i = `preview-${e.atomName}`
    return [e.atomName, a]
  }),
)

/** Right-side chart insert drawer. Inserts at pending place-first layout when set. */
export function ChartInsertDrawer({ open, onClose }: Props) {
  const addAtom = useDeckStore((s) => s.addAtom)
  const pendingLayout = useDeckStore((s) => s.pendingLayout)
  const [tab, setTab] = useState<(typeof CHART_GROUPS)[number]['id']>('bar')

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

  const list = useMemo(
    () => CHART_INSERT_LIST.filter((e) => e.chartGroup === tab),
    [tab],
  )

  if (!open) return null

  const insert = (entry: AtomRegistryEntry) => {
    addAtom(entry.create(pendingLayout ?? undefined))
    // addAtom clears place mode + drawer
  }

  return (
    <div className="drawer-root" role="dialog" aria-label="插入图表">
      <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
      <aside className="drawer-panel chart-drawer">
        <header className="drawer-header">
          <h3>插入图表</h3>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>
        <div className="drawer-tabs">
          {CHART_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={'drawer-tab' + (tab === g.id ? ' active' : '')}
              onClick={() => setTab(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="drawer-body">
          <p className="drawer-hint">
            {pendingLayout
              ? `将插入到已框选位置（${pendingLayout.w}×${pendingLayout.h}）· Esc 取消`
              : '点击预览插入到默认位置 · Esc 关闭'}
          </p>
          {list.map((entry) => (
            <button
              key={entry.atomName}
              type="button"
              className="chart-preview-card"
              onClick={() => insert(entry)}
              title={entry.hint || entry.label}
            >
              <div className="chart-preview-stage">
                <AtomRenderer atom={previewAtoms[entry.atomName]} />
              </div>
              <div className="chart-preview-meta">
                <strong>{entry.label}</strong>
                <span>{entry.atomName}</span>
              </div>
            </button>
          ))}
          {list.length === 0 && <p className="muted">该分类暂无图表</p>}
        </div>
      </aside>
    </div>
  )
}
