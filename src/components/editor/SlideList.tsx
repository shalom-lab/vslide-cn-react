import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GridLayout, { type Layout } from 'react-grid-layout'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { useDeckStore } from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import {
  GRID_COLS,
  GRID_MARGIN,
  GRID_PADDING,
  STAGE_ASPECT_H,
  STAGE_ASPECT_W,
  STAGE_REF_HEIGHT,
  STAGE_REF_WIDTH,
  buildGridMetrics,
} from '../../utils/grid'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import { atomStackStyle } from '../../utils/layerOrder'
import { stageTypographyStyle } from '../../utils/typography'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const CTX = { size: 14, strokeWidth: 1.75 }

/**
 * Thumbs render at the canonical 960×540 stage (same cols/margin/rowHeight
 * formula as Canvas), then CSS-scale into the 16:9 list slot. The old
 * WidthProvider + 400%/scale(0.25) path measured a pane-dependent width
 * while rowHeight stayed locked to 540 — cell aspect drifted from canvas.
 */
const THUMB_METRICS = buildGridMetrics(STAGE_REF_WIDTH, STAGE_REF_HEIGHT)

function Thumb({
  slideContent,
  background,
  scale,
}: {
  slideContent: ReturnType<
    typeof useDeckStore.getState
  >['deck']['slides'][0]['slideContent']
  background: string
  /** viewportWidth / STAGE_REF_WIDTH — keeps 16:9 thumbs matched to canvas. */
  scale: number
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
        style={{
          width: STAGE_REF_WIDTH,
          height: STAGE_REF_HEIGHT,
          transform: `scale(${scale})`,
          background,
          ...stageTypographyStyle(STAGE_REF_HEIGHT),
        }}
      >
        <GridLayout
          className="thumb-grid"
          width={STAGE_REF_WIDTH}
          layout={layout}
          cols={GRID_COLS}
          rowHeight={THUMB_METRICS.rowHeight}
          margin={GRID_MARGIN}
          containerPadding={GRID_PADDING}
          isDraggable={false}
          isResizable={false}
          compactType={null}
          preventCollision={false}
          allowOverlap
          useCSSTransforms={false}
          style={{ width: STAGE_REF_WIDTH, height: STAGE_REF_HEIGHT }}
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
        </GridLayout>
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

  // 16:9 thumb slots (same aspect as canvas / play stage)
  const rowHeight = Math.max(
    48,
    (gridWidth * STAGE_ASPECT_H) / STAGE_ASPECT_W,
  )
  const thumbScale = gridWidth / STAGE_REF_WIDTH

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
                scale={thumbScale}
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
