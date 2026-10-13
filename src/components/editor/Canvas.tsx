import { useCallback, useEffect, useMemo, useState } from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout'
import {
  selectActiveAtom,
  selectActiveSlide,
  useDeckStore,
} from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import {
  atomStackStyle,
  canLayerAction,
} from '../../utils/layerOrder'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const AutoGrid = WidthProvider(GridLayout)

interface MenuState {
  x: number
  y: number
  atomId: string
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
  const slide = useDeckStore(selectActiveSlide)
  const activeAtom = useDeckStore(selectActiveAtom)

  const [size, setSize] = useState({ w: 640, h: 360 })
  const [menu, setMenu] = useState<MenuState | null>(null)

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

  const rowHeight = Math.max(8, Math.floor(size.h / 18))
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
          icon: '▦',
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
          icon: '✎',
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
          icon: '▢',
          disabled: forbidden,
          onClick: () => {
            setActiveAtom(menuAtom.i)
            setEditorFocus('atomBorder')
          },
        },
        {
          key: 'atomAnimation',
          label: '动画',
          icon: '✦',
          disabled: forbidden,
          onClick: () => {
            setActiveAtom(menuAtom.i)
            setEditorFocus('atomAnimation')
          },
        },
        {
          key: 'front',
          label: '置顶',
          icon: '⬆',
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'front'),
          onClick: () => reorderActiveAtom('front'),
        },
        {
          key: 'forward',
          label: '上移一层',
          icon: '↑',
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'forward'),
          onClick: () => reorderActiveAtom('forward'),
        },
        {
          key: 'backward',
          label: '下移一层',
          icon: '↓',
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'backward'),
          onClick: () => reorderActiveAtom('backward'),
        },
        {
          key: 'back',
          label: '置底',
          icon: '⬇',
          disabled:
            forbidden ||
            !canLayerAction(slide?.slideContent ?? [], menuAtom.i, 'back'),
          onClick: () => reorderActiveAtom('back'),
        },
        {
          key: 'fixed',
          label: menuAtom.static ? '取消固定' : '固定',
          icon: '📌',
          disabled: forbidden,
          onClick: () => toggleFixedActiveAtom(),
        },
        {
          key: 'copy',
          label: '复制',
          icon: '⧉',
          disabled: forbidden,
          onClick: () => duplicateActiveAtom(),
        },
        {
          key: 'delete',
          label: '删除',
          icon: '🗑',
          danger: true,
          onClick: () => removeActiveAtom(),
        },
        {
          key: 'save',
          label: '保存',
          icon: '⬇',
          disabled: forbidden,
          onClick: () => saveActiveAtomToGallery(),
        },
      ]
    : []

  if (!slide) return null

  return (
    <div className="canvas-wrap">
      <div
        className="canvas-stage"
        style={{ width: size.w, height: size.h, background }}
        onClick={() => {
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
          margin={[5, 5]}
          isDraggable
          isResizable
          compactType={null}
          preventCollision={false}
          useCSSTransforms={false}
          onDragStop={onLayoutChange}
          onResizeStop={onLayoutChange}
          draggableHandle=".drag-handle"
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
                e.stopPropagation()
                setActiveAtom(atom.i)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                setActiveAtom(atom.i)
                window.setTimeout(() => toggleFixedActiveAtom(), 0)
              }}
              onContextMenu={(e) => openAtomMenu(e, atom.i)}
            >
              <div className="drag-handle" title="拖动" />
              <div className="canvas-item-body">
                <AtomRenderer atom={atom} />
              </div>
            </div>
          ))}
        </AutoGrid>
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
