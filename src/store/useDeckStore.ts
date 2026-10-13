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
import { normalizeDeck, serializeDeck } from '../utils/serialize'
import {
  applyLayerOrder,
  withZIndex,
  type LayerAction,
} from '../utils/layerOrder'
import { GRID_COLS, type GridLayoutRect } from '../utils/grid'
import { setByPath } from '../utils/pathSet'

import {
  ATOM_REGISTRY,
  createCustomHtmlAtom,
  createImageAtom,
  createImageGroupAtom,
  createTableAtom,
  createTextAtom,
  createTextShadowAtom,
  tileLayoutsInRect,
} from '../atoms/registry'
import { SLIDE_TEMPLATES } from '../data/slideTemplates'
import {
  loadLocalGallery,
  makeGalleryItem,
  persistLocalGallery,
  type LocalGalleryItem,
} from '../gallery/localGallery'

export {
  createTextAtom,
  createTextShadowAtom,
  createCustomHtmlAtom,
  createChartAtom,
  createTableAtom,
  createImageAtom,
  createImageGroupAtom,
  tileLayoutsInRect,
  type ChartKind,
} from '../atoms/registry'

const DECK_KEY = 'vslide-cn-react:deck'
const CLIPBOARD_KEY = 'vslide-cn-react:atomClipboard'
const HISTORY_LIMIT = 50

export type PlaceMode = 'chart' | 'text' | 'html' | 'table' | 'image' | 'icon' | null

/** Chosen atom ready to drop on the canvas (type-first insert). */
export type PendingInsert =
  | { kind: 'chart'; atomName: string }
  | { kind: 'saved'; atom: Atom }
  | { kind: 'text'; atomName: 'text-md' | 'text-shadow' | 'custom-html' }
  | { kind: 'table' }
  | { kind: 'image'; srcs: string[] }
  | { kind: 'icon'; src: string }

