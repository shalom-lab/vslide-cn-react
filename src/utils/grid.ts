/** Pixel ↔ react-grid-layout cell math (matches Canvas: 18 cols, margin [4,4], padding [0,0]). */

export const GRID_COLS = 18
export const GRID_MARGIN: [number, number] = [4, 4]
export const GRID_PADDING: [number, number] = [0, 0]
export const GRID_MIN_W = 2
export const GRID_MIN_H = 2

export interface GridLayoutRect {
  x: number
  y: number
  w: number
  h: number
}

export interface GridMetrics {
  cols: number
  rowHeight: number
  colWidth: number
  margin: [number, number]
  containerPadding: [number, number]
  containerWidth: number
  containerHeight: number
}

export function calcRowHeight(containerHeight: number, rows = GRID_COLS): number {
  return Math.max(8, Math.floor(containerHeight / rows))
}

export function calcColWidth(
  containerWidth: number,
  cols = GRID_COLS,
  margin = GRID_MARGIN,
  padding = GRID_PADDING,
): number {
  return (
    (containerWidth - margin[0] * (cols - 1) - padding[0] * 2) / cols
  )
}

export function buildGridMetrics(
  containerWidth: number,
  containerHeight: number,
): GridMetrics {
  const rowHeight = calcRowHeight(containerHeight)
  return {
    cols: GRID_COLS,
    rowHeight,
    colWidth: calcColWidth(containerWidth),
    margin: GRID_MARGIN,
    containerPadding: GRID_PADDING,
    containerWidth,
    containerHeight,
  }
}

/** Convert a pixel rect (relative to grid container) to snapped grid cells. */
export function pixelsToGrid(
  left: number,
  top: number,
  width: number,
  height: number,
  m: GridMetrics,
): GridLayoutRect {
  const { colWidth, rowHeight, margin, containerPadding, cols } = m
  const stepX = colWidth + margin[0]
  const stepY = rowHeight + margin[1]

  let x = Math.round((left - containerPadding[0]) / stepX)
  let y = Math.round((top - containerPadding[1]) / stepY)
  let w = Math.round((width + margin[0]) / stepX)
  let h = Math.round((height + margin[1]) / stepY)

  w = Math.max(GRID_MIN_W, w)
  h = Math.max(GRID_MIN_H, h)
  x = Math.max(0, Math.min(x, cols - w))
  y = Math.max(0, y)

  return { x, y, w, h }
}

/** Grid cell rect → CSS pixel box inside the container (for placeholder overlay). */
export function gridToPixels(
  rect: GridLayoutRect,
  m: GridMetrics,
): { left: number; top: number; width: number; height: number } {
  const { colWidth, rowHeight, margin, containerPadding } = m
  const left = Math.round(
    (colWidth + margin[0]) * rect.x + containerPadding[0],
  )
  const top = Math.round(
    (rowHeight + margin[1]) * rect.y + containerPadding[1],
  )
  const width = Math.round(
    colWidth * rect.w + Math.max(0, rect.w - 1) * margin[0],
  )
  const height = Math.round(
    rowHeight * rect.h + Math.max(0, rect.h - 1) * margin[1],
  )
  return { left, top, width, height }
}
