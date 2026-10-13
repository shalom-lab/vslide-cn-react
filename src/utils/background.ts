import type { BackgroundConfig } from '../types/deck'

/** Mirrors Vuex getter getBackground in store/index.js */
export function cssBackground(bg: BackgroundConfig): string {
  switch (bg.mode) {
    case 'pure':
      return bg.pure
    case 'linear':
      return `linear-gradient(${bg.linear.angle}deg, ${bg.linear.start}, ${bg.linear.end})`
    case 'radial':
      return `radial-gradient(${bg.radial.shape}, ${bg.radial.start}, ${bg.radial.end})`
    case 'custom':
      return bg.custom
    case 'image': {
      const img = bg.image
      if (!img?.src) return bg.pure
      return `url(${img.src}) no-repeat ${img.x} ${img.y} / ${img.width} ${img.height}`
    }
    case 'texture': {
      const tex = bg.texture
      if (!tex?.src) return bg.pure
      return `url(${tex.src}) repeat`
    }
    default:
      return bg.pure
  }
}