interface DeckState {
  deck: DeckFile
  activeSlideId: string
  activeAtomId: string | null
  editorFocus: EditorFocus
  localGallery: LocalGalleryItem[]
  toast: string | null
  past: DeckFile[]
  future: DeckFile[]
  /**
   * Type-first insert: pick type (toolbar/drawer) → drag area to place.
   * placeMode is armed only after pendingInsert is set.
   */
  placeMode: PlaceMode
  pendingInsert: PendingInsert | null
  pendingLayout: GridLayoutRect | null
  chartDrawerOpen: boolean
  textDrawerOpen: boolean
  setActiveSlide: (id: string) => void
  setActiveAtom: (id: string | null) => void
  setEditorFocus: (focus: EditorFocus) => void
  clearToast: () => void
  /** Open chart drawer to pick a chart type. */
  startChartPlace: () => void
  /** Open text drawer to pick 正文/标题/HTML. */
  startTextPlace: () => void
  /** Open text drawer (HTML-focused entry). */
  startHtmlPlace: () => void
  /** Arm table and enter canvas place mode. */
  startTablePlace: () => void
  /** Prepare image tool (TopBar opens file picker, then arms). */
  startImagePlace: () => void
  /** Open icon drawer to pick an icon. */
  startIconPlace: () => void
  /** After drawer/file pick — arm type and wait for canvas drag. */
  armPendingInsert: (pending: PendingInsert) => void
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
  /** Persist left-list drag order (Vue grid-layout y). */
  reorderSlides: (order: { i: string; y: number }[]) => void
  addAtom: (atom: Atom) => void
  /** Insert several atoms in one undo step (multi-image). */
  addAtoms: (atoms: Atom[]) => void
  duplicateActiveAtom: () => void
  removeActiveAtom: () => void
  toggleFixedActiveAtom: () => void
  /** 置顶 / 置底 / 上移一层 / 下移一层 */
  reorderActiveAtom: (action: LayerAction) => void
  saveActiveAtomToGallery: () => void
  /** Remove one item from 「我的图表」. */
  removeLocalGalleryItem: (id: string) => void
  /** Rename a 「我的图表」 entry. */
  renameLocalGalleryItem: (id: string, name: string) => void
  setBackground: (bg: BackgroundConfig) => void
  updateSlideAnimation: (
    slideId: string,
    patch: Partial<import('../types/deck').SlideAnimation>,
  ) => void
  replaceDeck: (deck: DeckFile | unknown) => void
  resetSample: () => void
  /** Persist current deck to localStorage (Vue 「保存」). */
  saveDeck: () => void
  showToast: (msg: string) => void
  /** Copy active atom into clipboard (Ctrl+C). */
  copyActiveAtom: () => void
  /** Paste clipboard atom onto active slide (Ctrl+V). */
  pasteAtom: () => void
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


function loadPersistedDeck(): DeckFile | null {
  try {
    const raw = localStorage.getItem(DECK_KEY)
    if (!raw) return null
    return normalizeDeck(JSON.parse(raw))
  } catch {
    return null
  }
}

function persistDeck(deck: DeckFile) {
  try {
    localStorage.setItem(DECK_KEY, JSON.stringify(serializeDeck(deck)))
  } catch {
    /* quota */
  }
}

function loadClipboardAtom(): Atom | null {
  try {
    const raw = localStorage.getItem(CLIPBOARD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Atom) : null
  } catch {
    return null
  }
}

function persistClipboardAtom(atom: Atom) {
  try {
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(atom))
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

const bootDeck =
  typeof localStorage !== 'undefined'
    ? loadPersistedDeck() ?? createSampleDeck()
    : createSampleDeck()

export const useDeckStore = create<DeckState>((set, get) => ({
  deck: bootDeck,
  activeSlideId: bootDeck.slides[0]?.i ?? '0',
  activeAtomId: null,
  editorFocus: null,
  localGallery: typeof localStorage !== 'undefined' ? loadLocalGallery() : [],
  toast: null,
  past: [],
  future: [],
  placeMode: null,
  pendingInsert: null,
  pendingLayout: null,
  chartDrawerOpen: false,
  textDrawerOpen: false,
  iconDrawerOpen: false,

  startChartPlace: () =>
    set({
      placeMode: null,
      pendingInsert: null,
      pendingLayout: null,
      chartDrawerOpen: true,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startTextPlace: () =>
    set({
      placeMode: null,
      pendingInsert: null,
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: true,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startHtmlPlace: () =>
    set({
      placeMode: null,
      pendingInsert: null,
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: true,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startTablePlace: () =>
    set({
      placeMode: 'table',
      pendingInsert: { kind: 'table' },
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startImagePlace: () =>
    set({
      placeMode: null,
      pendingInsert: null,
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    }),

  startIconPlace: () =>
    set({
      placeMode: null,
      pendingInsert: null,
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: true,
      activeAtomId: null,
      editorFocus: null,
    }),

  armPendingInsert: (pending) => {
    const placeMode: PlaceMode =
      pending.kind === 'chart' || pending.kind === 'saved'
        ? 'chart'
        : pending.kind === 'text'
          ? pending.atomName === 'custom-html'
            ? 'html'
            : 'text'
          : pending.kind === 'table'
            ? 'table'
            : pending.kind === 'image'
              ? 'image'
              : 'icon'
    set({
      pendingInsert: pending,
      placeMode,
      pendingLayout: null,
      chartDrawerOpen: false,
      textDrawerOpen: false,
      iconDrawerOpen: false,
      activeAtomId: null,
      editorFocus: null,
    })
  },

  finishPlaceRect: (layout) => {
    const pending = get().pendingInsert
    if (!pending) {
      set({ pendingLayout: null })
      return
    }
    if (pending.kind === 'chart') {
      const entry = ATOM_REGISTRY[pending.atomName]
      if (entry) get().addAtom(entry.create(layout))
      else get().cancelPlaceMode()
      return
    }
    if (pending.kind === 'saved') {
      const copy: Atom = {
        ...JSON.parse(JSON.stringify(pending.atom)),
        i: nanoid(8),
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        static: false,
      }
      if (
        copy.atomContent.atomName === 'text-md' ||
        copy.atomContent.atomName === 'custom-html'
      ) {
        copy.atomContent.detail.editorId = nanoid(10)
      }
      get().addAtom(copy)
      return
    }
    if (pending.kind === 'text') {
      if (pending.atomName === 'text-shadow') {
        get().addAtom(createTextShadowAtom(undefined, layout))
      } else if (pending.atomName === 'custom-html') {
        get().addAtom(createCustomHtmlAtom(undefined, layout))
      } else {
        get().addAtom(createTextAtom(undefined, layout))
      }
      return
    }
    if (pending.kind === 'table') {
      get().addAtom(createTableAtom(layout))
      return
    }
    if (pending.kind === 'icon') {
      get().addAtom(createImageAtom(pending.src, layout))
      return
    }
    if (pending.kind === 'image') {
      const srcs = pending.srcs
      if (srcs.length === 0) {
        get().cancelPlaceMode()
        return
      }
      if (srcs.length === 1) {
        get().addAtom(createImageAtom(srcs[0], layout))
        return
      }
      if (layout.w >= 4 && layout.h >= 4 && srcs.length <= 12) {
        const cells = tileLayoutsInRect(
          { x: layout.x, y: layout.y, w: layout.w, h: layout.h },
          srcs.length,
        )
        get().addAtoms(srcs.map((src, i) => createImageAtom(src, cells[i])))
        return
      }
      get().addAtom(createImageGroupAtom(srcs, layout))
    }
  },

  cancelPlaceMode: () =>
    set({
      placeMode: null,
      pendingInsert: null,
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
            pendingInsert: null,
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
            pendingInsert: null,
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
            pendingInsert: null,
            pendingLayout: null,
          },
    ),

  setActiveSlide: (id) =>
    set({ activeSlideId: id, activeAtomId: null, editorFocus: null }),
  setActiveAtom: (id) => set({ activeAtomId: id }),
  setEditorFocus: (focus) => set({ editorFocus: focus }),
  clearToast: () => set({ toast: null }),
  showToast: (msg) => set({ toast: msg }),

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

  reorderSlides: (order) => {
    const { deck } = get()
    if (!order.length) return
    const yById = new Map(order.map((o) => [o.i, o.y]))
    const before = [...deck.slides]
      .sort((a, b) => a.y - b.y)
      .map((s) => s.i)
      .join(',')
    const slides = deck.slides
      .map((s) => ({
        ...s,
        y: yById.has(s.i) ? (yById.get(s.i) as number) : s.y,
      }))
      .sort((a, b) => a.y - b.y)
    slides.forEach((s, idx) => {
      s.y = idx
    })
    const after = slides.map((s) => s.i).join(',')
    if (before === after) return
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({ ...deck, slides }),
    }))
  },


  addAtom: (atom) => {
    get().addAtoms([atom])
  },

  addAtoms: (atoms) => {
    if (!atoms.length) return
    const { deck, activeSlideId } = get()
    set((s) => ({
      ...pushHistory(s),
      deck: withGetBackground({
        ...deck,
        slides: deck.slides.map((sl) =>
          sl.i === activeSlideId
            ? {
                ...sl,
                slideContent: withZIndex([...sl.slideContent, ...atoms]),
              }
            : sl,
        ),
      }),
      activeAtomId: atoms[atoms.length - 1]?.i ?? null,
      placeMode: null,
      pendingInsert: null,
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
    const item = makeGalleryItem(atom)
    if (
      item.atom.atomContent.atomName === 'text-md' ||
      item.atom.atomContent.atomName === 'custom-html'
    ) {
      item.atom.atomContent.detail.editorId = nanoid(10)
    }
    const localGallery = [...get().localGallery, item]
    persistLocalGallery(localGallery)
    set({ localGallery, toast: '已保存至我的图表' })
  },

  removeLocalGalleryItem: (id) => {
    const localGallery = get().localGallery.filter((g) => g.id !== id)
    persistLocalGallery(localGallery)
    set({ localGallery, toast: '已从我的图表删除' })
  },

  renameLocalGalleryItem: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const localGallery = get().localGallery.map((g) =>
      g.id === id ? { ...g, name: trimmed } : g,
    )
    persistLocalGallery(localGallery)
    set({ localGallery, toast: '已重命名' })
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

  saveDeck: () => {
    const deck = get().deck
    persistDeck(deck)
    set({ toast: '已保存到本机' })
  },

  copyActiveAtom: () => {
    const atom = selectActiveAtom(get())
    if (!atom || atom.super) return
    persistClipboardAtom(JSON.parse(JSON.stringify(atom)) as Atom)
    set({ toast: '已复制组件' })
  },

  pasteAtom: () => {
    const clip = loadClipboardAtom()
    if (!clip) {
      set({ toast: '剪贴板为空' })
      return
    }
    const copy: Atom = {
      ...JSON.parse(JSON.stringify(clip)),
      i: nanoid(8),
      x: Math.min(GRID_COLS - (clip.w || 6), (clip.x || 0) + 2),
      y: (clip.y || 0) + 2,
      static: false,
      super: false,
    }
    if (
      copy.atomContent.atomName === 'text-md' ||
      copy.atomContent.atomName === 'custom-html'
    ) {
      copy.atomContent.detail.editorId = nanoid(10)
    }
    get().addAtom(copy)
    set({ toast: '已粘贴组件' })
  },

  replaceDeck: (raw) => {
    const deck = normalizeDeck(raw)
    set((s) => ({
      ...pushHistory(s),
      deck,
      activeSlideId: deck.slides[0]?.i ?? '0',
      activeAtomId: null,
      editorFocus: null,
      toast: '已打开文稿',
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
      toast: '已恢复示例文稿',
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
export type { LocalGalleryItem }
