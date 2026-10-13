/**
 * Slide-stage relative typography.
 * Set font-size on the stage root from slide height so children using rem scale.
 * Design reference: 540px tall → 1rem = 15px (540 / 36).
 */

export const SLIDE_FONT_DIVISOR = 36
/** Design-time slide height used when converting stored “px” detail values → rem. */
export const SLIDE_REF_HEIGHT = 540

/** CSS px for stage root font-size (= 1rem for descendants). */
export function slideFontSizePx(heightPx: number): number {
  return Math.max(8, heightPx / SLIDE_FONT_DIVISOR)
}

/** Convert a design-px value (authored at SLIDE_REF_HEIGHT) to rem. */
export function designPxToRem(px: number): number {
  const base = SLIDE_REF_HEIGHT / SLIDE_FONT_DIVISOR
  return px / base
}

/** Inline style fragment for a stage root (canvas / play / thumbs). */
export function stageTypographyStyle(heightPx: number): {
  fontSize: number
  ['--slide-font-size']: string
} {
  const px = slideFontSizePx(heightPx)
  return {
    fontSize: px,
    ['--slide-font-size']: `${px}px`,
  }
}
