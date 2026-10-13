import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { useDeckStore } from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import { GRID_COLS, GRID_MARGIN, calcRowHeight } from '../../utils/grid'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import { atomStackStyle } from '../../utils/layerOrder'
import { stageTypographyStyle } from '../../utils/typography'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const AutoGrid = WidthProvider(GridLayout)
const CTX = { size: 14, strokeWidth: 1.75 }

/** Match Vue Left.vue + VSlide: render at height 540, then scale(0.25). */
const THUMB_FULL_HEIGHT = 540
const THUMB_ROW_HEIGHT = calcRowHeight(THUMB_FULL_HEIGHT)
/** Match canvas GRID_MARGIN so thumb layout matches the stage. */
const THUMB_MARGIN = GRID_MARGIN

function Thumb({
  slideContent,
  background,
}: {
  slideContent: ReturnType<
    typeof useDeckStore.getState
  >['deck']['slides'][0]['slideContent']
  background: string
}) {
  const layout = slideContent.map((a) => ({
    i: a.i,
    x: a.x,
    y: a.y,
    w: a.w,
    h: a.h,
    static: true,
  }))
  return (
    <div className="thumb-viewport">
      <div
        className="thumb-scale"
        style={{ background, ...stageTypographyStyle(THUMB_FULL_HEIGHT) }}
      >
        <AutoGrid
          className="thumb-grid"
          layout={layout}
          cols={GRID_COLS}
          rowHeight={THUMB_ROW_HEIGHT}
          margin={THUMB_MARGIN}
          containerPadding={[0, 0]}
          isDraggable={false}
          isResizable={false}
          compactType={null}
          preventCollision={false}
          allowOverlap
          useCSSTransforms={false}
          style={{ height: '100%' }}
        >
          {slideContent.map((atom, index) => (
            <div
              key={atom.i}
              className="thumb-item"
              style={atomStackStyle(atom, index)}
            >
              <AtomRenderer atom={atom} />
            </div>
          ))}
        </AutoGrid>
      </div>
    </div>
  )
}

interface MenuState {
  x: number
  y: number
  slideId: string
}

export function SlideList() {
  const slides = useDeckStore((s) => s.deck.slides)
  const bg = useDeckStore((s) => s.deck.background)
  const activeSlideId = useDeckStore((s) => s.activeSlideId)
  const setActiveSlide = useDeckStore((s) => s.setActiveSlide)
  const addSlide = useDeckStore((s) => s.addSlide)
  const duplicateSlide = useDeckStore((s) => s.duplicateSlide)
  const removeSlide = useDeckStore((s) => s.removeSlide)
  const reorderSlides = useDeckStore((s) => s.reorderSlides)
  const background = cssBackground(bg)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(200)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      const style = getComputedStyle(el)
      const padL = parseFloat(style.paddingLeft) || 0
      const padR = parseFloat(style.paddingRight) || 0
      setGridWidth(Math.max(80, el.clientWidth - padL - padR))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sorted = useMemo(
    () => slides.slice().sort((a, b) => a.y - b.y),
    [slides],
  )

  const layout: Layout[] = useMemo(
    () =>
      sorted.map((slide) => ({
        i: slide.i,
        x: 0,
        y: slide.y,
        w: 1,
        h: 1,
      })),
    [sorted],
  )

  // Vue Left.vue: row-height ≈ width * 9/16 for 16:9 thumbs
  const rowHeight = Math.max(48, (gridWidth * 9) / 16)

  // RGL/react-draggable often swallows click after a press; select on
  // drag-start (mousedown) so a tap focuses the slide, and still reorder on stop.
  const dragMovedRef = useRef(false)

  const onDragStart = useCallback(
    (_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
      dragMovedRef.current = false
      if (newItem?.i) setActiveSlide(newItem.i)
    },
    [setActiveSlide],
  )

  const onDrag = useCallback(() => {
    dragMovedRef.current = true
  }, [])

  const onDragStop = useCallback(
    (next: Layout[]) => {
      reorderSlides(next.map((l) => ({ i: l.i, y: l.y })))
    },
    [reorderSlides],
  )

  const onSlideClick = useCallback(
    (id: string) => {
      // Backup if a true click event still fires (no drag movement).
      if (!dragMovedRef.current) setActiveSlide(id)
    },
    [setActiveSlide],
  )

  const menuItems: ContextMenuItem[] = [
    {
      key: 'new',
      label: '新建幻灯片',
      icon: <Plus {...CTX} />,
      onClick: () => addSlide(),
    },
    {
      key: 'copy',
      label: '复制幻灯片',
      icon: <Copy {...CTX} />,
      onClick: () => duplicateSlide(),
    },
    {
      key: 'delete',
      label: '删除幻灯片',
      icon: <Trash2 {...CTX} />,
      danger: true,
      disabled: slides.length <= 1,
      onClick: () => removeSlide(),
    },
  ]

  return (
    <aside className="slide-list">
      <div className="slide-list-actions">
        <button type="button" onClick={addSlide}>
          新建
        </button>
        <button type="button" onClick={duplicateSlide}>
          复制
        </button>
        <button type="button" onClick={removeSlide}>
          删除
        </button>
      </div>
      <div className="slide-list-scroll" ref={scrollRef}>
        <GridLayout
          className="slide-list-grid"
          width={gridWidth}
          layout={layout}
          cols={1}
          rowHeight={rowHeight}
          margin={[0, 5]}
          containerPadding={[0, 0]}
          isDraggable
          isResizable={false}
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragStop={onDragStop}
        >
          {sorted.map((slide, index) => (
            <div
              key={slide.i}
              className={
                'slide-thumb' + (slide.i === activeSlideId ? ' actived' : '')
              }
              onClick={() => onSlideClick(slide.i)}
              onContextMenu={(e) => {
                e.preventDefault()
                setActiveSlide(slide.i)
                setMenu({ x: e.clientX, y: e.clientY, slideId: slide.i })
              }}
            >
              <span className="slide-num">{index + 1}</span>
              <Thumb
                slideContent={slide.slideContent}
                background={background}
              />
            </div>
          ))}
        </GridLayout>
      </div>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={closeMenu}
        />
      )}
    </aside>
  )
}
