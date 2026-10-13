/** Set a nested value by Vue-style path: `a.b[0].c` or `a.b.c`. Returns a deep-cloned root. */
export function setByPath<T>(root: T, path: string, value: unknown): T {
  const clone = structuredClone(root) as Record<string, unknown>
  const parts = parsePath(path)
  if (parts.length === 0) return clone as T

  let cur: Record<string, unknown> | unknown[] = clone
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!
    const nextKey = parts[i + 1]!
    const asIndex = typeof key === 'number'
    const existing = asIndex
      ? (cur as unknown[])[key]
      : (cur as Record<string, unknown>)[key]
    if (existing === null || existing === undefined || typeof existing !== 'object') {
      const next: unknown = typeof nextKey === 'number' ? [] : {}
      if (asIndex) (cur as unknown[])[key] = next
      else (cur as Record<string, unknown>)[key] = next
    }
    cur = (
      asIndex
        ? (cur as unknown[])[key]
        : (cur as Record<string, unknown>)[key]
    ) as Record<string, unknown> | unknown[]
  }

  const last = parts[parts.length - 1]!
  if (typeof last === 'number') (cur as unknown[])[last] = value
  else (cur as Record<string, unknown>)[last] = value
  return clone as T
}

export function getByPath(root: unknown, path: string): unknown {
  const parts = parsePath(path)
  let cur: unknown = root
  for (const key of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = typeof key === 'number'
      ? (cur as unknown[])[key]
      : (cur as Record<string, unknown>)[key]
  }
  return cur
}

function parsePath(path: string): (string | number)[] {
  const parts: (string | number)[] = []
  const re = /([^[.\]]+)|\[(\d+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(path))) {
    if (m[1] !== undefined) parts.push(m[1])
    else if (m[2] !== undefined) parts.push(Number(m[2]))
  }
  return parts
}

export function pathJoin(prefix: string, key: string | number): string {
  if (typeof key === 'number' || /^\d+$/.test(String(key))) {
    return `${prefix}[${key}]`
  }
  return prefix ? `${prefix}.${key}` : String(key)
}
