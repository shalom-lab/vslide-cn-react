/**
 * 「我的图表」— local chart/atom gallery (localStorage).
 * Mirrors Vue gallery.localLayout + IndexedDB slideContent, without cloud.
 */
import type { Atom } from '../types/deck'
import { resolveAtomEntry } from '../atoms/registry'

export const LOCAL_GALLERY_KEY = 'vslide-cn-react:localAtoms'

export interface LocalGalleryItem {
  id: string
  name: string
  atom: Atom
  createdAt: number
}

/** Display name from chart title / registry label / atomName. */
export function defaultGalleryName(atom: Atom): string {
  const detail = atom.atomContent?.detail ?? {}
  const title = detail.title
  if (typeof title === 'string' && title.trim()) return title.trim()
  if (title && typeof title === 'object') {
    const text = (title as { text?: unknown }).text
    if (typeof text === 'string' && text.trim()) return text.trim()
  }
  const entry = resolveAtomEntry(String(atom.atomContent?.atomName ?? ''))
  if (entry?.label) return entry.label
  return String(atom.atomContent?.atomName ?? '未命名图表')
}

function isAtomLike(x: unknown): x is Atom {
  return (
    !!x &&
    typeof x === 'object' &&
    'atomContent' in x &&
    'atomType' in x &&
    typeof (x as Atom).i === 'string'
  )
}

function isGalleryItem(x: unknown): x is LocalGalleryItem {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof (x as LocalGalleryItem).id === 'string' &&
    typeof (x as LocalGalleryItem).name === 'string' &&
    isAtomLike((x as LocalGalleryItem).atom)
  )
}

/** Load gallery; migrates legacy bare Atom[] entries. */
export function loadLocalGallery(): LocalGalleryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_GALLERY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item, idx): LocalGalleryItem | null => {
        if (isGalleryItem(item)) {
          return {
            id: item.id,
            name: item.name.trim() || defaultGalleryName(item.atom),
            atom: item.atom,
            createdAt:
              typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          }
        }
        if (isAtomLike(item)) {
          const createdAt = Number(item.i)
          return {
            id: item.i || `legacy-${idx}-${Date.now()}`,
            name: defaultGalleryName(item),
            atom: item,
            createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
          }
        }
        return null
      })
      .filter((x): x is LocalGalleryItem => !!x)
  } catch {
    return []
  }
}

export function persistLocalGallery(items: LocalGalleryItem[]) {
  try {
    localStorage.setItem(LOCAL_GALLERY_KEY, JSON.stringify(items))
  } catch {
    /* quota */
  }
}

export function makeGalleryItem(atom: Atom, name?: string): LocalGalleryItem {
  const copy: Atom = JSON.parse(JSON.stringify(atom))
  const id = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  copy.i = id
  copy.x = 0
  copy.w = 6
  copy.h = 5
  copy.static = false
  return {
    id,
    name: (name?.trim() || defaultGalleryName(copy)),
    atom: copy,
    createdAt: Date.now(),
  }
}
