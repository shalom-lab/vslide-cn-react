import type { BackgroundConfig } from '../types/deck'

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
    default:
      return bg.pure
  }
}
