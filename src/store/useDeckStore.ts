import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { createSampleDeck } from '../data/sampleDeck'
import type {
  Atom,
  BackgroundConfig,
  DeckFile,
  EditorFocus,
  Slide,
} from '../types/deck'
import {
  defaultAnimation,
  defaultBorder,
  defaultEchartTitle,
  defaultSlideAnimation,
  sheetNrNc,
} from '../types/deck'
import { cssBackground } from '../utils/background'
import { normalizeDeck } from '../utils/serialize'
import {
  applyLayerOrder,
  withZIndex,
  type LayerAction,
} from '../utils/layerOrder'

const LOCAL_ATOMS_KEY = 'vslide-cn-react:localAtoms'

interface DeckState {
  deck: DeckFile
  activeSlideId: string
  activeAtomId: string | null
  editorFocus: EditorFocus
  localAtoms: Atom[]
  toast: string | null
  setActiveSlide: (id: string) => void
  setActiveAtom: (id: string | null) => void
  setEditorFocus: (focus: EditorFocus) => void
  clearToast: () => void
  updateSlideLayout: (slideId: string, atoms: Atom[]) => void
  updateAtom: (slideId: string, atomId: string, patch: Partial<Atom>) => void
  updateAtomDetail: (
    slideId: string,
    atomId: string,
    detail: Record<string, unknown>,
  ) => void
  addSlide: () => void
  duplicateSlide: () => void
  removeSlide: () => void
  addAtom: (atom: Atom) => void
  duplicateActiveAtom: () => void
  removeActiveAtom: () => void
  toggleFixedActiveAtom: () => void
  /** 置顶 / 置底 / 上移一层 / 下移一层 */
  reorderActiveAtom: (action: LayerAction) => void
  saveActiveAtomToGallery: () => void
  setBackground: (bg: BackgroundConfig) => void
  replaceDeck: (deck: DeckFile | unknown) => void
  resetSample: () => void
}

function blankSlide(y: number, i: string): Slide {
  return {
    i,
    x: 0,
    y,
    w: 1,
    h: 1,
    slideAnimation: defaultSlideAnimation(),
    slideContent: [],
  }
}

function withGetBackground(deck: DeckFile): DeckFile {
  return { ...deck, getBackground: cssBackground(deck.background) }
}

