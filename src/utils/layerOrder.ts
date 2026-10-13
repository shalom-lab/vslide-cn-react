import type { Atom } from '../types/deck'

/** Bring forward / send back relative to slideContent array (last = top). */
export type LayerAction = 'front' | 'back' | 'forward' | 'backward'

/** Assign contiguous zIndex 1..n matching array order (last paints on top). */
export function withZIndex(atoms: Atom[]): Atom[] {
  return atoms.map((a, i) =>
    a.zIndex === i + 1 ? a : { ...a, zIndex: i + 1 },
  )
}

export function layerIndex(atoms: Atom[], atomId: string): number {
  return atoms.findIndex((a) => a.i === atomId)
}

export function canLayerAction(
  atoms: Atom[],
  atomId: string,
  action: LayerAction,
): boolean {
  const idx = layerIndex(atoms, atomId)
  if (idx < 0 || atoms.length < 2) return false
  if (action === 'front' || action === 'forward') return idx < atoms.length - 1
  return idx > 0
}

/**
 * Reorder slideContent for stacking. Array order is canonical; zIndex mirrors it.
 * front = 置顶 (end), back = 置底 (start), forward = 上移一层, backward = 下移一层.
 */
export function applyLayerOrder(
  atoms: Atom[],
  atomId: string,
  action: LayerAction,
): Atom[] | null {
  if (!canLayerAction(atoms, atomId, action)) return null
  const idx = layerIndex(atoms, atomId)
  const next = [...atoms]
  const [item] = next.splice(idx, 1)
  switch (action) {
    case 'front':
      next.push(item)
      break
    case 'back':
      next.unshift(item)
      break
    case 'forward':
      next.splice(idx + 1, 0, item)
      break
    case 'backward':
      next.splice(idx - 1, 0, item)
      break
  }
  return withZIndex(next)
}

/** CSS z-index for an atom; selected gets a temporary boost for editing. */
export function atomStackStyle(
  atom: Atom,
  index: number,
  selected = false,
): { zIndex: number } {
  const base = atom.zIndex ?? index + 1
  return { zIndex: selected ? base + 50_000 : base }
}
