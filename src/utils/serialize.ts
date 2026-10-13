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
  defaultSlideAnimation,
  emptyBackgroundImage,
  emptyBackgroundTexture,
  sheetNrNc,
  type Atom,
  type BackgroundConfig,
  type DeckFile,
  type Slide,
} from '../types/deck'
import { cssBackground } from './background'
import { withZIndex } from './layerOrder'

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

function normalizeBackground(raw: unknown): BackgroundConfig {
  const b = asRecord(raw)
  const base = defaultBackground()
  const image = { ...emptyBackgroundImage(), ...asRecord(b.image) }
  const texture = { ...emptyBackgroundTexture(), ...asRecord(b.texture) }
  const linear = { ...base.linear, ...asRecord(b.linear) }
  const radial = { ...base.radial, ...asRecord(b.radial) }
  const mode = (b.mode as BackgroundConfig['mode']) || 'pure'
  return {
    mode,
    pure: typeof b.pure === 'string' ? b.pure : base.pure,
    linear: {
      angle: Number(linear.angle) || 23,
      start: String(linear.start),
      end: String(linear.end),
    },
    radial: {
      shape: String(radial.shape || 'ellipse'),
      start: String(radial.start),
      end: String(radial.end),
    },
    custom: typeof b.custom === 'string' ? b.custom : base.custom,
    image: {
      src: String(image.src ?? ''),
      repeat: String(image.repeat ?? 'repeat'),
      x: String(image.x ?? 'center'),
      y: String(image.y ?? 'center'),
      width: String(image.width ?? '100%'),
      height: String(image.height ?? '100%'),
    },
    texture: { src: String(texture.src ?? '') },
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
  const atomType = (a.atomType as Atom['atomType']) || 'text'

  // text-md: ensure editorId
  if (atomName === 'text-md') {
    if (!detail.editorId && detail.editorid) {
      detail.editorId = detail.editorid
    }
    if (!detail.editorId) detail.editorId = nanoid(10)
    if (typeof detail.markdown !== 'string') detail.markdown = ''
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
  const slides = slidesRaw.map((s, i) => normalizeSlide(s, i))
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
  }
}

/** Serialize for download — always refresh getBackground like Vue save. */
export function serializeDeck(deck: DeckFile): DeckFile {
  return {
    ...deck,
    shared: Boolean(deck.shared),
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
