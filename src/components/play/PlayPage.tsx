import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import { useDeckStore } from '../../store/useDeckStore'
import { cssBackground } from '../../utils/background'
import { GRID_COLS, calcRowHeight } from '../../utils/grid'
import { AtomRenderer } from '../atoms/AtomRenderer'
import { atomStackStyle } from '../../utils/layerOrder'
import { stageTypographyStyle } from '../../utils/typography'
import { BrandLogo } from '../BrandLogo'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import 'animate.css'

const AutoGrid = WidthProvider(GridLayout)

function slideMaxStep(atoms: { atomAnimation?: { order?: number } }[], steps: number) {
  const fromAtoms = atoms.reduce(
    (m, a) => Math.max(m, Number(a.atomAnimation?.order) || 1),
    1,
  )
  return Math.max(1, steps || 1, fromAtoms)
}

export function PlayPage() {
  const navigate = useNavigate()
  const slides = useDeckStore((s) => s.deck.slides)
  const background = useDeckStore((s) => cssBackground(s.deck.background))
  const sorted = useMemo(
    () => slides.slice().sort((a, b) => a.y - b.y),
    [slides],
  )
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState(1)
  const [height, setHeight] = useState(window.innerHeight)
  const [slideAnimKey, setSlideAnimKey] = useState(0)

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const slide = sorted[index]
  const maxStep = slide
    ? slideMaxStep(slide.slideContent, slide.slideAnimation.steps)
    : 1

  const goSlide = useCallback(
    (nextIndex: number) => {
      const n = sorted.length
      if (n === 0) return
      const i = ((nextIndex % n) + n) % n
      setIndex(i)
      setStep(1)
      setSlideAnimKey((k) => k + 1)
    },
    [sorted.length],
  )

  const next = useCallback(() => {
    if (step < maxStep) {
      setStep((s) => s + 1)
      return
    }
    goSlide(index + 1)
  }, [step, maxStep, goSlide, index])

  const prev = useCallback(() => {
    goSlide(index - 1)
  }, [goSlide, index])

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
        case 'd':
        case 'D':
        case 's':
        case 'S':
          e.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'a':
        case 'A':
        case 'w':
        case 'W':
          e.preventDefault()
          prev()
          break
        case 'Home':
          e.preventDefault()
          goSlide(0)
          break
        case 'End':
          e.preventDefault()
          goSlide(sorted.length - 1)
          break
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate, next, prev, goSlide, sorted.length])

  if (!slide) return null

  const visibleAtoms = slide.slideContent.filter(
    (a) => Math.max(1, a.atomAnimation?.order ?? 1) <= step,
  )
  const layout = visibleAtoms.map((a) => ({
    i: a.i,
    x: a.x,
    y: a.y,
    w: a.w,
    h: a.h,
    static: true,
  }))
  const rowHeight = calcRowHeight(height, GRID_COLS, 5)
  const slideEnter = slide.slideAnimation.enter
  const slideAnimClass =
    slideEnter && slideEnter !== 'none'
      ? `animate__animated animate__${slideEnter}`
      : ''

  return (
    <div
      className="play-page"
      style={{ background, height, ...stageTypographyStyle(height) }}
      onClick={next}
      onContextMenu={(e) => {
        e.preventDefault()
        navigate('/edit')
      }}
    >
      <div
        key={slideAnimKey}
        className={'play-slide-wrap ' + slideAnimClass}
        style={{ width: '100%', height: '100%' }}
      >
        <AutoGrid
          className="play-grid"
          layout={layout}
          cols={GRID_COLS}
          rowHeight={rowHeight}
          margin={[5, 5]}
          isDraggable={false}
          isResizable={false}
          compactType={null}
          preventCollision={false}
          allowOverlap
          useCSSTransforms={false}
          style={{ height: '100%' }}
        >
          {visibleAtoms.map((atom, ai) => {
            const order = Math.max(1, atom.atomAnimation?.order ?? 1)
            const enter = atom.atomAnimation?.enter
            const justRevealed = order === step
            const animClass =
              justRevealed && enter && enter !== 'none'
                ? `animate__animated animate__${enter}`
                : ''
            return (
              <div
                key={`${slide.i}-${atom.i}-${step}-${order}`}
                className={'play-item ' + animClass}
                style={atomStackStyle(atom, ai)}
              >
                <AtomRenderer atom={atom} />
              </div>
            )
          })}
        </AutoGrid>
      </div>
      <div className="play-brand" aria-hidden>
        <BrandLogo size={28} />
      </div>
      <span className="play-page-num">
        {index + 1}/{sorted.length}
        {maxStep > 1 ? ` · ${step}/${maxStep}` : ''}
      </span>
      <div className="play-hint">
        ← → / Space 步进翻页 · Home/End · Esc 返回编辑
      </div>
    </div>
  )
}
