import { useCallback, useState } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import { useDeckStore } from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import { atomStackStyle } from '../../utils/layerOrder'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const AutoGrid = WidthProvider(GridLayout)
const CTX = { size: 14, strokeWidth: 1.75 }

/** Match Vue Left.vue + VSlide: render at height 540, then scale(0.25). */
const THUMB_FULL_HEIGHT = 540
const THUMB_ROW_HEIGHT = Math.floor(THUMB_FULL_HEIGHT / 18)
const THUMB_MARGIN: [number, number] = [5, 5]

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
      <div className="thumb-scale" style={{ background }}>
        <AutoGrid
          className="thumb-grid"
          layout={layout}
          cols={18}
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
  const background = cssBackground(bg)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])

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
      <div className="slide-list-scroll">
        {slides
          .slice()
          .sort((a, b) => a.y - b.y)
          .map((slide, index) => (
            <button
              type="button"
              key={slide.i}
              className={
                'slide-thumb' + (slide.i === activeSlideId ? ' actived' : '')
              }
              onClick={() => setActiveSlide(slide.i)}
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
            </button>
          ))}
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
