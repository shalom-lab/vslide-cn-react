/**
 * Import / export adapters for vslide-vue DeckFile JSON.
 * Prefer old field names on write; tolerate typos / missing fields on read.
 */
import { nanoid } from 'nanoid'
import {
  defaultAnimation,
  defaultBackground,
  defaultBorder,
  defaultEchartTitle,
  defaultGradientStops,
  defaultSlideAnimation,
  emptyBackgroundImage,
  emptyBackgroundTexture,
  sheetNrNc,
  type Atom,
  type BackgroundConfig,
  type GradientStop,
  type DeckFile,
  type Slide,
} from '../types/deck'
import { cssBackground, syncLinearEnds, syncRadialEnds } from './background'
import {
  GRID_COLS,
  deckLooksLikeLegacyCols,
  scaleLegacyRect,
} from './grid'
import { withZIndex } from './layerOrder'

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

function normalizeStops(
  raw: unknown,
  start: string,
  end: string,
): GradientStop[] {
  if (Array.isArray(raw) && raw.length >= 2) {
    return raw.map((s, i) => {
      const r = asRecord(s)
      return {
        color: String(r.color || (i === 0 ? start : end)),
        position: Number.isFinite(Number(r.position))
          ? Number(r.position)
          : i === 0
            ? 0
            : 100,
      }
    })
  }
  return defaultGradientStops(start, end)
}

function normalizeBackground(raw: unknown): BackgroundConfig {
  const b = asRecord(raw)
  const base = defaultBackground()
  const image = { ...emptyBackgroundImage(), ...asRecord(b.image) }
  const texture = { ...emptyBackgroundTexture(), ...asRecord(b.texture) }
  const linearRaw = { ...base.linear, ...asRecord(b.linear) }
  const radialRaw = { ...base.radial, ...asRecord(b.radial) }
  const mode = (b.mode as BackgroundConfig['mode']) || 'pure'
  const startL = String(linearRaw.start ?? base.linear.start)
  const endL = String(linearRaw.end ?? base.linear.end)
  const startR = String(radialRaw.start ?? base.radial.start)
  const endR = String(radialRaw.end ?? base.radial.end)
  const linear = syncLinearEnds({
    angle: Number(linearRaw.angle) || 23,
    start: startL,
    end: endL,
    stops: normalizeStops(linearRaw.stops, startL, endL),
  })
  const shapeKind =
    radialRaw.shapeKind === 'circle' || radialRaw.shapeKind === 'ellipse'
      ? radialRaw.shapeKind
      : String(radialRaw.shape || '').includes('circle')
        ? ('circle' as const)
        : ('ellipse' as const)
  let positionX = typeof radialRaw.positionX === 'string' ? radialRaw.positionX : ''
  let positionY = typeof radialRaw.positionY === 'string' ? radialRaw.positionY : ''
  if (!positionX || !positionY) {
    const m = String(radialRaw.shape || '').match(
      /at\s+([\d.]+%|left|center|right)\s+([\d.]+%|top|center|bottom)/i,
    )
    if (m) {
      positionX = positionX || m[1]
      positionY = positionY || m[2]
    } else {
      positionX = positionX || 'center'
      positionY = positionY || 'center'
    }
  }
  const radial = syncRadialEnds({
    shape: String(radialRaw.shape || 'ellipse at center'),
    shapeKind,
    positionX,
    positionY,
    start: startR,
    end: endR,
    stops: normalizeStops(radialRaw.stops, startR, endR),
  })
  const sizeMode =
    image.sizeMode === 'cover' ||
    image.sizeMode === 'contain' ||
    image.sizeMode === 'custom'
      ? image.sizeMode
      : image.width === 'cover' || image.height === 'cover'
        ? 'cover'
        : image.width === 'contain' || image.height === 'contain'
          ? 'contain'
          : 'custom'
  return {
    mode,
    pure: typeof b.pure === 'string' ? b.pure : base.pure,
    pureOpacity:
      typeof b.pureOpacity === 'number' && Number.isFinite(b.pureOpacity)
        ? Math.max(0, Math.min(100, b.pureOpacity))
        : 100,
    linear,
    radial,
    custom: typeof b.custom === 'string' ? b.custom : base.custom,
    image: {
      src: String(image.src ?? ''),
      repeat: String(image.repeat ?? 'no-repeat'),
      x: String(image.x ?? 'center'),
      y: String(image.y ?? 'center'),
      width: String(image.width ?? '100%'),
      height: String(image.height ?? '100%'),
      sizeMode,
      opacity:
        typeof image.opacity === 'number' && Number.isFinite(image.opacity)
          ? Math.max(0, Math.min(100, image.opacity))
          : 100,
    },
    texture: {
      src: String(texture.src ?? ''),
      repeat: String(texture.repeat ?? 'repeat'),
    },
  }
}

