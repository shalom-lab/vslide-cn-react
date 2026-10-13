import { useRef } from 'react'
import {
  matchSpecial,
  matchSpecialLabel,
  resolveEditorOption,
  type SelectOption,
  type SpecialField,
} from '../../editor/editorOption'
import { pathJoin } from '../../utils/pathSet'

interface Props {
  /** Object to edit (plain + nested) */
  obj: Record<string, unknown>
  /** Path prefix into the atom, e.g. atomContent.detail */
  prefix: string
  /** editorOption key (atomName / atomBorder / atomAnimation) */
  optionKey: string
  onChange: (fullPath: string, value: unknown) => void
  depth?: number
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isPrimitiveArray(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x === null ||
        typeof x === 'string' ||
        typeof x === 'number' ||
        typeof x === 'boolean',
    )
  )
}

function inferType(
  key: string,
  value: unknown,
  fullPath: string,
  special?: SpecialField,
): SpecialField['type'] {
  if (special?.type) return special.type
  if (typeof value === 'boolean') return 'switch'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') {
    if (/color/i.test(key) || /color/i.test(fullPath)) return 'color'
    if (value.length > 80 || key === 'markdown' || key === 'html') return 'textarea'
    return 'text'
  }
  return 'text'
}

function toHexColor(input: string): string {
  if (input.startsWith('#') && (input.length === 7 || input.length === 4)) {
    return input.slice(0, 7)
  }
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return '#808080'
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1]!)}${hex(m[2]!)}${hex(m[3]!)}`
}

/**
 * Vue-style recursive prop editor: walks an object tree, renders inputs for
 * primitives and nested cards for objects (Editor.vue + UserInput.vue).
 */
export function RecursivePropEditor({
  obj,
  prefix,
  optionKey,
  onChange,
  depth = 0,
}: Props) {
  const opt = resolveEditorOption(optionKey)
  const skip = new Set(opt.skipKeys ?? [])
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingPath = useRef<string | null>(null)

  if (!obj || typeof obj !== 'object') return null

  const plain: {
    key: string
    path: string
    label: string
    value: unknown
    type: SpecialField['type']
    options?: SelectOption[]
    tip?: string
  }[] = []
  const complex: { key: string; path: string; label: string; obj: Record<string, unknown> }[] = []

  for (const key of Object.keys(obj)) {
    if (skip.has(key)) continue
    const value = obj[key]
    const path = pathJoin(prefix, key)
    const label =
      matchSpecialLabel(path, opt.specialLabels) ||
      opt.labels?.[key] ||
      key
    const special = matchSpecial(path, opt.special)

    if (value === null || value === undefined) {
      plain.push({
        key,
        path,
        label,
        value: '',
        type: special?.type ?? 'text',
        options: special?.options ?? opt.selectOptions?.[key],
        tip: special?.tip,
      })
      continue
    }

    if (Array.isArray(value)) {
      if (isPrimitiveArray(value)) {
        // Editable as comma-separated / JSON-ish text for small arrays
        plain.push({
          key,
          path,
          label,
          value: JSON.stringify(value),
          type: 'text',
          tip: '数组（JSON）',
        })
      }
      // Skip nested object arrays (sheetData already excluded; others rare)
      continue
    }

    if (isPlainObject(value)) {
      complex.push({ key, path, label, obj: value })
      continue
    }

    const type = inferType(key, value, path, special)
    const options =
      special?.options ??
      (type === 'select' || opt.selectOptions?.[key]
        ? special?.options ?? opt.selectOptions?.[key]
        : undefined)
    // Auto-promote to select when options exist for this key
    const finalType =
      options && options.length && type === 'text' ? 'select' : type

    plain.push({
      key,
      path,
      label,
      value,
      type: finalType,
      options,
      tip: special?.tip,
    })
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const path = pendingPath.current
    e.target.value = ''
    pendingPath.current = null
    if (!file || !path) return
    const reader = new FileReader()
    reader.onload = () => onChange(path, String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className={'recursive-editor' + (depth > 0 ? ' nested' : '')}>
      {plain.map((item) => (
        <label key={item.path} className="field recursive-field">
          <span className="recursive-label">{item.label}</span>
          {item.type === 'switch' && (
            <input
              type="checkbox"
              checked={Boolean(item.value)}
              onChange={(e) => onChange(item.path, e.target.checked)}
            />
          )}
          {item.type === 'number' && (
            <input
              type="number"
              value={Number(item.value) || 0}
              onChange={(e) => onChange(item.path, Number(e.target.value))}
            />
          )}
          {item.type === 'color' && (
            <input
              type="color"
              value={toHexColor(String(item.value ?? '#808080'))}
              onChange={(e) => onChange(item.path, e.target.value)}
            />
          )}
          {item.type === 'select' && (
            <select
              value={String(item.value ?? '')}
              onChange={(e) => {
                const raw = e.target.value
                const optMatch = item.options?.find((o) => String(o.value) === raw)
                onChange(item.path, optMatch ? optMatch.value : raw)
              }}
            >
              {(item.options ?? []).map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          {item.type === 'textarea' && (
            <textarea
              rows={8}
              value={String(item.value ?? '')}
              onChange={(e) => onChange(item.path, e.target.value)}
            />
          )}
          {item.type === 'image' && (
            <div className="recursive-image-row">
              <input
                value={String(item.value ?? '').slice(0, 120)}
                title={String(item.value ?? '')}
                onChange={(e) => onChange(item.path, e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  pendingPath.current = item.path
                  fileRef.current?.click()
                }}
              >
                本地
              </button>
            </div>
          )}
          {item.type === 'text' && (
            <input
              value={String(item.value ?? '')}
              onChange={(e) => {
                const raw = e.target.value
                // Try parse JSON arrays typed as text
                if (raw.startsWith('[')) {
                  try {
                    const parsed = JSON.parse(raw)
                    if (Array.isArray(parsed)) {
                      onChange(item.path, parsed)
                      return
                    }
                  } catch {
                    /* keep as string while typing */
                  }
                }
                onChange(item.path, raw)
              }}
            />
          )}
          {item.tip ? <span className="hint">{item.tip}</span> : null}
        </label>
      ))}

      {complex.map((block) => (
        <div key={block.path} className="recursive-block">
          <h5 className="recursive-block-title">{block.label}</h5>
          <RecursivePropEditor
            obj={block.obj}
            prefix={block.path}
            optionKey={optionKey}
            onChange={onChange}
            depth={depth + 1}
          />
        </div>
      ))}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />
    </div>
  )
}