function loadLocalAtoms(): Atom[] {
  try {
    const raw = localStorage.getItem(LOCAL_ATOMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistLocalAtoms(atoms: Atom[]) {
  try {
    localStorage.setItem(LOCAL_ATOMS_KEY, JSON.stringify(atoms))
  } catch {
    /* quota */
  }
}

const initial = createSampleDeck()

export const useDeckStore = create<DeckState>((set, get) => ({
  deck: initial,
  activeSlideId: initial.slides[0]?.i ?? '0',
  activeAtomId: null,
  editorFocus: null,
  localAtoms: typeof localStorage !== 'undefined' ? loadLocalAtoms() : [],
  toast: null,

  setActiveSlide: (id) =>
    set({ activeSlideId: id, activeAtomId: null, editorFocus: null }),
  setActiveAtom: (id) => set({ activeAtomId: id }),
  setEditorFocus: (focus) => set({ editorFocus: focus }),
  clearToast: () => set({ toast: null }),

  updateSlideLayout: (slideId, atoms) =>
    set((s) => ({
      deck: withGetBackground({
        ...s.deck,
        slides: s.deck.slides.map((sl) =>
          sl.i === slideId ? { ...sl, slideContent: atoms } : sl,
        ),
      }),
    })),

  updateAtom: (slideId, atomId, patch) =>
    set((s) => ({
      deck: withGetBackground({
        ...s.deck,
        slides: s.deck.slides.map((sl) =>
          sl.i !== slideId
            ? sl
            : {
                ...sl,
                slideContent: sl.slideContent.map((a) =>
                  a.i === atomId ? { ...a, ...patch } : a,
                ),
              },
        ),
      }),
    })),

  updateAtomDetail: (slideId, atomId, detail) =>
    set((s) => ({
      deck: withGetBackground({
        ...s.deck,
        slides: s.deck.slides.map((sl) =>
          sl.i !== slideId
            ? sl
            : {
                ...sl,
                slideContent: sl.slideContent.map((a) => {
                  if (a.i !== atomId) return a
                  const nextDetail = { ...a.atomContent.detail, ...detail }
                  if (
                    (a.atomType === 'echart' || a.atomType === 'tables') &&
                    Array.isArray(nextDetail.sheetData)
                  ) {
                    const dims = sheetNrNc(
                      nextDetail.sheetData as (string | number)[][],
                    )
                    nextDetail.nr = dims.nr
                    nextDetail.nc = dims.nc
                  }
                  return {
                    ...a,
                    atomContent: {
                      ...a.atomContent,
                      detail: nextDetail,
                    },
                  }
                }),
              },
        ),
      }),
    })),

  addSlide: () => {
    const { deck, activeSlideId } = get()
    const active = deck.slides.find((s) => s.i === activeSlideId)
    const y = (active?.y ?? deck.slides.length - 1) + 0.5
    const i = nanoid(8)
    const slides = [...deck.slides, blankSlide(y, i)].sort((a, b) => a.y - b.y)
    slides.forEach((s, idx) => {
      s.y = idx
    })
    set({
      deck: withGetBackground({ ...deck, slides }),
      activeSlideId: i,
      activeAtomId: null,
      editorFocus: null,
    })
  },

  duplicateSlide: () => {
    const { deck, activeSlideId } = get()
    const active = deck.slides.find((s) => s.i === activeSlideId)
    if (!active) return
    const i = nanoid(8)
    const copy: Slide = {
      ...JSON.parse(JSON.stringify(active)),
      i,
      y: active.y + 0.5,
      slideContent: active.slideContent.map((a) => {
        const cloned: Atom = JSON.parse(JSON.stringify(a))
        cloned.i = nanoid(8)
        if (cloned.atomContent.atomName === 'text-md') {
          cloned.atomContent.detail.editorId = nanoid(10)
        }
        return cloned
      }),
    }
    const slides = [...deck.slides, copy].sort((a, b) => a.y - b.y)
    slides.forEach((s, idx) => {
      s.y = idx
    })
    set({
      deck: withGetBackground({ ...deck, slides }),
      activeSlideId: i,
      activeAtomId: null,
      editorFocus: null,
    })
  },

  removeSlide: () => {
    const { deck, activeSlideId } = get()
    if (deck.slides.length <= 1) return
    const idx = deck.slides.findIndex((s) => s.i === activeSlideId)
    const slides = deck.slides.filter((s) => s.i !== activeSlideId)
    slides.forEach((s, i) => {
      s.y = i
    })
    const next = slides[Math.max(0, idx - 1)] ?? slides[0]
    set({
      deck: withGetBackground({ ...deck, slides }),
      activeSlideId: next.i,
      activeAtomId: null,
      editorFocus: null,
    })
  },

  addAtom: (atom) => {
    const { deck, activeSlideId } = get()
    set({
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i === activeSlideId
            ? {
                ...sl,
                slideContent: withZIndex([...sl.slideContent, atom]),
              }
            : sl,
        ),
      }),
      activeAtomId: atom.i,
    })
  },

  duplicateActiveAtom: () => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    const slide = deck.slides.find((s) => s.i === activeSlideId)
    const src = slide?.slideContent.find((a) => a.i === activeAtomId)
    if (!src) return
    const copy: Atom = JSON.parse(JSON.stringify(src))
    copy.i = nanoid(8)
    copy.y = src.y + 1
    copy.static = false
    if (copy.atomContent.atomName === 'text-md') {
      copy.atomContent.detail.editorId = nanoid(10)
    }
    set({
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i === activeSlideId
            ? {
                ...sl,
                slideContent: withZIndex([...sl.slideContent, copy]),
              }
            : sl,
        ),
      }),
      activeAtomId: copy.i,
    })
  },

  removeActiveAtom: () => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    set({
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i === activeSlideId
            ? {
                ...sl,
                slideContent: withZIndex(
                  sl.slideContent.filter((a) => a.i !== activeAtomId),
                ),
              }
            : sl,
        ),
      }),
      activeAtomId: null,
      editorFocus: null,
    })
  },

  toggleFixedActiveAtom: () => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    set({
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i !== activeSlideId
            ? sl
            : {
                ...sl,
                slideContent: sl.slideContent.map((a) =>
                  a.i === activeAtomId ? { ...a, static: !a.static } : a,
                ),
              },
        ),
      }),
    })
  },

  reorderActiveAtom: (action) => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    set({
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) => {
          if (sl.i !== activeSlideId) return sl
          const next = applyLayerOrder(sl.slideContent, activeAtomId, action)
          return next ? { ...sl, slideContent: next } : sl
        }),
      }),
    })
  },

  saveActiveAtomToGallery: () => {
    const atom = selectActiveAtom(get())
    if (!atom) return
    const copy: Atom = {
      ...JSON.parse(JSON.stringify(atom)),
      i: String(Date.now()),
      x: 0,
      w: 6,
      h: 5,
      static: false,
    }
    if (copy.atomContent.atomName === 'text-md') {
      copy.atomContent.detail.editorId = nanoid(10)
    }
    const localAtoms = [...get().localAtoms, copy]
    persistLocalAtoms(localAtoms)
    set({ localAtoms, toast: '已保存至我的图表' })
  },

  setBackground: (bg) =>
    set((s) => ({
      deck: withGetBackground({ ...s.deck, background: bg }),
    })),

  replaceDeck: (raw) => {
    const deck = normalizeDeck(raw)
    set({
      deck,
      activeSlideId: deck.slides[0]?.i ?? '0',
      activeAtomId: null,
      editorFocus: null,
    })
  },

  resetSample: () => {
    const deck = createSampleDeck()
    set({
      deck,
      activeSlideId: deck.slides[0]?.i ?? '0',
      activeAtomId: null,
      editorFocus: null,
    })
  },
}))

