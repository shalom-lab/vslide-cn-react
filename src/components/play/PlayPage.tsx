import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GridLayout from 'react-grid-layout'
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

/** Play stage keeps 16:9 and letterboxes into the viewport (fit width×height). */
function fitStage(vw: number, vh: number): { w: number; h: number; scale: number } {
  const designH = Math.max(320, Math.min(vh, vw * (9 / 16)))
  const designW = designH * (16 / 9)
  // If viewport is taller/wider than 16:9, letterbox; stage is already max fit.
  // scale stays 1 because we size the stage in CSS pixels to the fitted box.
  const scale = Math.min(vw / designW, vh / designH)
  return {
    w: Math.floor(designW * scale),
    h: Math.floor(designH * scale),
    scale,
  }
}

function slideMaxStep(atoms: { atomAnimation?: { order?: number } }[], steps: number) {
  const fromAtoms = atoms.reduce(
    (m, a) => Math.max(m, Number(a.atomAnimation?.order) || 1),
    1,
  )
  return Math.max(1, steps || 1, fromAtoms)
}

/** Hand-drawn / sketch-style marks for play chrome (not Lucide). */
function SketchArrow({ dir }: { dir: 'left' | 'right' }) {
  const d =
    dir === 'right'
      ? 'M4 12h14M14 6l6 6-6 6'
      : 'M20 12H6M10 6L4 12l6 6'
  return (
    <svg
      className="play-sketch-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function SketchEsc() {
  return (
    <svg
      className="play-sketch-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="0.2 0"
      />
      <path
        d="M8 9.5h3.2M8 12h5M8 14.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
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
  const [viewport, setViewport] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }))
  const [slideAnimKey, setSlideAnimKey] = useState(0)

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const stage = useMemo(
    () => fitStage(viewport.w, viewport.h),
    [viewport.w, viewport.h],
  )

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
  const rowHeight = calcRowHeight(stage.h, GRID_COLS, 5)
  const slideEnter = slide.slideAnimation.enter
  const slideAnimClass =
    slideEnter && slideEnter !== 'none'
      ? `animate__animated animate__${slideEnter}`
      : ''

  return (
    <div
      className="play-page"
      onClick={next}
      onContextMenu={(e) => {
        e.preventDefault()
        navigate('/edit')
      }}
    >
      <div
        className={'play-stage ' + slideAnimClass}
        key={slideAnimKey}
        style={{
          width: stage.w,
          height: stage.h,
          background,
          ...stageTypographyStyle(stage.h),
        }}
      >
        {/*
          key on each child MUST equal layout[].i — RGL matches by React key.
          Remount-for-animation uses an inner wrapper, not the grid item key.
        */}
        <GridLayout
          className="play-grid"
          width={stage.w}
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
          style={{ width: stage.w, height: stage.h }}
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
                key={atom.i}
                className="play-item"
                style={atomStackStyle(atom, ai)}
              >
                <div
                  key={`${slide.i}-${atom.i}-${step}-${order}`}
                  className={'play-item-inner ' + animClass}
                >
                  <AtomRenderer atom={atom} />
                </div>
              </div>
            )
          })}
        </GridLayout>
      </div>

      <div className="play-brand" aria-hidden>
        <BrandLogo size={28} />
      </div>
      <span className="play-page-num">
        {index + 1}/{sorted.length}
        {maxStep > 1 ? ` · ${step}/${maxStep}` : ''}
      </span>
      <div className="play-hint">
        <span className="play-hint-keys">
          <SketchArrow dir="left" />
          <SketchArrow dir="right" />
          <span className="play-hint-sep">/</span>
          <kbd>Space</kbd>
        </span>
        <span className="play-hint-text">步进翻页</span>
        <span className="play-hint-dot">·</span>
        <span className="play-hint-text">Home/End</span>
        <span className="play-hint-dot">·</span>
        <span className="play-hint-keys">
          <SketchEsc />
          <span className="play-hint-text">返回编辑</span>
        </span>
      </div>
    </div>
  )
}
