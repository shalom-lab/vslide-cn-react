import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'vslide-editor-pane-widths'

export const PANE_DEFAULTS = { left: 250, right: 220 } as const
export const PANE_LIMITS = {
  left: { min: 120, max: 360 },
  right: { min: 180, max: 420 },
} as const

type Side = 'left' | 'right'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function loadWidths(): { left: number; right: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...PANE_DEFAULTS }
    const parsed = JSON.parse(raw) as { left?: unknown; right?: unknown }
    return {
      left: clamp(
        Number(parsed.left) || PANE_DEFAULTS.left,
        PANE_LIMITS.left.min,
        PANE_LIMITS.left.max,
      ),
      right: clamp(
        Number(parsed.right) || PANE_DEFAULTS.right,
        PANE_LIMITS.right.min,
        PANE_LIMITS.right.max,
      ),
    }
  } catch {
    return { ...PANE_DEFAULTS }
  }
}

function saveWidths(left: number, right: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, right }))
  } catch {
    /* quota / private mode */
  }
}

/**
 * Left / right editor pane widths with drag + localStorage persistence.
 * Dragging the left handle grows/shrinks the slide list;
 * dragging the right handle grows/shrinks the property panel.
 */
export function useResizablePanes() {
  const [widths, setWidths] = useState(loadWidths)
  const [dragging, setDragging] = useState<Side | null>(null)
  const widthsRef = useRef(widths)
  widthsRef.current = widths

  useEffect(() => {
    saveWidths(widths.left, widths.right)
  }, [widths.left, widths.right])

  const reset = useCallback(() => {
    setWidths({ ...PANE_DEFAULTS })
  }, [])

  const startDrag = useCallback((side: Side, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startLeft = widthsRef.current.left
    const startRight = widthsRef.current.right
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    setDragging(side)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      if (side === 'left') {
        const next = clamp(
          startLeft + dx,
          PANE_LIMITS.left.min,
          PANE_LIMITS.left.max,
        )
        setWidths((w) => (w.left === next ? w : { ...w, left: next }))
      } else {
        // Dragging right handle rightward shrinks the right pane
        const next = clamp(
          startRight - dx,
          PANE_LIMITS.right.min,
          PANE_LIMITS.right.max,
        )
        setWidths((w) => (w.right === next ? w : { ...w, right: next }))
      }
    }

    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      setDragging(null)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }, [])

  const onDoubleClick = useCallback((side: Side) => {
    setWidths((w) =>
      side === 'left'
        ? { ...w, left: PANE_DEFAULTS.left }
        : { ...w, right: PANE_DEFAULTS.right },
    )
  }, [])

  return {
    leftWidth: widths.left,
    rightWidth: widths.right,
    dragging,
    startDrag,
    onDoubleClick,
    reset,
  }
}
