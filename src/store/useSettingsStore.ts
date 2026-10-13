import { create } from 'zustand'
import {
  DEFAULT_CHART_PALETTE_ID,
  getPaletteById,
  isChartPaletteId,
  type ChartPaletteId,
} from '../chartThemes/palettes'

const STORAGE_KEY = 'vslide-cn-react:chartPalette'

function loadPaletteId(): ChartPaletteId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && isChartPaletteId(raw)) return raw
  } catch {
    /* private mode / SSR */
  }
  return DEFAULT_CHART_PALETTE_ID
}

function persistPaletteId(id: ChartPaletteId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* quota */
  }
}

interface SettingsState {
  /** Global default series color scheme for charts. */
  chartPaletteId: ChartPaletteId
  setChartPaletteId: (id: ChartPaletteId) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  chartPaletteId:
    typeof localStorage !== 'undefined'
      ? loadPaletteId()
      : DEFAULT_CHART_PALETTE_ID,

  setChartPaletteId: (id) => {
    persistPaletteId(id)
    set({ chartPaletteId: id })
  },
}))

/** Imperative read for option builders (avoids stale closure in charts.ts). */
export function getActiveChartColors(): string[] {
  return getPaletteById(useSettingsStore.getState().chartPaletteId).colors
}
