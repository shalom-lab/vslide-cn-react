import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import { useDeckStore } from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import { AtomRenderer } from '../atoms/AtomRenderer'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const AutoGrid = WidthProvider(GridLayout)

export function PlayPage() {
  const navigate = useNavigate()
  const slides = useDeckStore((s) => s.deck.slides)
  const background = useDeckStore((s) =>
    cssBackground(s.deck.background),
  )
  const sorted = useMemo(
    () => slides.slice().sort((a, b) => a.y - b.y),
    [slides],
  )
  const [index, setIndex] = useState(0)
  const [height, setHeight] = useState(window.innerHeight)

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const next = useCallback(() => {
    setIndex((i) => (i >= sorted.length - 1 ? 0 : i + 1))
  }, [sorted.length])

  const prev = useCallback(() => {
    setIndex((i) => (i <= 0 ? sorted.length - 1 : i - 1))
  }, [sorted.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
        case 'e':
        case 'E':
          navigate('/edit')
          break
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          e.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          prev()
          break
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate, next, prev])

  const slide = sorted[index]
  if (!slide) return null

  const layout = slide.slideContent.map((a) => ({
    i: a.i,
    x: a.x,
    y: a.y,
    w: a.w,
    h: a.h,
    static: true,
  }))
  const rowHeight = Math.max(8, Math.floor(height / 18))

  return (
    <div
      className="play-page"
      style={{ background, height }}
      onClick={next}
      onContextMenu={(e) => {
        e.preventDefault()
        navigate('/edit')
      }}
    >
      <AutoGrid
        className="play-grid"
        layout={layout}
        cols={18}
        rowHeight={rowHeight}
        margin={[5, 5]}
        isDraggable={false}
        isResizable={false}
        compactType={null}
        useCSSTransforms={false}
        style={{ height: '100%' }}
      >
        {slide.slideContent.map((atom) => (
          <div key={atom.i} className="play-item">
            <AtomRenderer atom={atom} />
          </div>
        ))}
      </AutoGrid>
      <span className="play-page-num">
        {index + 1}/{sorted.length}
      </span>
      <div className="play-hint">← → / Space 翻页 · Esc 返回编辑</div>
    </div>
  )
}