export function createTextAtom(markdown = '## 新文本'): Atom {
  return {
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 8,
    h: 4,
    static: false,
    super: false,
    atomType: 'text',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: 'text-md',
      detail: { editorId: nanoid(10), markdown },
    },
  }
}

export function createTextShadowAtom(text = '标题'): Atom {
  return {
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 16,
    h: 3,
    static: false,
    super: false,
    atomType: 'text',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: 'text-shadow',
      detail: {
        text,
        color: 'rgb(114, 138, 154)',
        fontFamily: 'Arial',
        fontSize: 40,
        fontWeight: 900,
        shadow: { h: 2, v: 2, blur: 4, color: 'rgba(48, 34, 34, 1)' },
      },
    },
  }
}

export function createChartAtom(
  kind: 'simple-line' | 'simple-bar' | 'simple-pie',
): Atom {
  const sheet =
    kind === 'simple-pie'
      ? [
          ['项', '值'],
          ['A', 40],
          ['B', 30],
          ['C', 30],
        ]
      : [
          ['', '系列1', '系列2'],
          ['1月', 10, 20],
          ['2月', 15, 18],
          ['3月', 22, 25],
        ]
  const { nr, nc } = sheetNrNc(sheet)
  const extra: Record<string, unknown> =
    kind === 'simple-line'
      ? {
          simpleLine: {
            lineStyle: { width: 2, type: 'solid' },
            smooth: false,
            areaStyle: { opacity: 0.2 },
          },
        }
      : kind === 'simple-pie'
        ? {
            simplePie: {
              clockwise: true,
              startAngle: 90,
              center: ['50%', '55%'],
              radius: ['30%', '65%'],
            },
          }
        : {
            simpleBar: {
              barMaxWidth: 40,
              barGap: '30%',
              barCategoryGap: '20%',
              borderRadius: 0,
              showBackground: false,
            },
          }
  return {
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 10,
    h: 8,
    static: false,
    super: false,
    atomType: 'echart',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: kind,
      detail: {
        sheetData: sheet,
        nr,
        nc,
        animation: true,
        title: defaultEchartTitle(kind),
        ...extra,
      },
    },
  }
}

export function createTableAtom(): Atom {
  const sheetData: (string | number)[][] = [
    ['列A', '列B', '列C'],
    ['1', '2', '3'],
    ['4', '5', '6'],
  ]
  const { nr, nc } = sheetNrNc(sheetData)
  return {
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 12,
    h: 8,
    static: false,
    super: false,
    atomType: 'tables',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: 'simple-table',
      detail: {
        sheetData,
        nr,
        nc,
        pagination: { pageSize: 5, show: false },
      },
    },
  }
}

export function createImageAtom(src: string): Atom {
  return {
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 8,
    h: 8,
    static: false,
    super: false,
    atomType: 'images',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: 'single-image',
      detail: { src },
    },
  }
}

export function selectActiveSlide(state: DeckState): Slide | undefined {
  return state.deck.slides.find((s) => s.i === state.activeSlideId)
}

export function selectActiveAtom(state: DeckState): Atom | undefined {
  const slide = selectActiveSlide(state)
  if (!slide || !state.activeAtomId) return undefined
  return slide.slideContent.find((a) => a.i === state.activeAtomId)
}

export type { LayerAction }
