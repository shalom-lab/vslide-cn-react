import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { createSampleDeck } from '../data/sampleDeck'
import type { Atom, BackgroundConfig, DeckFile, Slide } from '../types/deck'
import { defaultAnimation, defaultBorder } from '../types/deck'

interface DeckState {
  deck: DeckFile
  activeSlideId: string
  activeAtomId: string | null
  setActiveSlide: (id: string) => void
  setActiveAtom: (id: string | null) => void
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
  removeActiveAtom: () => void
  setBackground: (bg: BackgroundConfig) => void
  replaceDeck: (deck: DeckFile) => void
  resetSample: () => void
}

function blankSlide(y: number, i: string): Slide {
  return {
    i,
    x: 0,
    y,
    w: 1,
    h: 1,
    slideAnimation: { steps: 1, enter: 'fadeIn', leave: 'fadeOut' },
    slideContent: [],
  }
}

const initial = createSampleDeck()

export const useDeckStore = create<DeckState>((set, get) => ({
  deck: initial,
  activeSlideId: initial.slides[0]?.i ?? '0',
  activeAtomId: null,

  setActiveSlide: (id) => set({ activeSlideId: id, activeAtomId: null }),
  setActiveAtom: (id) => set({ activeAtomId: id }),

  updateSlideLayout: (slideId, atoms) =>
    set((s) => ({
      deck: {
        ...s.deck,
        slides: s.deck.slides.map((sl) =>
          sl.i === slideId ? { ...sl, slideContent: atoms } : sl,
        ),
      },
    })),

  updateAtom: (slideId, atomId, patch) =>
    set((s) => ({
      deck: {
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
      },
    })),

  updateAtomDetail: (slideId, atomId, detail) =>
    set((s) => ({
      deck: {
        ...s.deck,
        slides: s.deck.slides.map((sl) =>
          sl.i !== slideId
            ? sl
            : {
                ...sl,
                slideContent: sl.slideContent.map((a) =>
                  a.i === atomId
                    ? {
                        ...a,
                        atomContent: {
                          ...a.atomContent,
                          detail: { ...a.atomContent.detail, ...detail },
                        },
                      }
                    : a,
                ),
              },
        ),
      },
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
    set({ deck: { ...deck, slides }, activeSlideId: i, activeAtomId: null })
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
      slideContent: active.slideContent.map((a) => ({
        ...JSON.parse(JSON.stringify(a)),
        i: nanoid(8),
      })),
    }
    const slides = [...deck.slides, copy].sort((a, b) => a.y - b.y)
    slides.forEach((s, idx) => {
      s.y = idx
    })
    set({ deck: { ...deck, slides }, activeSlideId: i, activeAtomId: null })
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
      deck: { ...deck, slides },
      activeSlideId: next.i,
      activeAtomId: null,
    })
  },

  addAtom: (atom) => {
    const { deck, activeSlideId } = get()
    set({
      deck: {
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i === activeSlideId
            ? { ...sl, slideContent: [...sl.slideContent, atom] }
            : sl,
        ),
      },
      activeAtomId: atom.i,
    })
  },

  removeActiveAtom: () => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    set({
      deck: {
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i === activeSlideId
            ? {
                ...sl,
                slideContent: sl.slideContent.filter(
                  (a) => a.i !== activeAtomId,
                ),
              }
            : sl,
        ),
      },
      activeAtomId: null,
    })
  },

  setBackground: (bg) =>
    set((s) => ({ deck: { ...s.deck, background: bg } })),

  replaceDeck: (deck) =>
    set({
      deck,
      activeSlideId: deck.slides[0]?.i ?? '0',
      activeAtomId: null,
    }),

  resetSample: () => {
    const deck = createSampleDeck()
    set({
      deck,
      activeSlideId: deck.slides[0]?.i ?? '0',
      activeAtomId: null,
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
    atomType: 'text',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: { atomName: 'text-md', detail: { markdown } },
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
  return {
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 10,
    h: 8,
    static: false,
    atomType: 'echart',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: kind,
      detail: { sheetData: sheet, title: kind },
    },
  }
}

export function createTableAtom(): Atom {
  return {
    i: nanoid(8),
    x: 1,
    y: 1,
    w: 12,
    h: 8,
    static: false,
    atomType: 'tables',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: 'simple-table',
      detail: {
        sheetData: [
          ['列A', '列B', '列C'],
          ['1', '2', '3'],
          ['4', '5', '6'],
        ],
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
    atomType: 'images',
    atomBorder: defaultBorder(),
    atomAnimation: defaultAnimation(),
    atomContent: {
      atomName: 'single-image',
      detail: { src, fit: 'contain' },
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
