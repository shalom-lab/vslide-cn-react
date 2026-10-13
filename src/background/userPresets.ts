import type { BackgroundConfig } from '../types/deck'
import { cssBackground } from '../utils/background'
import { cloneBg, type BgPreset } from './presets'

const STORAGE_KEY = 'vslide-cn-react:bgPresets'

export interface UserBgPreset {
  id: string
  name: string
  config: BackgroundConfig
  createdAt: number
}

function toGallery(p: UserBgPreset): BgPreset {
  return {
    id: p.id,
    name: p.name,
    swatch: cssBackground(p.config),
    config: p.config,
  }
}

export function loadUserPresets(): UserBgPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is UserBgPreset =>
        !!p &&
        typeof p === 'object' &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        p.config &&
        typeof p.config === 'object',
    )
  } catch {
    return []
  }
}

export function loadUserPresetsAsGallery(): BgPreset[] {
  return loadUserPresets().map(toGallery)
}

function persist(list: UserBgPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function saveUserPreset(name: string, config: BackgroundConfig): UserBgPreset {
  const list = loadUserPresets()
  const entry: UserBgPreset = {
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || '我的背景',
    config: cloneBg(config),
    createdAt: Date.now(),
  }
  list.unshift(entry)
  persist(list)
  return entry
}

export function deleteUserPreset(id: string): UserBgPreset[] {
  const list = loadUserPresets().filter((p) => p.id !== id)
  persist(list)
  return list
}

export function renameUserPreset(id: string, name: string): UserBgPreset[] {
  const list = loadUserPresets().map((p) =>
    p.id === id ? { ...p, name: name.trim() || p.name } : p,
  )
  persist(list)
  return list
}
