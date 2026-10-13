/**
 * Built-in PPT-like background templates.
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
  /** CSS background value for gallery swatch */
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

/** Soft paper — warm off-white, print-like */
const softPaper = makeBg({
  mode: 'pure',
  pure: '#f7f4ef',
})

/** Conference white — cool tint for light decks */
const conferenceWhite = makeBg({
  mode: 'linear',
  linear: { angle: 165, start: '#fbfcfe', end: '#eef2f7' },
})

/** Warm cream */
const warmCream = makeBg({
  mode: 'linear',
  linear: { angle: 140, start: '#fff8ef', end: '#f3e6d4' },
})

/** Soft sage */
const softSage = makeBg({
  mode: 'linear',
  linear: { angle: 155, start: '#f2f6f2', end: '#d8e4dc' },
})

/** Dusk blue — muted presentation blue */
const duskBlue = makeBg({
  mode: 'linear',
  linear: { angle: 160, start: '#2a3f55', end: '#1a2838' },
})

/** Deep slate — dark professional */
const deepSlate = makeBg({
  mode: 'linear',
  linear: { angle: 145, start: '#2c3138', end: '#1a1d22' },
})

/** Midnight indigo */
const midnightIndigo = makeBg({
  mode: 'radial',
  radial: {
    shape: 'ellipse at 30% 20%',
    start: '#2a2f55',
    end: '#12131f',
  },
})

/** Soft aurora / mesh (light) */
const softAurora = makeBg({
  mode: 'custom',
  custom:
    'radial-gradient(ellipse 80% 60% at 18% 22%, rgba(186, 210, 255, 0.55), transparent 55%),' +
    'radial-gradient(ellipse 70% 55% at 82% 18%, rgba(255, 210, 230, 0.45), transparent 50%),' +
    'radial-gradient(ellipse 75% 60% at 55% 88%, rgba(190, 235, 220, 0.4), transparent 55%),' +
    'linear-gradient(165deg, #f7f8fc, #eef1f7)',
})

/** Soft mesh dusk (dark) */
const duskMesh = makeBg({
  mode: 'custom',
  custom:
    'radial-gradient(ellipse 70% 55% at 15% 20%, rgba(88, 120, 180, 0.45), transparent 55%),' +
    'radial-gradient(ellipse 60% 50% at 85% 25%, rgba(140, 90, 150, 0.35), transparent 50%),' +
    'radial-gradient(ellipse 65% 55% at 50% 90%, rgba(50, 100, 130, 0.35), transparent 55%),' +
    'linear-gradient(160deg, #1c2433, #121820)',
})

/** Subtle dot paper */
const dotPaper = makeBg({
  mode: 'custom',
  custom:
    'radial-gradient(circle, rgba(60, 64, 67, 0.07) 1px, transparent 1.5px) 0 0 / 18px 18px,' +
    'linear-gradient(180deg, #faf9f6, #f3f1ec)',
})

/** Soft geometric diagonals */
const softGeometry = makeBg({
  mode: 'custom',
  custom:
    'repeating-linear-gradient(135deg, transparent, transparent 14px, rgba(90, 110, 140, 0.045) 14px, rgba(90, 110, 140, 0.045) 15px),' +
    'linear-gradient(160deg, #f5f7fa, #e8edf3)',
})

/** Champagne mist */
const champagneMist = makeBg({
  mode: 'custom',
  custom:
    'radial-gradient(ellipse 90% 70% at 70% 10%, rgba(255, 220, 180, 0.35), transparent 50%),' +
    'radial-gradient(ellipse 60% 50% at 10% 80%, rgba(230, 210, 190, 0.3), transparent 50%),' +
    'linear-gradient(150deg, #fbf6ef, #efe4d6)',
})

/** Built-in gallery (read-only). Order = display order. */
export const BUILTIN_PRESETS: BgPreset[] = [
  preset('soft-paper', '柔和纸质', softPaper),
  preset('conference-white', '会议白', conferenceWhite),
  preset('warm-cream', '暖奶油', warmCream),
  preset('soft-sage', '浅鼠尾草', softSage),
  preset('soft-aurora', '柔光极光', softAurora),
  preset('champagne-mist', '香槟薄雾', champagneMist),
  preset('dot-paper', '细点纸纹', dotPaper),
  preset('soft-geometry', '淡几何', softGeometry),
  preset('dusk-blue', '黄昏蓝', duskBlue),
  preset('deep-slate', '深石板', deepSlate),
  preset('midnight-indigo', '午夜靛蓝', midnightIndigo),
  preset('dusk-mesh', '暮色网格', duskMesh),
]

export const DEFAULT_PRESET_ID = 'soft-paper'

export function getBuiltinPreset(id: string): BgPreset | undefined {
  return BUILTIN_PRESETS.find((p) => p.id === id)
}

/** Default deck background — handsome soft paper (not flat gray). */
export function preferredDefaultBackground(): BackgroundConfig {
  return cloneBg(
    getBuiltinPreset(DEFAULT_PRESET_ID)?.config ?? softPaper,
  )
}
