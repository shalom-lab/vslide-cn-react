/**
 * Built-in PPT-like background templates.
 * Mostly solid / soft gradient; a few optional image underlays.
 * Each preset fills a full BackgroundConfig so deck JSON stays compatible.
 */
import {
  defaultBackground,
  emptyBackgroundImage,
  emptyBackgroundTexture,
  type BackgroundConfig,
} from '../types/deck'
import { cssBackground } from '../utils/background'

export interface BgPreset {
  id: string
  name: string
  /** CSS background value for gallery swatch / thumbnail */
  swatch: string
  config: BackgroundConfig
}

/** Fill a complete BackgroundConfig from mode-specific overrides. */
export function makeBg(
  partial: Partial<BackgroundConfig> & Pick<BackgroundConfig, 'mode'>,
): BackgroundConfig {
  const base = defaultBackground()
  const linear = { ...base.linear, ...(partial.linear || {}) }
  if (!linear.stops || linear.stops.length < 2) {
    linear.stops = [
      { color: linear.start, position: 0 },
      { color: linear.end, position: 100 },
    ]
  }
  const radial = { ...base.radial, ...(partial.radial || {}) }
  if (!radial.stops || radial.stops.length < 2) {
    radial.stops = [
      { color: radial.start, position: 0 },
      { color: radial.end, position: 100 },
    ]
  }
  return {
    ...base,
    ...partial,
    pureOpacity: partial.pureOpacity ?? base.pureOpacity ?? 100,
    linear,
    radial,
    image: { ...emptyBackgroundImage(), ...(partial.image || {}) },
    texture: { ...emptyBackgroundTexture(), ...(partial.texture || {}) },
  }
}

export function cloneBg(bg: BackgroundConfig): BackgroundConfig {
  return JSON.parse(JSON.stringify(bg)) as BackgroundConfig
}

function preset(
  id: string,
  name: string,
  config: BackgroundConfig,
): BgPreset {
  return { id, name, swatch: cssBackground(config), config }
}

/** Unsplash photo URL — hotlink-friendly, cover-sized. */
function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=1920&q=80&auto=format&fit=crop`
}

/** Soft photo underlay with white/cream veil for text readability. */
function softImageBg(
  src: string,
  opacity = 68,
  fallback = '#f5f2ec',
): BackgroundConfig {
  return makeBg({
    mode: 'image',
    pure: fallback,
    image: {
      src,
      repeat: 'no-repeat',
      x: 'center',
      y: 'center',
      width: 'cover',
      height: 'auto',
      sizeMode: 'cover',
      opacity,
    },
  })
}

/** Dark photo underlay with a dark veil (custom CSS). */
function darkImageBg(src: string, veilAlpha = 0.52): BackgroundConfig {
  return makeBg({
    mode: 'custom',
    pure: '#1a1d22',
    custom:
      `linear-gradient(rgba(14, 18, 26, ${veilAlpha}), rgba(14, 18, 26, ${veilAlpha})),` +
      `url(${src}) center / cover no-repeat`,
  })
}

/** Soft paper — warm off-white, print-like */
const softPaper = makeBg({
  mode: 'pure',
  pure: '#f7f4ef',
})

/** Pure white */
const pureWhite = makeBg({
  mode: 'pure',
  pure: '#ffffff',
})

/** Conference white — cool tint for light decks */
const conferenceWhite = makeBg({
  mode: 'linear',
  linear: { angle: 165, start: '#fbfcfe', end: '#eef2f7' },
})

/** Warm cream — gentle solid gradient */
const warmCream = makeBg({
  mode: 'linear',
  linear: { angle: 140, start: '#fff8ef', end: '#f3e6d4' },
})

/** Cool mist — soft blue-gray */
const coolMist = makeBg({
  mode: 'linear',
  linear: { angle: 160, start: '#f4f7fa', end: '#e4ebf2' },
})

/** Soft slate — light gray for calm decks */
const softSlate = makeBg({
  mode: 'linear',
  linear: { angle: 150, start: '#f2f3f5', end: '#e4e6ea' },
})

/** Deep slate — dark professional solid */
const deepSlate = makeBg({
  mode: 'linear',
  linear: { angle: 145, start: '#2c3138', end: '#1a1d22' },
})

/** Misty mountains — elegant light photo (optional image) */
const mistMountains = softImageBg(
  unsplash('photo-1506905925346-21bda4d32df4'),
  62,
  '#e8eef4',
)

/** City dusk — dark photo underlay (optional image) */
const duskCity = darkImageBg(
  unsplash('photo-1514565131-fce0801e5785'),
  0.55,
)

/**
 * Built-in gallery (read-only). Order = display order.
 * Mostly solids / soft gradients; at most a couple of image backdrops.
 */
export const BUILTIN_PRESETS: BgPreset[] = [
  preset('soft-paper', '柔和纸质', softPaper),
  preset('pure-white', '纯白', pureWhite),
  preset('conference-white', '会议白', conferenceWhite),
  preset('warm-cream', '暖奶油', warmCream),
  preset('cool-mist', '冷雾灰', coolMist),
  preset('soft-slate', '浅石板', softSlate),
  preset('deep-slate', '深石板', deepSlate),
  preset('mist-mountains', '晨雾山峦', mistMountains),
  preset('dusk-city', '都市暮色', duskCity),
]

/** Default sample / new decks — non-image soft paper. */
export const DEFAULT_PRESET_ID = 'conference-white'

export function getBuiltinPreset(id: string): BgPreset | undefined {
  return BUILTIN_PRESETS.find((p) => p.id === id)
}

/** Default deck background — calm solid (not an image). */
export function preferredDefaultBackground(): BackgroundConfig {
  return cloneBg(
    getBuiltinPreset(DEFAULT_PRESET_ID)?.config ?? softPaper,
  )
}
