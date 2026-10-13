/** Pixel ↔ react-grid-layout cell math (matches Canvas: 48 cols, margin [4,4], padding [0,0]). */

/** Canonical 16:9 stage used by thumbs (and typography ref height). */
export const STAGE_ASPECT_W = 16
export const STAGE_ASPECT_H = 9
/** Design-time slide height; typography SLIDE_REF_HEIGHT re-exports this. */
export const STAGE_REF_HEIGHT = 540
export const STAGE_REF_WIDTH = Math.round(
  (STAGE_REF_HEIGHT * STAGE_ASPECT_W) / STAGE_ASPECT_H,
) // 960

export const GRID_COLS = 48
/** Historical vue-grid-layout / early React col count — used for load-time migration. */
export const LEGACY_COLS = 18
export const GRID_SCALE = GRID_COLS / LEGACY_COLS // 8/3
export const GRID_MARGIN: [number, number] = [4, 4]
export const GRID_PADDING: [number, number] = [0, 0]
/** Place-first / snap minimum cell size on the 48-col grid. */
export const GRID_MIN_W = 4
export const GRID_MIN_H = 4

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

/**
 * Row height so `rows` cells + vertical margins fill `containerHeight`
 * (mirrors calcColWidth). Plain `height/rows` ignored margins and made
 * atom boxes taller than the stage — charts looked vertically squashed
 * relative to empty space in the atom.
 */
export function calcRowHeight(
  containerHeight: number,
  rows = GRID_COLS,
  marginY: number = GRID_MARGIN[1],
  paddingY: number = GRID_PADDING[1],
): number {
  const usable =
    containerHeight - marginY * Math.max(0, rows - 1) - paddingY * 2
  return Math.max(1, Math.floor(usable / rows))
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

/** Scale one legacy (18-col) layout number onto the current grid. */
export function scaleLegacyCell(n: number): number {
  return Math.round(Number(n) * GRID_SCALE)
}

export function scaleLegacyRect(rect: GridLayoutRect): GridLayoutRect {
  return {
    x: scaleLegacyCell(rect.x),
    y: scaleLegacyCell(rect.y),
    w: Math.max(GRID_MIN_W, scaleLegacyCell(rect.w)),
    h: Math.max(GRID_MIN_H, scaleLegacyCell(rect.h)),
  }
}

/**
 * True when atom layouts look like the old 18-col grid.
 * Prefer an explicit deck.gridCols when present; otherwise max(x+w) ≤ 18.
 */
export function deckLooksLikeLegacyCols(
  atoms: Iterable<{ x: number; y: number; w: number; h: number }>,
  gridCols?: number,
): boolean {
  if (gridCols === GRID_COLS) return false
  if (gridCols === LEGACY_COLS) return true
  let maxRight = 0
  let count = 0
  for (const a of atoms) {
    count += 1
    maxRight = Math.max(maxRight, (Number(a.x) || 0) + (Number(a.w) || 0))
  }
  if (count === 0) return false
  return maxRight > 0 && maxRight <= LEGACY_COLS
}