function normalizeAtom(raw: unknown, index: number): Atom {
  const a = asRecord(raw)
  // Factories typo "stacic"; saved JSON uses "static"
  const locked =
    typeof a.static === 'boolean'
      ? a.static
      : typeof a.stacic === 'boolean'
        ? Boolean(a.stacic)
        : false
  const content = asRecord(a.atomContent)
  const detail = { ...asRecord(content.detail) }
  const atomName = String(content.atomName || 'text-md')
  let atomType = (a.atomType as Atom['atomType']) || 'text'

  // text-md: ensure editorId
  if (atomName === 'text-md') {
    if (!detail.editorId && detail.editorid) {
      detail.editorId = detail.editorid
    }
    if (!detail.editorId) detail.editorId = nanoid(10)
    if (typeof detail.markdown !== 'string') detail.markdown = ''
  }

  // custom-html: ensure editorId + html string
  if (atomName === 'custom-html') {
    if (!detail.editorId) detail.editorId = nanoid(10)
    if (typeof detail.html !== 'string') detail.html = ''
    atomType = 'html'
  }

  // React invented text-title → map to text-shadow
  if (atomName === 'text-title') {
    content.atomName = 'text-shadow'
    if (!detail.shadow) {
      detail.shadow = { h: 2, v: 2, blur: 4, color: 'rgba(48, 34, 34, 1)' }
    }
    if (!detail.fontFamily) detail.fontFamily = 'Arial'
    if (detail.fontWeight == null) detail.fontWeight = 900
    if (detail.fontSize == null) detail.fontSize = 48
    if (!detail.color) detail.color = '#1a365d'
    if (!detail.text) detail.text = ''
    delete detail.align
  }

  // echart / tables: nr, nc, title object
  if (atomType === 'echart' || atomType === 'tables') {
    const sheet = Array.isArray(detail.sheetData)
      ? (detail.sheetData as (string | number)[][])
      : []
    detail.sheetData = sheet
    const dims = sheetNrNc(sheet)
    if (typeof detail.nr !== 'number') detail.nr = dims.nr
    if (typeof detail.nc !== 'number') detail.nc = dims.nc
  }
  if (atomType === 'echart') {
    if (typeof detail.title === 'string') {
      detail.title = defaultEchartTitle(detail.title)
    } else if (!detail.title || typeof detail.title !== 'object') {
      detail.title = defaultEchartTitle('')
    }
  }
  if (atomType === 'tables') {
    if (!detail.pagination || typeof detail.pagination !== 'object') {
      detail.pagination = { pageSize: 5, show: false }
    }
  }
  if (atomType === 'images' && atomName === 'single-image') {
    delete detail.fit // React-only; Vue has src only
    if (typeof detail.src !== 'string') detail.src = ''
  }
  if (atomType === 'images' && atomName === 'image-group') {
    if (!Array.isArray(detail.src)) {
      detail.src = typeof detail.src === 'string' && detail.src ? [detail.src] : []
    } else {
      detail.src = detail.src.map((s: unknown) => String(s || '')).filter(Boolean)
    }
    if (typeof detail.height !== 'number') detail.height = 100
    if (typeof detail.gap !== 'number') detail.gap = 5
  }

  const border = { ...defaultBorder(), ...asRecord(a.atomBorder) }
  const anim = { ...defaultAnimation(), ...asRecord(a.atomAnimation) }

  return {
    i: String(a.i ?? index),
    x: Number(a.x) || 0,
    y: Number(a.y) || 0,
    w: Number(a.w) || 1,
    h: Number(a.h) || 1,
    static: locked,
    super: Boolean(a.super),
    atomType,
    atomBorder: {
      width: Number(border.width) || 0,
      type: String(border.type || 'solid'),
      color: String(border.color || '#808080'),
      radius: Number(border.radius) || 0,
    },
    atomAnimation: {
      order: Number(anim.order) || 1,
      enter: String(anim.enter || 'fadeIn'),
      leave: String(anim.leave || 'fadeOut'),
    },
    atomContent: {
      atomName: String(content.atomName || atomName),
      detail,
    },
    ...(typeof a.zIndex === 'number' && Number.isFinite(a.zIndex)
      ? { zIndex: Number(a.zIndex) }
      : { zIndex: index + 1 }),
    ...(typeof a.moved === 'boolean' ? { moved: a.moved } : {}),
  }
}

