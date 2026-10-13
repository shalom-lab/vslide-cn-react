/** Curated ECharts color schemes (built-in / common theme palettes). */

export type ChartPaletteId =
  | 'classic'
  | 'dark'
  | 'vintage'
  | 'macarons'
  | 'shine'
  | 'roma'
  | 'infographic'

export interface ChartPalette {
  id: ChartPaletteId
  /** Chinese display name */
  label: string
  /** Short English / theme key hint */
  hint: string
  colors: string[]
}

/** ECharts default series colors (globalDefault). */
const CLASSIC: string[] = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
]

/** From echarts/theme/dark.js */
const DARK: string[] = [
  '#4992ff',
  '#7cffb2',
  '#fddd60',
  '#ff6e76',
  '#58d9f9',
  '#05c091',
  '#ff8a45',
  '#8d48e3',
  '#dd79ff',
]

/** From echarts/theme/vintage.js */
const VINTAGE: string[] = [
  '#d87c7c',
  '#919e8b',
  '#d7ab82',
  '#6e7074',
  '#61a0a8',
  '#efa18d',
  '#787464',
  '#cc7e63',
  '#724e58',
  '#4b565b',
]

/** From echarts/theme/macarons.js */
const MACARONS: string[] = [
  '#2ec7c9',
  '#b6a2de',
  '#5ab1ef',
  '#ffb980',
  '#d87a80',
  '#8d98b3',
  '#e5cf0d',
  '#97b552',
  '#95706d',
  '#dc69aa',
]

/** From echarts/theme/shine.js */
const SHINE: string[] = [
  '#c12e34',
  '#e6b600',
  '#0098d9',
  '#2b821d',
  '#005eaa',
  '#339ca8',
  '#cda819',
  '#32a487',
]

/** From echarts/theme/roma.js */
const ROMA: string[] = [
  '#E01F54',
  '#001852',
  '#f5e8c8',
  '#b8d2c7',
  '#c6b38e',
  '#a4d8c2',
  '#f3d999',
  '#d3758f',
  '#dcc392',
  '#2e4783',
]

/** From echarts/theme/infographic.js */
const INFOGRAPHIC: string[] = [
  '#C1232B',
  '#27727B',
  '#FCCE10',
  '#E87C25',
  '#B5C334',
  '#FE8463',
  '#9BCA63',
  '#FAD860',
  '#F3A43B',
  '#60C0DD',
]

export const CHART_PALETTES: ChartPalette[] = [
  { id: 'classic', label: '经典', hint: 'ECharts 默认', colors: CLASSIC },
  { id: 'dark', label: '暗色', hint: 'dark', colors: DARK },
  { id: 'vintage', label: '复古', hint: 'vintage', colors: VINTAGE },
  { id: 'macarons', label: '马卡龙', hint: 'macarons', colors: MACARONS },
  { id: 'shine', label: '闪耀', hint: 'shine', colors: SHINE },
  { id: 'roma', label: '罗马', hint: 'roma', colors: ROMA },
  { id: 'infographic', label: '信息图', hint: 'infographic', colors: INFOGRAPHIC },
]

export const DEFAULT_CHART_PALETTE_ID: ChartPaletteId = 'classic'

export function getPaletteById(id: string | null | undefined): ChartPalette {
  return (
    CHART_PALETTES.find((p) => p.id === id) ??
    CHART_PALETTES.find((p) => p.id === DEFAULT_CHART_PALETTE_ID)!
  )
}

export function isChartPaletteId(id: string): id is ChartPaletteId {
  return CHART_PALETTES.some((p) => p.id === id)
}
