/**
 * Deck / slide / atom types mirroring vslide-vue Vuex + Template JSON.
 * Prefer old field names; React-only adapters live in utils/serialize.ts.
 */

export type AtomType = 'text' | 'echart' | 'tables' | 'images' | 'html'

/** Known Vue atomNames (+ React subset `simple-bar`). */
export type AtomName =
  | 'text-md'
  | 'text-shadow'
  | 'custom-html'
  | 'simple-line'
  | 'simple-bar' // React subset alias (Vue: multi-bar)
  | 'multi-bar'
  | 'stack-bar'
  | 'hor-bar'
  | 'simple-pie'
  | 'simple-scatter'
  | 'simple-table'
  | 'single-image'
  | 'image-group'
  | (string & {})

export interface AtomBorder {
  width: number
  type: string
  color: string
  radius: number
}

export interface AtomAnimation {
  order: number
  enter: string
  leave: string
}

export interface TextShadowDetail {
  text: string
  color: string
  fontFamily: string
  fontSize: number
  fontWeight: number | string
  shadow: { h: number; v: number; blur: number; color: string }
}

export interface TextMdDetail {
  markdown: string
  editorId?: string
  /** Legacy typo/casing from some factory/demo files */
  editorid?: string
}

/** Safe custom HTML block — always sanitized before render (no JS). */
export interface CustomHtmlDetail {
  html: string
  editorId?: string
}

export interface TableDetail {
  sheetData: (string | number)[][]
  nr: number
  nc: number
  pagination: { pageSize: number; show: boolean }
}

export interface SingleImageDetail {
  src: string
}

/** ECharts title object as stored in Vue (not a plain string). */
export interface EchartTitle {
  show?: boolean
  text?: string
  [key: string]: unknown
}

export interface EchartDetailBase {
  sheetData: (string | number)[][]
  nr: number
  nc: number
  animation?: boolean
  title?: EchartTitle | string
  [key: string]: unknown
}

export interface AtomContent {
  atomName: AtomName
  detail: Record<string, unknown>
}

export interface Atom {
  i: string
  x: number
  y: number
  w: number
  h: number
  /** Lock / pin — toggled by 固定 */
  static: boolean
  /** Template-protected; Vue forbids edit when account.role === "user" */
  super: boolean
  atomType: AtomType
  atomBorder: AtomBorder
  atomAnimation: AtomAnimation
  atomContent: AtomContent
  /**
   * Paint order for overlap (React extension). Higher = on top.
   * Canonical order is still slideContent array index; zIndex mirrors 1..n.
   * Vue has no zIndex — overlap uses DOM/array order only.
   */
  zIndex?: number
  /** vue-grid-layout runtime flag, preserved on round-trip */
  moved?: boolean
}

export interface SlideAnimation {
  steps: number
  enter: string
  leave: string
}

export interface Slide {
  i: string
  x: number
  y: number
  w: number
  h: number
  slideAnimation: SlideAnimation
  slideContent: Atom[]
  moved?: boolean
}

export interface BackgroundImage {
  src: string
  repeat: string
  x: string
  y: string
  width: string
  height: string
}

export interface BackgroundTexture {
  src: string
}

export interface BackgroundConfig {
  mode: 'pure' | 'linear' | 'radial' | 'custom' | 'image' | 'texture'
  pure: string
  linear: { angle: number; start: string; end: string }
  radial: { shape: string; start: string; end: string }
  custom: string
  image: BackgroundImage
  texture: BackgroundTexture
}

export interface DeckFile {
  fileType: 'vslideFile'
  fileName: string
  id: string
  date: number
  author: string
  shared: boolean
  tags: string[]
  background: BackgroundConfig
  /** Serialized CSS from Vue getter getBackground — stored in JSON */
  getBackground: string
  slides: Slide[]
}

export type EditorFocus =
  | 'sheetData'
  | 'atomContent'
  | 'atomBorder'
  | 'atomAnimation'
  | null

export const defaultBorder = (): AtomBorder => ({
  width: 0,
  type: 'solid',
  color: '#808080',
  radius: 1,
})

export const defaultAnimation = (): AtomAnimation => ({
  order: 1,
  enter: 'fadeIn',
  leave: 'fadeOut',
})

export const defaultSlideAnimation = (): SlideAnimation => ({
  steps: 1,
  enter: 'fadeIn',
  leave: 'fadeOut',
})

export const emptyBackgroundImage = (): BackgroundImage => ({
  src: '',
  repeat: 'repeat',
  x: 'center',
  y: 'center',
  width: '100%',
  height: '100%',
})

export const emptyBackgroundTexture = (): BackgroundTexture => ({
  src: '',
})

export const defaultBackground = (): BackgroundConfig => ({
  mode: 'pure',
  pure: '#f7f4ef',
  linear: {
    angle: 165,
    start: '#fbfcfe',
    end: '#eef2f7',
  },
  radial: {
    shape: 'ellipse at 30% 20%',
    start: '#2a2f55',
    end: '#12131f',
  },
  custom:
    'radial-gradient(ellipse 80% 60% at 18% 22%, rgba(186, 210, 255, 0.55), transparent 55%),' +
    'radial-gradient(ellipse 70% 55% at 82% 18%, rgba(255, 210, 230, 0.45), transparent 50%),' +
    'linear-gradient(165deg, #f7f8fc, #eef1f7)',
  image: emptyBackgroundImage(),
  texture: emptyBackgroundTexture(),
})

export function sheetNrNc(sheetData: (string | number)[][]): {
  nr: number
  nc: number
} {
  const nr = Math.max(0, sheetData.length - 1)
  const nc = Math.max(0, (sheetData[0]?.length ?? 1) - 1)
  return { nr, nc }
}

export function defaultEchartTitle(text = ''): EchartTitle {
  return {
    show: true,
    text,
    link: '',
    target: 'blank',
    subtext: '',
  }
}
