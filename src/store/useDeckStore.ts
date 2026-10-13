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
import type { GridLayoutRect } from '../utils/grid'
import { setByPath } from '../utils/pathSet'

import { createTableAtom } from '../atoms/registry'
import { SLIDE_TEMPLATES } from '../data/slideTemplates'

export {
  createTextAtom,
  createTextShadowAtom,
  createCustomHtmlAtom,
  createChartAtom,
  createTableAtom,
  createImageAtom,
  type ChartKind,
} from '../atoms/registry'

const LOCAL_ATOMS_KEY = 'vslide-cn-react:localAtoms'
const HISTORY_LIMIT = 50

export type PlaceMode = 'chart' | 'text' | 'html' | 'table' | 'image' | 'icon' | null

interface DeckState {
  deck: DeckFile
  activeSlideId: string
  activeAtomId: string | null
  editorFocus: EditorFocus
  localAtoms: Atom[]
  toast: string | null
  past: DeckFile[]
  future: DeckFile[]
  /** Google Slides–like place-first insert (charts, text/html, table, image). */
  placeMode: PlaceMode
  pendingLayout: GridLayoutRect | null
  chartDrawerOpen: boolean
  textDrawerOpen: boolean
  setActiveSlide: (id: string) => void
  setActiveAtom: (id: string | null) => void
  setEditorFocus: (focus: EditorFocus) => void
  clearToast: () => void
  startChartPlace: () => void
  startTextPlace: () => void
  startHtmlPlace: () => void
  startTablePlace: () => void
  startImagePlace: () => void
  startIconPlace: () => void
  finishPlaceRect: (layout: GridLayoutRect) => void
  /** Insert a slide layout template after the active slide */
  insertTemplateSlide: (templateId: string) => void
  iconDrawerOpen: boolean
  setIconDrawerOpen: (open: boolean) => void
  cancelPlaceMode: () => void
  setChartDrawerOpen: (open: boolean) => void
  setTextDrawerOpen: (open: boolean) => void
  updateSlideLayout: (slideId: string, atoms: Atom[]) => void
  updateAtom: (slideId: string, atomId: string, patch: Partial<Atom>) => void
  updateAtomDetail: (
    slideId: string,
    atomId: string,
    detail: Record<string, unknown>,
  ) => void
  /** Vue-style path patch: e.g. atomContent.detail.title.text / atomBorder.width */
  patchAtomPath: (slideId: string, atomId: string, path: string, value: unknown) => void
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
  updateSlideAnimation: (
    slideId: string,
    patch: Partial<import('../types/deck').SlideAnimation>,
  ) => void
  replaceDeck: (deck: DeckFile | unknown) => void
  resetSample: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
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

function cloneDeck(deck: DeckFile): DeckFile {
  return JSON.parse(JSON.stringify(deck)) as DeckFile
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

/** Push current deck onto past before a mutating set. */
function pushHistory(
  s: Pick<DeckState, 'deck' | 'past'>,
): { past: DeckFile[]; future: DeckFile[] } {
  const past = [...s.past, cloneDeck(s.deck)].slice(-HISTORY_LIMIT)
  return { past, future: [] }
}

let detailTimer: ReturnType<typeof setTimeout> | null = null
let detailSnapshot: DeckFile | null = null

const initial = createSampleDeck()

export const useDeckStore = create<DeckState>((set, get) => ({
  deck: initial,
  activeSlideId: initial.slides[0]?.i ?? '0',
  activeAtomId: null,
  editorFocus: null,
  localAtoms: typeof localStorage !== 'undefined' ? loadLocalAtoms() : [],
  toast: null,
  past: [],
  future: [],
  placeMode: null,
  pendingLayout: null,
  chartDrawerOpen: false,
  textDrawerOpen: false,
  iconDrawerOpen: false,

  startChartPlace: () =>
    set({
      placeMode: 'chart',
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startTextPlace: () =>
    set({
      placeMode: 'text',
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startHtmlPlace: () =>
    set({
      placeMode: 'html',
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startTablePlace: () =>
    set({
      placeMode: 'table',
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startImagePlace: () =>
    set({
      placeMode: 'image',
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startIconPlace: () =>
    set({
      placeMode: 'icon',
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  finishPlaceRect: (layout) => {
    const mode = get().placeMode
    if (mode === 'text' || mode === 'html') {
      set({
        pendingLayout: layout,
        textDrawerOpen: true,
        chartDrawerOpen: false,
        // stay in placeMode so Esc still cancels until insert
      })
      return
    }
    if (mode === 'table') {
      // Single table type — insert into the dragged rect (place-first confirm)
      get().addAtom(createTableAtom(layout))
      return
    }
    if (mode === 'image') {
      // Keep placeMode + pendingLayout; TopBar opens the file picker next
      set({
        pendingLayout: layout,
        chartDrawerOpen: false,
        textDrawerOpen: false,
        iconDrawerOpen: false,
      })
      return
    }
    if (mode === 'icon') {
      set({
        pendingLayout: layout,
        chartDrawerOpen: false,
        textDrawerOpen: false,
        iconDrawerOpen: true,
      })
      return
    }
    // chart (default)
    set({
      pendingLayout: layout,
      chartDrawerOpen: true,
      textDrawerOpen: false,
    })
  },

  cancelPlaceMode: () =>
    set({
      placeMode: null,
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
    }),

  setChartDrawerOpen: (open) =>
    set(
      open
        ? { chartDrawerOpen: true, textDrawerOpen: false, iconDrawerOpen: false }
        : {
            chartDrawerOpen: false,
            placeMode: null,
            pendingLayout: null,
            textDrawerOpen: false,
            iconDrawerOpen: false,
          },
    ),

  setTextDrawerOpen: (open) =>
    set(
      open
        ? { textDrawerOpen: true, chartDrawerOpen: false, iconDrawerOpen: false }
        : {
            textDrawerOpen: false,
            placeMode: null,
            pendingLayout: null,
          },
    ),

  setIconDrawerOpen: (open) =>
    set(
      open
        ? { iconDrawerOpen: true, chartDrawerOpen: false, textDrawerOpen: false }
        : {
            iconDrawerOpen: false,
            placeMode: null,
            pendingLayout: null,
          },
    ),

  setActiveSlide: (id) =>
    set({ activeSlideId: id, activeAtomId: null, editorFocus: null }),
  setActiveAtom: (id) => set({ activeAtomId: id }),
  setEditorFocus: (focus) => set({ editorFocus: focus }),
  clearToast: () => set({ toast: null }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  undo: () => {
    const { past, deck, future, activeSlideId } = get()
    if (!past.length) return
    const prev = past[past.length - 1]
    const stillExists = prev.slides.some((s) => s.i === activeSlideId)
    set({
      deck: prev,
      past: past.slice(0, -1),
      future: [cloneDeck(deck), ...future].slice(0, HISTORY_LIMIT),
      activeSlideId: stillExists ? activeSlideId : (prev.slides[0]?.i ?? '0'),
      activeAtomId: null,
      editorFocus: null,
    })
  },

  redo: () => {
    const { past, deck, future, activeSlideId } = get()
    if (!future.length) return
    const next = future[0]
    const stillExists = next.slides.some((s) => s.i === activeSlideId)
    set({
      deck: next,
      past: [...past, cloneDeck(deck)].slice(-HISTORY_LIMIT),
      future: future.slice(1),
      activeSlideId: stillExists ? activeSlideId : (next.slides[0]?.i ?? '0'),
      activeAtomId: null,
      editorFocus: null,
    })
  },

  updateSlideLayout: (slideId, atoms) =>
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({
        ...s.deck,
        slides: s.deck.slides.map((sl) =>
          sl.i === slideId ? { ...sl, slideContent: atoms } : sl,
        ),
      }),
    })),

  updateAtom: (slideId, atomId, patch) =>
    set((s) => ({
      ...pushHistory(s),
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

  updateAtomDetail: (slideId, atomId, detail) => {
    // Debounce history for rapid typing in property panel
    if (!detailSnapshot) {
      detailSnapshot = cloneDeck(get().deck)
    }
    if (detailTimer) clearTimeout(detailTimer)
    detailTimer = setTimeout(() => {
      const snap = detailSnapshot
      detailSnapshot = null
      detailTimer = null
      if (!snap) return
      set((s) => ({
        past: [...s.past, snap].slice(-HISTORY_LIMIT),
        future: [],
      }))
    }, 400)

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
    }))
  },

  patchAtomPath: (slideId, atomId, path, value) => {
    if (!detailSnapshot) {
      detailSnapshot = cloneDeck(get().deck)
    }
    if (detailTimer) clearTimeout(detailTimer)
    detailTimer = setTimeout(() => {
      const snap = detailSnapshot
      detailSnapshot = null
      detailTimer = null
      if (!snap) return
      set((s) => ({
        past: [...s.past, snap].slice(-HISTORY_LIMIT),
        future: [],
      }))
    }, 400)

    set((s) => {
      const deck = s.deck
      return {
        deck: withGetBackground({
          ...deck,
          slides: deck.slides.map((sl) => {
            if (sl.i !== slideId) return sl
            return {
              ...sl,
              slideContent: sl.slideContent.map((a) => {
                if (a.i !== atomId) return a
                let next = setByPath(a, path, value)
                // Keep nr/nc in sync when sheetData is patched via path
                if (
                  path.includes('sheetData') &&
                  (next.atomType === 'echart' || next.atomType === 'tables')
                ) {
                  const sheet = next.atomContent.detail.sheetData
                  if (Array.isArray(sheet)) {
                    const dims = sheetNrNc(sheet as (string | number)[][])
                    next = {
                      ...next,
                      atomContent: {
                        ...next.atomContent,
                        detail: {
                          ...next.atomContent.detail,
                          nr: dims.nr,
                          nc: dims.nc,
                        },
                      },
                    }
                  }
                }
                return next
              }),
            }
          }),
        }),
      }
    })
  },

  insertTemplateSlide: (templateId) => {
    const tpl = SLIDE_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    const { deck, activeSlideId } = get()
    const slide = tpl.build()
    const idx = deck.slides.findIndex((s) => s.i === activeSlideId)
    const insertAt = idx >= 0 ? idx + 1 : deck.slides.length
    const slides = [
      ...deck.slides.slice(0, insertAt),
      slide,
      ...deck.slides.slice(insertAt),
    ]
    slides.forEach((s, i) => {
      s.y = i
    })
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({ ...deck, slides }),
      activeSlideId: slide.i,
      activeAtomId: null,
      editorFocus: null,
    }))
  },

  addSlide: () => {
    const { deck, activeSlideId } = get()
    const active = deck.slides.find((s) => s.i === activeSlideId)
    const y = (active?.y ?? deck.slides.length - 1) + 0.5
    const i = nanoid(8)
    const slides = [...deck.slides, blankSlide(y, i)].sort((a, b) => a.y - b.y)
    slides.forEach((s, idx) => {
      s.y = idx
    })
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({ ...deck, slides }),
      activeSlideId: i,
      activeAtomId: null,
      editorFocus: null,
    }))
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
        if (
          cloned.atomContent.atomName === 'text-md' ||
          cloned.atomContent.atomName === 'custom-html'
        ) {
          cloned.atomContent.detail.editorId = nanoid(10)
        }
        return cloned
      }),
    }
    const slides = [...deck.slides, copy].sort((a, b) => a.y - b.y)
    slides.forEach((s, idx) => {
      s.y = idx
    })
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({ ...deck, slides }),
      activeSlideId: i,
      activeAtomId: null,
      editorFocus: null,
    }))
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
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({ ...deck, slides }),
      activeSlideId: next.i,
      activeAtomId: null,
      editorFocus: null,
    }))
  },

  addAtom: (atom) => {
    const { deck, activeSlideId } = get()
    set((s) => ({
      ...pushHistory(s),
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
      placeMode: null,
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
    }))
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
    if (
      copy.atomContent.atomName === 'text-md' ||
      copy.atomContent.atomName === 'custom-html'
    ) {
      copy.atomContent.detail.editorId = nanoid(10)
    }
    set((s) => ({
      ...pushHistory(s),
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
    }))
  },

  removeActiveAtom: () => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    set((s) => ({
      ...pushHistory(s),
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
    }))
  },

  toggleFixedActiveAtom: () => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    set((s) => ({
      ...pushHistory(s),
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
    }))
  },

  reorderActiveAtom: (action) => {
    const { deck, activeSlideId, activeAtomId } = get()
    if (!activeAtomId) return
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) => {
          if (sl.i !== activeSlideId) return sl
          const next = applyLayerOrder(sl.slideContent, activeAtomId, action)
          return next ? { ...sl, slideContent: next } : sl
        }),
      }),
    }))
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
    if (
      copy.atomContent.atomName === 'text-md' ||
      copy.atomContent.atomName === 'custom-html'
    ) {
      copy.atomContent.detail.editorId = nanoid(10)
    }
    const localAtoms = [...get().localAtoms, copy]
    persistLocalAtoms(localAtoms)
    set({ localAtoms, toast: '已保存至我的图表' })
  },

  setBackground: (bg) =>
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({ ...s.deck, background: bg }),
    })),

  updateSlideAnimation: (slideId, patch) => {
    const { deck } = get()
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i === slideId
            ? {
                ...sl,
                slideAnimation: { ...sl.slideAnimation, ...patch },
              }
            : sl,
        ),
      }),
    }))
  },

  replaceDeck: (raw) => {
    const deck = normalizeDeck(raw)
    set((s) => ({
      ...pushHistory(s),
      deck,
      activeSlideId: deck.slides[0]?.i ?? '0',
      activeAtomId: null,
      editorFocus: null,
    }))
  },

  resetSample: () => {
    const deck = createSampleDeck()
    set((s) => ({
      ...pushHistory(s),
      deck,
      activeSlideId: deck.slides[0]?.i ?? '0',
      activeAtomId: null,
      editorFocus: null,
    }))
  },
}))

export function selectActiveSlide(state: DeckState): Slide | undefined {
  return state.deck.slides.find((s) => s.i === state.activeSlideId)
}

export function selectActiveAtom(state: DeckState): Atom | undefined {
  const slide = selectActiveSlide(state)
  if (!slide || !state.activeAtomId) return undefined
  return slide.slideContent.find((a) => a.i === state.activeAtomId)
}

export type { LayerAction }
