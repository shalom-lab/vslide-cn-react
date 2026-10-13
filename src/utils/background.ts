import type {
  BackgroundConfig,
  BackgroundImage,
  BackgroundLinear,
  BackgroundRadial,
  GradientStop,
} from '../types/deck'
import { defaultGradientStops } from '../types/deck'

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.max(0, Math.min(1, n))
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

/** Parse #rgb / #rrggbb / rgb() / rgba() into rgba() with given alpha. */
export function colorWithAlpha(input: string, alpha: number): string {
  const a = clamp01(alpha)
  const hex = input.trim()
  if (hex.startsWith('#')) {
    let r = 0
    let g = 0
    let b = 0
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16)
      g = parseInt(hex[2] + hex[2], 16)
      b = parseInt(hex[3] + hex[3], 16)
    } else if (hex.length >= 7) {
      r = parseInt(hex.slice(1, 3), 16)
      g = parseInt(hex.slice(3, 5), 16)
      b = parseInt(hex.slice(5, 7), 16)
    }
    if ([r, g, b].every((v) => Number.isFinite(v))) {
      return `rgba(${r}, ${g}, ${b}, ${a})`
    }
  }
  const m = hex.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  )
  if (m) {
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`
  }
  // Fallback: leave color and hope browser compositing works
  return input
}

export function resolveStops(
  stops: GradientStop[] | undefined,
  start: string,
  end: string,
): GradientStop[] {
  if (Array.isArray(stops) && stops.length >= 2) {
    return stops
      .map((s) => ({
        color: String(s.color || '#ffffff'),
        position: clampPct(Number(s.position)),
      }))
      .sort((a, b) => a.position - b.position)
  }
  return defaultGradientStops(start || '#ffffff', end || '#000000')
}

function stopsToCss(stops: GradientStop[]): string {
  return stops
    .map((s) => `${s.color} ${clampPct(s.position)}%`)
    .join(', ')
}

export function syncLinearEnds(linear: BackgroundLinear): BackgroundLinear {
  const stops = resolveStops(linear.stops, linear.start, linear.end)
  return {
    ...linear,
    stops,
    start: stops[0]?.color ?? linear.start,
    end: stops[stops.length - 1]?.color ?? linear.end,
  }
}

export function buildRadialShape(radial: BackgroundRadial): string {
  if (radial.shapeKind) {
    const x = radial.positionX?.trim() || 'center'
    const y = radial.positionY?.trim() || 'center'
    return `${radial.shapeKind} at ${x} ${y}`
  }
  return radial.shape || 'ellipse at center'
}

export function syncRadialEnds(radial: BackgroundRadial): BackgroundRadial {
  const stops = resolveStops(radial.stops, radial.start, radial.end)
  const shape = buildRadialShape(radial)
  return {
    ...radial,
    shape,
    stops,
    start: stops[0]?.color ?? radial.start,
    end: stops[stops.length - 1]?.color ?? radial.end,
  }
}

function imageSizeCss(img: BackgroundImage): string {
  if (img.sizeMode === 'cover') return 'cover'
  if (img.sizeMode === 'contain') return 'contain'
  return `${img.width || '100%'} ${img.height || '100%'}`
}

function imageCss(img: BackgroundImage, fallback: string): string {
  if (!img?.src) return fallback
  const repeat = img.repeat || 'no-repeat'
  const layer = `url(${img.src}) ${repeat} ${img.x || 'center'} ${img.y || 'center'} / ${imageSizeCss(img)}`
  const op =
    typeof img.opacity === 'number' && Number.isFinite(img.opacity)
      ? img.opacity
      : 100
  if (op >= 100) return layer
  // Fade image toward white via overlay (PPT-like transparency)
  const a = clamp01(1 - op / 100)
  return `linear-gradient(rgba(255,255,255,${a}), rgba(255,255,255,${a})), ${layer}`
}

/** Mirrors Vuex getter getBackground in store/index.js (+ React fine controls). */
export function cssBackground(bg: BackgroundConfig): string {
  switch (bg.mode) {
    case 'pure': {
      const op =
        typeof bg.pureOpacity === 'number' && Number.isFinite(bg.pureOpacity)
          ? bg.pureOpacity
          : 100
      if (op < 100) return colorWithAlpha(bg.pure, op / 100)
      return bg.pure
    }
    case 'linear': {
      const linear = syncLinearEnds(bg.linear)
      const stops = resolveStops(linear.stops, linear.start, linear.end)
      return `linear-gradient(${linear.angle}deg, ${stopsToCss(stops)})`
    }
    case 'radial': {
      const radial = syncRadialEnds(bg.radial)
      const stops = resolveStops(radial.stops, radial.start, radial.end)
      return `radial-gradient(${buildRadialShape(radial)}, ${stopsToCss(stops)})`
    }
    case 'custom':
      return bg.custom
    case 'image':
      return imageCss(bg.image, bg.pure)
    case 'texture': {
      const tex = bg.texture
      if (!tex?.src) return bg.pure
      const repeat = tex.repeat || 'repeat'
      return `url(${tex.src}) ${repeat}`
    }
    default:
      return bg.pure
  }
}
