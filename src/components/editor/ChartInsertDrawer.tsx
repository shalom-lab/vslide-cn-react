import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import {
  CHART_GROUPS,
  CHART_INSERT_LIST,
  type AtomRegistryEntry,
} from '../../atoms/registry'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { useDeckStore } from '../../store/useDeckStore'
import type { Atom } from '../../types/deck'
import type { LocalGalleryItem } from '../../gallery/localGallery'

interface Props {
  open: boolean
  onClose: () => void
}

type TabId = (typeof CHART_GROUPS)[number]['id'] | 'mine'

/** Stable preview atoms (one per registry entry) so ECharts does not remount every render. */
const previewAtoms: Record<string, Atom> = Object.fromEntries(
  CHART_INSERT_LIST.map((e) => {
    const a = e.create()
    a.i = `preview-${e.atomName}`
    return [e.atomName, a]
  }),
)

/** Right-side chart picker. Built-in types + 「我的图表」; pick then drag on canvas. */
export function ChartInsertDrawer({ open, onClose }: Props) {
  const armPendingInsert = useDeckStore((s) => s.armPendingInsert)
  const localGallery = useDeckStore((s) => s.localGallery)
  const removeLocalGalleryItem = useDeckStore((s) => s.removeLocalGalleryItem)
  const renameLocalGalleryItem = useDeckStore((s) => s.renameLocalGalleryItem)
  const [tab, setTab] = useState<TabId>('bar')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  useEffect(() => {
    if (!open) {
      setRenamingId(null)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (renamingId) {
          setRenamingId(null)
          return
        }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, renamingId])

  const list = useMemo(
    () =>
      tab === 'mine'
        ? []
        : CHART_INSERT_LIST.filter((e) => e.chartGroup === tab),
    [tab],
  )

  if (!open) return null

  const pickBuiltin = (entry: AtomRegistryEntry) => {
    armPendingInsert({ kind: 'chart', atomName: entry.atomName })
    onClose()
  }

  const pickSaved = (item: LocalGalleryItem) => {
    armPendingInsert({ kind: 'saved', atom: item.atom })
    onClose()
  }

  const startRename = (item: LocalGalleryItem) => {
    setRenamingId(item.id)
    setRenameDraft(item.name)
  }

  const commitRename = (id: string) => {
    const name = renameDraft.trim()
    if (name) renameLocalGalleryItem(id, name)
    setRenamingId(null)
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
          <button
            type="button"
            className={'drawer-tab' + (tab === 'mine' ? ' active' : '')}
            onClick={() => setTab('mine')}
          >
            我的{localGallery.length > 0 ? ` (${localGallery.length})` : ''}
          </button>
        </div>
        <div className="drawer-body">
          {tab === 'mine' ? (
            <>
              <p className="drawer-hint">
                本机「我的图表」（localStorage）· 点击预览后拖框放置 · 右键画布「保存至我的图表」可收藏
              </p>
              {localGallery.length === 0 ? (
                <p className="muted">
                  暂无收藏。在画布上右键图表 / 元素 →「保存至我的图表」。
                </p>
              ) : (
                localGallery.map((item) => (
                  <div key={item.id} className="chart-preview-card gallery-card">
                    <div
                      className="gallery-card-main"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (renamingId === item.id) return
                        pickSaved(item)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (renamingId !== item.id) pickSaved(item)
                        }
                      }}
                      title={`插入「${item.name}」`}
                    >
                      <div className="chart-preview-stage">
                        <AtomRenderer
                          atom={{
                            ...item.atom,
                            i: `preview-g-${item.id}`,
                            atomBorder: {
                              width: 0,
                              type: 'solid',
                              color: '#808080',
                              radius: 1,
                            },
                          }}
                        />
                      </div>
                      <div className="chart-preview-meta">
                        {renamingId === item.id ? (
                          <input
                            className="gallery-rename-input"
                            value={renameDraft}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation()
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                commitRename(item.id)
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                setRenamingId(null)
                              }
                            }}
                            onBlur={() => commitRename(item.id)}
                          />
                        ) : (
                          <strong>{item.name}</strong>
                        )}
                        <span>{item.atom.atomContent.atomName}</span>
                      </div>
                    </div>
                    <div className="gallery-card-actions">
                      <button
                        type="button"
                        className="gallery-action"
                        title="重命名"
                        onClick={() => startRename(item)}
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        className="gallery-action danger"
                        title="删除"
                        onClick={() => removeLocalGalleryItem(item.id)}
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <p className="drawer-hint">
                先选择图表类型，再到画布拖框放置 · Esc 关闭
              </p>
              {list.map((entry) => (
                <button
                  key={entry.atomName}
                  type="button"
                  className="chart-preview-card"
                  onClick={() => pickBuiltin(entry)}
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
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
