import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout'
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Copy,
  Database,
  Download,
  Lock,
  Paintbrush,
  Pin,
  Sparkles,
  Square,
  Trash2,
  Unlock,
} from 'lucide-react'
import {
  selectActiveAtom,
  selectActiveSlide,
  useDeckStore,
} from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import {
  buildGridMetrics,
  gridToPixels,
  pixelsToGrid,
  type GridLayoutRect,
} from '../../utils/grid'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import {
  atomStackStyle,
  canLayerAction,
} from '../../utils/layerOrder'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const AutoGrid = WidthProvider(GridLayout)
const CTX = { size: 14, strokeWidth: 1.75 }

interface MenuState {
  x: number
  y: number
  atomId: string
}

interface DragDraft {
  originX: number
  originY: number
  currentX: number
  currentY: number
}

export function Canvas() {
  const deck = useDeckStore((s) => s.deck)
  const activeSlideId = useDeckStore((s) => s.activeSlideId)
  const activeAtomId = useDeckStore((s) => s.activeAtomId)
  const setActiveAtom = useDeckStore((s) => s.setActiveAtom)
  const setEditorFocus = useDeckStore((s) => s.setEditorFocus)
  const updateSlideLayout = useDeckStore((s) => s.updateSlideLayout)
  const duplicateActiveAtom = useDeckStore((s) => s.duplicateActiveAtom)
  const removeActiveAtom = useDeckStore((s) => s.removeActiveAtom)
  const toggleFixedActiveAtom = useDeckStore((s) => s.toggleFixedActiveAtom)
  const reorderActiveAtom = useDeckStore((s) => s.reorderActiveAtom)
  const saveActiveAtomToGallery = useDeckStore((s) => s.saveActiveAtomToGallery)
  const toast = useDeckStore((s) => s.toast)
  const clearToast = useDeckStore((s) => s.clearToast)
  const placeMode = useDeckStore((s) => s.placeMode)
  const pendingLayout = useDeckStore((s) => s.pendingLayout)
  const finishPlaceRect = useDeckStore((s) => s.finishPlaceRect)
  const cancelPlaceMode = useDeckStore((s) => s.cancelPlaceMode)
  const slide = useDeckStore(selectActiveSlide)
  const activeAtom = useDeckStore(selectActiveAtom)

  const [size, setSize] = useState({ w: 640, h: 360 })
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [dragDraft, setDragDraft] = useState<DragDraft | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragDraft | null>(null)
  const placing = placeMode === 'chart'

  useEffect(() => {
    const measure = () => {
      // Match Vue Right.vue: min(innerH-150, (innerW-280)*9/16); React adds ~220px props
      const availH = Math.max(200, window.innerHeight - 150)
      const availW = Math.max(320, window.innerWidth - 250 - 220 - 20)
      const h = Math.floor(Math.min(availH, (availW * 9) / 16))
      const w = Math.floor((h * 16) / 9)
      setSize({ w, h })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(clearToast, 2000)
    return () => window.clearTimeout(t)
  }, [toast, clearToast])

  // Clear in-progress drag when place mode ends
  useEffect(() => {
    if (!placing) {
      dragRef.current = null
      setDragDraft(null)
    }
  }, [placing])

  const layout: Layout[] = useMemo(
    () =>
      (slide?.slideContent ?? []).map((a) => ({
        i: a.i,
        x: a.x,
        y: a.y,
        w: a.w,
        h: a.h,
        static: a.static,
      })),
    [slide?.slideContent],
  )

  const metrics = useMemo(
    () => buildGridMetrics(size.w, size.h),
    [size.w, size.h],
  )
  const rowHeight = metrics.rowHeight
  const background = cssBackground(deck.background)

  const onLayoutChange = (next: Layout[]) => {
    if (!slide) return
    const atoms = slide.slideContent.map((a) => {
      const item = next.find((n) => n.i === a.i)
      if (!item) return a
      return { ...a, x: item.x, y: item.y, w: item.w, h: item.h }
    })
    updateSlideLayout(activeSlideId, atoms)
  }

  const closeMenu = useCallback(() => setMenu(null), [])

  const openAtomMenu = (e: React.MouseEvent, atomId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveAtom(atomId)
    setMenu({ x: e.clientX, y: e.clientY, atomId })
  }

  const localPoint = (e: React.MouseEvent | MouseEvent) => {
    const el = stageRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, r.width)),
      y: Math.max(0, Math.min(e.clientY - r.top, r.height)),
    }
  }

  const draftToGrid = (draft: DragDraft): GridLayoutRect => {
    const left = Math.min(draft.originX, draft.currentX)
    const top = Math.min(draft.originY, draft.currentY)
    const width = Math.abs(draft.currentX - draft.originX)
    const height = Math.abs(draft.currentY - draft.originY)
    return pixelsToGrid(left, top, width, height, metrics)
  }

  const onPlacePointerDown = (e: React.MouseEvent) => {
    if (!placing || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    closeMenu()
    const p = localPoint(e)
    const draft = {
      originX: p.x,
      originY: p.y,
      currentX: p.x,
      currentY: p.y,
    }
    dragRef.current = draft
    setDragDraft(draft)
  }

  useEffect(() => {
    if (!dragDraft) return

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const p = localPoint(e)
      const next = { ...d, currentX: p.x, currentY: p.y }
      dragRef.current = next
      setDragDraft(next)
    }
    const onUp = (e: MouseEvent) => {
      const d = dragRef.current
      dragRef.current = null
      setDragDraft(null)
      if (!d) return
      const p = localPoint(e)
      const final = { ...d, currentX: p.x, currentY: p.y }
      const dx = Math.abs(final.currentX - final.originX)
      const dy = Math.abs(final.currentY - final.originY)
      // Tiny click without drag → cancel place (click empty)
      if (dx < 4 && dy < 4) {
        cancelPlaceMode()
        return
      }
      finishPlaceRect(draftToGrid(final))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragDraft ? 1 : 0, metrics, finishPlaceRect, cancelPlaceMode])

  const previewRect: GridLayoutRect | null = dragDraft
    ? draftToGrid(dragDraft)
    : pendingLayout && placing
      ? pendingLayout
      : null

  const previewBox = previewRect ? gridToPixels(previewRect, metrics) : null

  const menuAtom =
    menu && slide
      ? slide.slideContent.find((a) => a.i === menu.atomId)
      : activeAtom

  const forbidden = Boolean(menuAtom?.super)

  const menuItems: ContextMenuItem[] = menuAtom
    ? [
        {
          key: 'sheetData',
          label: '数据',
          icon: <Database {...CTX} />,
          disabled:
            forbidden || !['echart', 'tables'].includes(menuAtom.atomType),
          onClick: () => {
            setActiveAtom(menuAtom.i)
            setEditorFocus('sheetData')
          },
        },
        {
          key: 'atomContent',
          label: '样式',
          icon: <Paintbrush {...CTX} />,
          disabled:
            forbidden ||
            ['text-md', 'simple-table'].includes(menuAtom.atomContent.atomName),
          onClick: () => {
            setActiveAtom(menuAtom.i)
            setEditorFocus('atomContent')
          },
        },
        {
          key: 'atomBorder',
          label: '边框',
          icon: <Square {...CTX} />,
          disabled: forbidden,
          onClick: () => {
            setActiveAtom(menuAtom.i)
            setEditorFocus('atomBorder')
          },
        },
        {
          key: 'atomAnimation',
          label: '动画',
          icon: <Sparkles {...CTX} />,
          disabled: forbidden,
          onClick: () => {
            setActiveAtom(menuAtom.i)
            setEditorFocus('atomAnimation')
          },
        },
        {
          key: 'front',
          label: '置顶',
          icon: <ArrowUpToLine {...CTX} />,
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'front'),
          onClick: () => reorderActiveAtom('front'),
        },
        {
          key: 'forward',
          label: '上移一层',
          icon: <ArrowUp {...CTX} />,
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'forward'),
          onClick: () => reorderActiveAtom('forward'),
        },
        {
          key: 'backward',
          label: '下移一层',
          icon: <ArrowDown {...CTX} />,
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'backward'),
          onClick: () => reorderActiveAtom('backward'),
        },
        {
          key: 'back',
          label: '置底',
          icon: <ArrowDownToLine {...CTX} />,
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'back'),
          onClick: () => reorderActiveAtom('back'),
        },
        {
          key: 'fixed',
          label: menuAtom.static ? '取消固定' : '固定',
          icon: menuAtom.static ? <Unlock {...CTX} /> : <Pin {...CTX} />,
          disabled: forbidden,
          onClick: () => toggleFixedActiveAtom(),
        },
        {
          key: 'copy',
          label: '复制',
          icon: <Copy {...CTX} />,
          disabled: forbidden,
          onClick: () => duplicateActiveAtom(),
        },
        {
          key: 'delete',
          label: '删除',
          icon: <Trash2 {...CTX} />,
          danger: true,
          onClick: () => removeActiveAtom(),
        },
        {
          key: 'save',
          label: '保存',
          icon: <Download {...CTX} />,
          disabled: forbidden,
          onClick: () => saveActiveAtomToGallery(),
        },
      ]
    : []

  if (!slide) return null

  return (
    <div className="canvas-wrap">
      {placing && (
        <div className="place-hint" role="status">
          在画布上拖拽框选图表位置 · Esc 取消
        </div>
      )}
      <div
        ref={stageRef}
        className={'canvas-stage' + (placing ? ' place-mode' : '')}
        style={{ width: size.w, height: size.h, background }}
        onClick={() => {
          if (placing) return
          setActiveAtom(null)
          setEditorFocus(null)
          closeMenu()
        }}
      >
        <AutoGrid
          className="canvas-grid"
          layout={layout}
          cols={18}
          rowHeight={rowHeight}
          margin={[4, 4]}
          containerPadding={[0, 0]}
          isDraggable={!placing}
          isResizable={!placing}
          compactType={null}
          preventCollision={false}
          useCSSTransforms
          onDragStop={onLayoutChange}
          onResizeStop={onLayoutChange}
          resizeHandles={['nw', 'ne', 'sw', 'se']}
          draggableCancel=".atom-no-drag,input,textarea,button,a"
        >
          {slide.slideContent.map((atom, index) => (
            <div
              key={atom.i}
              className={
                'canvas-item' +
                (atom.i === activeAtomId ? ' selected' : '') +
                (atom.static ? ' locked' : '')
              }
              style={atomStackStyle(atom, index, atom.i === activeAtomId)}
              onClick={(e) => {
                if (placing) return
                e.stopPropagation()
                setActiveAtom(atom.i)
              }}
              onDoubleClick={(e) => {
                if (placing) return
                e.stopPropagation()
                setActiveAtom(atom.i)
                window.setTimeout(() => toggleFixedActiveAtom(), 0)
              }}
              onContextMenu={(e) => {
                if (placing) {
                  e.preventDefault()
                  return
                }
                openAtomMenu(e, atom.i)
              }}
            >
              {atom.static ? (
                <span className="lock-badge" title="已固定" aria-hidden>
                  <Lock size={10} strokeWidth={2} />
                </span>
              ) : null}
              <div className="canvas-item-body">
                <AtomRenderer atom={atom} />
              </div>
            </div>
          ))}
        </AutoGrid>

        {placing && (
          <div
            className="place-overlay"
            onMouseDown={onPlacePointerDown}
            onContextMenu={(e) => {
              e.preventDefault()
              cancelPlaceMode()
            }}
          />
        )}

        {previewBox && (
          <div
            className={
              'place-rect' + (dragDraft ? ' placing' : ' pending')
            }
            style={{
              left: previewBox.left,
              top: previewBox.top,
              width: previewBox.width,
              height: previewBox.height,
            }}
            aria-hidden
          />
        )}
      </div>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={closeMenu}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
