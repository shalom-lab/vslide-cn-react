import { useEffect, useMemo, useState } from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout'
import {
  selectActiveSlide,
  useDeckStore,
} from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import { AtomRenderer } from '../atoms/AtomRenderer'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const AutoGrid = WidthProvider(GridLayout)

export function Canvas() {
  const deck = useDeckStore((s) => s.deck)
  const activeSlideId = useDeckStore((s) => s.activeSlideId)
  const activeAtomId = useDeckStore((s) => s.activeAtomId)
  const setActiveAtom = useDeckStore((s) => s.setActiveAtom)
  const updateSlideLayout = useDeckStore((s) => s.updateSlideLayout)
  const slide = useDeckStore(selectActiveSlide)

  const [size, setSize] = useState({ w: 640, h: 360 })

  useEffect(() => {
    const measure = () => {
      const availH = Math.max(200, window.innerHeight - 150)
      const availW = Math.max(320, window.innerWidth - 250 - 280)
      const h = Math.floor(Math.min(availH, (availW * 9) / 16))
      const w = Math.floor((h * 16) / 9)
      setSize({ w, h })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

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

  if (!slide) return null

  return (
    <div className="canvas-wrap">
      <div
        className="canvas-stage"
        style={{ width: size.w, height: size.h, background }}
        onClick={() => setActiveAtom(null)}
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
          {slide.slideContent.map((atom) => (
            <div
              key={atom.i}
              className={
                'canvas-item' + (atom.i === activeAtomId ? ' selected' : '')
              }
              onClick={(e) => {
                e.stopPropagation()
                setActiveAtom(atom.i)
              }}
            >
              <div className="drag-handle" title="拖动" />
              <div className="canvas-item-body">
                <AtomRenderer atom={atom} />
              </div>
            </div>
          ))}
        </AutoGrid>
      </div>
    </div>
  )
}
