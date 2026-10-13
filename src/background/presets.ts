/**
 * Built-in PPT-like background templates.
 * Solids, soft gradients, and CSS textures / patterns — no photo URLs.
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

/** CSS `background` shorthand stored as custom mode. */
function cssBg(css: string, fallback = '#f7f4ef'): BackgroundConfig {
  return makeBg({
    mode: 'custom',
    pure: fallback,
    custom: css,
  })
}

/**
 * Tiny tiled fractal-noise SVG — subtle grain when layered over a solid/gradient.
 * Encoded for use inside url("…") without escaping issues.
 */
function noiseSvg(opacity = 0.4, baseFrequency = 0.9): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">` +
    `<filter id="n">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="4" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `</filter>` +
    `<rect width="100%" height="100%" filter="url(#n)" opacity="${opacity}"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// ——— Solids & soft gradients ———

const softPaper = makeBg({
  mode: 'pure',
  pure: '#f7f4ef',
})

const pureWhite = makeBg({
  mode: 'pure',
  pure: '#ffffff',
})

const conferenceWhite = makeBg({
  mode: 'linear',
  linear: { angle: 165, start: '#fbfcfe', end: '#eef2f7' },
})

const warmCream = makeBg({
  mode: 'linear',
  linear: { angle: 140, start: '#fff8ef', end: '#f3e6d4' },
})

const coolMist = makeBg({
  mode: 'linear',
  linear: { angle: 160, start: '#f4f7fa', end: '#e4ebf2' },
})

const softSlate = makeBg({
  mode: 'linear',
  linear: { angle: 150, start: '#f2f3f5', end: '#e4e6ea' },
})

const deepSlate = makeBg({
  mode: 'linear',
  linear: { angle: 145, start: '#2c3138', end: '#1a1d22' },
})

const softAurora = cssBg(
  'radial-gradient(ellipse 80% 60% at 18% 22%, rgba(186, 210, 255, 0.55), transparent 55%),' +
    'radial-gradient(ellipse 70% 55% at 82% 18%, rgba(255, 210, 230, 0.45), transparent 50%),' +
    'linear-gradient(165deg, #f7f8fc, #eef1f7)',
  '#f7f8fc',
)

// ——— CSS textures / patterns (no photos) ———

/** Soft paper grain — warm off-white + fine noise */
const paperGrain = cssBg(
  `${noiseSvg(0.28, 0.85)} repeat, #f7f4ef`,
  '#f7f4ef',
)

/** Cool paper grain */
const coolGrain = cssBg(
  `${noiseSvg(0.22, 0.9)} repeat, #f4f6f9`,
  '#f4f6f9',
)

/** Subtle dot field */
const softDots = cssBg(
  'radial-gradient(circle, rgba(55, 65, 81, 0.14) 1px, transparent 1.5px) 0 0 / 14px 14px, #f8f7f4',
  '#f8f7f4',
)

/** Larger sparse dots */
const sparseDots = cssBg(
  'radial-gradient(circle, rgba(70, 80, 100, 0.11) 1.25px, transparent 1.75px) 0 0 / 22px 22px, #faf9f7',
  '#faf9f7',
)

/** Graph / notebook grid */
const graphPaper = cssBg(
  'linear-gradient(rgba(90, 110, 140, 0.1) 1px, transparent 1px) 0 0 / 22px 22px,' +
    'linear-gradient(90deg, rgba(90, 110, 140, 0.1) 1px, transparent 1px) 0 0 / 22px 22px,' +
    '#fafbfd',
  '#fafbfd',
)

/** Fine blueprint-style grid on cool tint */
const blueprint = cssBg(
  'linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px) 0 0 / 28px 28px,' +
    'linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px) 0 0 / 28px 28px,' +
    'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 7px 7px,' +
    'linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 7px 7px,' +
    '#1e3a5f',
  '#1e3a5f',
)

/** Diagonal hatch — fabric-like */
const diagonalHatch = cssBg(
  'repeating-linear-gradient(135deg, transparent, transparent 7px, rgba(0, 0, 0, 0.035) 7px, rgba(0, 0, 0, 0.035) 8px),' +
    '#f5f2ec',
  '#f5f2ec',
)

/** Cross-hatch linen */
const linenWeave = cssBg(
  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(80, 70, 50, 0.04) 3px, rgba(80, 70, 50, 0.04) 4px),' +
    'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(80, 70, 50, 0.04) 3px, rgba(80, 70, 50, 0.04) 4px),' +
    '#f3efe6',
  '#f3efe6',
)

/** Soft vertical pinstripe */
const pinstripe = cssBg(
  'repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(60, 70, 90, 0.06) 11px, rgba(60, 70, 90, 0.06) 12px),' +
    '#f6f5f2',
  '#f6f5f2',
)

/** Checker / diamond micro-pattern */
const softChecker = cssBg(
  'linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%) 0 0 / 16px 16px,' +
    'linear-gradient(-45deg, rgba(0,0,0,0.03) 25%, transparent 25%) 0 0 / 16px 16px,' +
    'linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.03) 75%) 0 0 / 16px 16px,' +
    'linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.03) 75%) 0 0 / 16px 16px,' +
    '#f7f6f3',
  '#f7f6f3',
)

/** Night noise — dark grain for dark decks */
const nightGrain = cssBg(
  `${noiseSvg(0.45, 0.8)} repeat, linear-gradient(160deg, #2a2e36, #16181d)`,
  '#1a1d22',
)

/**
 * Built-in gallery (read-only). Order = display order.
 * Solids / soft gradients + CSS textures & patterns — no photo URLs.
 */
export const BUILTIN_PRESETS: BgPreset[] = [
  preset('paper-grain', '纸质纹理', paperGrain),
  preset('soft-paper', '柔和纸质', softPaper),
  preset('pure-white', '纯白', pureWhite),
  preset('soft-aurora', '柔光极光', softAurora),
  preset('conference-white', '会议白', conferenceWhite),
  preset('warm-cream', '暖奶油', warmCream),
  preset('cool-mist', '冷雾灰', coolMist),
  preset('soft-slate', '浅石板', softSlate),
  preset('soft-dots', '细点纹理', softDots),
  preset('sparse-dots', '疏点纹理', sparseDots),
  preset('graph-paper', '方格纸', graphPaper),
  preset('diagonal-hatch', '斜纹织物', diagonalHatch),
  preset('linen-weave', '亚麻编织', linenWeave),
  preset('pinstripe', '细竖条纹', pinstripe),
  preset('soft-checker', '微菱格', softChecker),
  preset('cool-grain', '冷色颗粒', coolGrain),
  preset('deep-slate', '深石板', deepSlate),
  preset('blueprint', '蓝图网格', blueprint),
  preset('night-grain', '夜色噪点', nightGrain),
]

/** Default sample / new decks — subtle paper grain texture. */
export const DEFAULT_PRESET_ID = 'paper-grain'

export function getBuiltinPreset(id: string): BgPreset | undefined {
  return BUILTIN_PRESETS.find((p) => p.id === id)
}

/** Default deck background — CSS texture (not a photo). */
export function preferredDefaultBackground(): BackgroundConfig {
  return cloneBg(
    getBuiltinPreset(DEFAULT_PRESET_ID)?.config ?? softPaper,
  )
}
