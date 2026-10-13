/** Deck / slide / atom types mirroring vslide-vue JSON shape (simplified for v1). */

export type AtomType = 'text' | 'echart' | 'tables' | 'images'

export type AtomName =
  | 'text-md'
  | 'text-title'
  | 'simple-line'
  | 'simple-bar'
  | 'simple-pie'
  | 'simple-table'
  | 'single-image'

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
  static: boolean
  atomType: AtomType
  atomBorder: AtomBorder
  atomAnimation: AtomAnimation
  atomContent: AtomContent
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
}

export interface BackgroundConfig {
  mode: 'pure' | 'linear' | 'radial' | 'custom' | 'image' | 'texture'
  pure: string
  linear: { angle: number; start: string; end: string }
  radial: { shape: string; start: string; end: string }
  custom: string
}

export interface DeckFile {
  fileType: 'vslideFile'
  fileName: string
  id: string
  date: number
  author: string
  tags: string[]
  background: BackgroundConfig
  slides: Slide[]
}

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

export const defaultBackground = (): BackgroundConfig => ({
  mode: 'pure',
  pure: 'rgba(249, 249, 249, 1)',
  linear: {
    angle: 23,
    start: 'rgba(98, 116, 137, 1)',
    end: 'rgba(58,153,178,1)',
  },
  radial: {
    shape: 'ellipse',
    start: 'rgba(58,153,178,1)',
    end: 'rgba(13,56,112,1)',
  },
  custom: 'linear-gradient(20deg, #feac5e, #c779d0, #4bc0c8)',
})