function normalizeSlide(raw: unknown, index: number): Slide {
  const s = asRecord(raw)
  const anim = { ...defaultSlideAnimation(), ...asRecord(s.slideAnimation) }
  const content = Array.isArray(s.slideContent) ? s.slideContent : []
  return {
    i: String(s.i ?? index),
    x: Number(s.x) || 0,
    y: Number(s.y) || index,
    w: Number(s.w) || 1,
    h: Number(s.h) || 1,
    slideAnimation: {
      steps: Number(anim.steps) || 1,
      enter: String(anim.enter || 'fadeIn'),
      leave: String(anim.leave || 'fadeOut'),
    },
    slideContent: (() => {
      const atoms = content.map((a, i) => normalizeAtom(a, i))
      // If any atom carried an explicit zIndex, sort so paint order survives reload.
      if (atoms.some((a) => typeof a.zIndex === 'number')) {
        atoms.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
      }
      return withZIndex(atoms)
    })(),
    ...(typeof s.moved === 'boolean' ? { moved: s.moved } : {}),
  }
}

function migrateSlidesFromLegacy(slides: Slide[]): Slide[] {
  return slides.map((sl) => ({
    ...sl,
    slideContent: sl.slideContent.map((a) => {
      const scaled = scaleLegacyRect({ x: a.x, y: a.y, w: a.w, h: a.h })
      return { ...a, ...scaled }
    }),
  }))
}

/** Coerce arbitrary JSON into a DeckFile matching Vue field names. */
export function normalizeDeck(raw: unknown): DeckFile {
  const d = asRecord(raw)
  if (d.fileType !== 'vslideFile') {
    throw new Error('不是有效的微思文稿 JSON（需要 fileType: vslideFile）')
  }
  const slidesRaw = Array.isArray(d.slides) ? d.slides : []
  if (!slidesRaw.length) {
    throw new Error('文稿没有幻灯片')
  }
  const background = normalizeBackground(d.background)
  let slides = slidesRaw.map((s, i) => normalizeSlide(s, i))
  const declaredCols =
    typeof d.gridCols === 'number' && Number.isFinite(d.gridCols)
      ? Number(d.gridCols)
      : undefined
  const allAtoms = slides.flatMap((s) => s.slideContent)
  if (deckLooksLikeLegacyCols(allAtoms, declaredCols)) {
    slides = migrateSlidesFromLegacy(slides)
  }
  const getBackground =
    typeof d.getBackground === 'string' && d.getBackground
      ? d.getBackground
      : cssBackground(background)

  return {
    fileType: 'vslideFile',
    fileName: String(d.fileName || '未命名'),
    id: String(d.id || nanoid()),
    date: typeof d.date === 'number' ? d.date : Date.now(),
    author: String(d.author || 'nobody'),
    shared: Boolean(d.shared),
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    background,
    getBackground,
    slides,
    gridCols: GRID_COLS,
  }
}

/** Serialize for download — always refresh getBackground like Vue save. */
export function serializeDeck(deck: DeckFile): DeckFile {
  return {
    ...deck,
    shared: Boolean(deck.shared),
    gridCols: GRID_COLS,
    getBackground: cssBackground(deck.background),
    slides: deck.slides.map((sl, si) => ({
      ...sl,
      i: String(sl.i ?? si),
      slideContent: sl.slideContent.map((a, ai) => {
        const detail = { ...a.atomContent.detail }
        // strip React-only keys
        delete detail.fit
        if (a.atomType === 'echart' && typeof detail.title === 'string') {
          detail.title = defaultEchartTitle(detail.title)
        }
        if (
          (a.atomType === 'echart' || a.atomType === 'tables') &&
          Array.isArray(detail.sheetData)
        ) {
          const dims = sheetNrNc(detail.sheetData as (string | number)[][])
          if (typeof detail.nr !== 'number') detail.nr = dims.nr
          if (typeof detail.nc !== 'number') detail.nc = dims.nc
        }
        return {
          i: String(a.i ?? ai),
          x: a.x,
          y: a.y,
          w: a.w,
          h: a.h,
          static: Boolean(a.static),
          super: Boolean(a.super),
          atomType: a.atomType,
          atomBorder: a.atomBorder,
          atomAnimation: a.atomAnimation,
          atomContent: { atomName: a.atomContent.atomName, detail },
          zIndex: typeof a.zIndex === 'number' ? a.zIndex : ai + 1,
          ...(a.moved != null ? { moved: a.moved } : {}),
        }
      }),
    })),
  }
}
