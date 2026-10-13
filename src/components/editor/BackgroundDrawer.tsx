import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ClipboardPaste,
  Copy,
  ImagePlus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import {
  BUILTIN_PRESETS,
  cloneBg,
  makeBg,
  type BgPreset,
} from '../../background/presets'
import {
  deleteUserPreset,
  loadUserPresetsAsGallery,
  saveUserPreset,
} from '../../background/userPresets'
import { useDeckStore } from '../../store/useDeckStore'
import type { BackgroundConfig } from '../../types/deck'
import { cssBackground } from '../../utils/background'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'presets' | 'custom' | 'mine'

function configsEqual(a: BackgroundConfig, b: BackgroundConfig): boolean {
  return cssBackground(a) === cssBackground(b)
}

function PresetCard({
  preset,
  active,
  onApply,
  onDelete,
}: {
  preset: BgPreset
  active: boolean
  onApply: () => void
  onDelete?: () => void
}) {
  return (
    <div className={'bg-preset-card' + (active ? ' active' : '')}>
      <button
        type="button"
        className="bg-preset-swatch"
        style={{ background: preset.swatch }}
        onClick={onApply}
        title={`应用「${preset.name}」`}
        aria-label={preset.name}
      >
        {active ? (
          <span className="bg-preset-check">
            <Check size={14} strokeWidth={2.5} />
          </span>
        ) : null}
      </button>
      <div className="bg-preset-meta">
        <span className="bg-preset-name">{preset.name}</span>
        {onDelete ? (
          <button
            type="button"
            className="bg-preset-del"
            title="删除"
            aria-label={`删除 ${preset.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function BackgroundDrawer({ open, onClose }: Props) {
  const bg = useDeckStore((s) => s.deck.background)
  const setBackground = useDeckStore((s) => s.setBackground)
  const [tab, setTab] = useState<Tab>('presets')
  const [mine, setMine] = useState<BgPreset[]>(() => loadUserPresetsAsGallery())
  const [saveName, setSaveName] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const flash = useCallback((text: string) => {
    setMsg(text)
    window.setTimeout(() => setMsg(null), 1800)
  }, [])

  useEffect(() => {
    if (!open) return
    setMine(loadUserPresetsAsGallery())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const apply = useCallback(
    (config: BackgroundConfig) => {
      setBackground(cloneBg(config))
    },
    [setBackground],
  )

  const activeId = useMemo(() => {
    const hit = [...BUILTIN_PRESETS, ...mine].find((p) =>
      configsEqual(p.config, bg),
    )
    return hit?.id ?? null
  }, [bg, mine])

  const patch = (partial: Partial<BackgroundConfig>) => {
    setBackground({ ...bg, ...partial })
  }

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      setBackground(
        makeBg({
          mode: 'image',
          image: {
            src,
            repeat: 'no-repeat',
            x: 'center',
            y: 'center',
            width: '100%',
            height: '100%',
          },
        }),
      )
      flash('已应用图片背景')
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const copyCurrent = async () => {
    const payload = {
      background: bg,
      css: cssBackground(bg),
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      flash('已复制当前背景 JSON')
    } catch {
      flash('复制失败')
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const trimmed = text.trim()
      // Try JSON first
      try {
        const parsed = JSON.parse(trimmed) as {
          background?: BackgroundConfig
          css?: string
          mode?: string
        }
        if (parsed.background && typeof parsed.background === 'object') {
          apply(parsed.background as BackgroundConfig)
          flash('已粘贴背景配置')
          return
        }
        if (parsed.mode) {
          apply(parsed as unknown as BackgroundConfig)
          flash('已粘贴背景配置')
          return
        }
        if (typeof parsed.css === 'string') {
          patch({ mode: 'custom', custom: parsed.css })
          flash('已粘贴 CSS 背景')
          return
        }
      } catch {
        /* not JSON — treat as CSS */
      }
      if (trimmed) {
        patch({ mode: 'custom', custom: trimmed })
        flash('已粘贴为自定义 CSS')
      }
    } catch {
      flash('无法读取剪贴板')
    }
  }

  const onSaveMine = () => {
    const name = saveName.trim() || `背景 ${mine.length + 1}`
    saveUserPreset(name, bg)
    setMine(loadUserPresetsAsGallery())
    setSaveName('')
    setTab('mine')
    flash('已保存到「我的背景」')
  }

  if (!open) return null

  const liveCss = cssBackground(bg)

  return (
    <div className="drawer-root" role="dialog" aria-label="背景设置">
      <button
        type="button"
        className="drawer-mask"
        aria-label="关闭"
        onClick={onClose}
      />
      <aside className="drawer-panel bg-drawer">
        <header className="drawer-header">
          <h3>背景</h3>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>

        <div className="bg-live-preview" style={{ background: liveCss }} />

        <div className="drawer-tabs">
          {(
            [
              ['presets', '模板'],
              ['custom', '自定义'],
              ['mine', '我的'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={'drawer-tab' + (tab === id ? ' active' : '')}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="drawer-body bg-drawer-body">
          {tab === 'presets' && (
            <>
              <p className="drawer-hint">点击即应用到当前文稿（可撤销）</p>
              <div className="bg-preset-grid">
                {BUILTIN_PRESETS.map((p) => (
                  <PresetCard
                    key={p.id}
                    preset={p}
                    active={activeId === p.id}
                    onApply={() => apply(p.config)}
                  />
                ))}
              </div>
            </>
          )}

          {tab === 'custom' && (
            <div className="bg-custom">
              <label className="field">
                模式
                <select
                  value={bg.mode}
                  onChange={(e) =>
                    patch({ mode: e.target.value as BackgroundConfig['mode'] })
                  }
                >
                  <option value="pure">纯色</option>
                  <option value="linear">线性渐变</option>
                  <option value="radial">径向渐变</option>
                  <option value="custom">自定义 CSS</option>
                  <option value="image">图片</option>
                  <option value="texture">纹理平铺</option>
                </select>
              </label>

              {bg.mode === 'pure' && (
                <label className="field">
                  颜色
                  <input
                    type="color"
                    value={toHex(bg.pure) || '#f7f4ef'}
                    onChange={(e) => patch({ pure: e.target.value })}
                  />
                </label>
              )}

              {bg.mode === 'linear' && (
                <>
                  <label className="field">
                    角度
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={bg.linear.angle}
                      onChange={(e) =>
                        patch({
                          linear: {
                            ...bg.linear,
                            angle: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    起始色
                    <input
                      type="color"
                      value={toHex(bg.linear.start) || '#ffffff'}
                      onChange={(e) =>
                        patch({
                          linear: { ...bg.linear, start: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    结束色
                    <input
                      type="color"
                      value={toHex(bg.linear.end) || '#eef2f7'}
                      onChange={(e) =>
                        patch({
                          linear: { ...bg.linear, end: e.target.value },
                        })
                      }
                    />
                  </label>
                </>
              )}

              {bg.mode === 'radial' && (
                <>
                  <label className="field">
                    形状
                    <input
                      value={bg.radial.shape}
                      onChange={(e) =>
                        patch({
                          radial: { ...bg.radial, shape: e.target.value },
                        })
                      }
                      placeholder="ellipse at center"
                    />
                  </label>
                  <label className="field">
                    起始色
                    <input
                      type="color"
                      value={toHex(bg.radial.start) || '#2a2f55'}
                      onChange={(e) =>
                        patch({
                          radial: { ...bg.radial, start: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    结束色
                    <input
                      type="color"
                      value={toHex(bg.radial.end) || '#12131f'}
                      onChange={(e) =>
                        patch({
                          radial: { ...bg.radial, end: e.target.value },
                        })
                      }
                    />
                  </label>
                </>
              )}

              {bg.mode === 'custom' && (
                <label className="field">
                  CSS background
                  <textarea
                    rows={5}
                    value={bg.custom}
                    onChange={(e) => patch({ custom: e.target.value })}
                    placeholder="linear-gradient(...) , radial-gradient(...)"
                  />
                </label>
              )}

              {(bg.mode === 'image' || bg.mode === 'texture') && (
                <>
                  <label className="field">
                    图片 URL / DataURL
                    <textarea
                      rows={3}
                      value={
                        bg.mode === 'image' ? bg.image.src : bg.texture.src
                      }
                      onChange={(e) => {
                        if (bg.mode === 'image') {
                          patch({
                            image: { ...bg.image, src: e.target.value },
                          })
                        } else {
                          patch({
                            texture: { ...bg.texture, src: e.target.value },
                          })
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-secondary bg-action"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus size={14} strokeWidth={1.75} />
                    上传图片
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onUpload}
                  />
                </>
              )}

              <div className="bg-actions">
                <button
                  type="button"
                  className="btn-secondary bg-action"
                  onClick={copyCurrent}
                >
                  <Copy size={14} strokeWidth={1.75} />
                  复制当前背景
                </button>
                <button
                  type="button"
                  className="btn-secondary bg-action"
                  onClick={pasteFromClipboard}
                >
                  <ClipboardPaste size={14} strokeWidth={1.75} />
                  从剪贴板粘贴
                </button>
              </div>

              <div className="bg-save-row">
                <input
                  className="bg-save-input"
                  placeholder="另存为「我的背景」名称"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary bg-action"
                  onClick={onSaveMine}
                >
                  <Save size={14} strokeWidth={1.75} />
                  保存
                </button>
              </div>
            </div>
          )}

          {tab === 'mine' && (
            <>
              <p className="drawer-hint">保存在本机 localStorage，可删除</p>
              {mine.length === 0 ? (
                <p className="muted">暂无自定义背景。在「自定义」里保存当前背景。</p>
              ) : (
                <div className="bg-preset-grid">
                  {mine.map((p) => (
                    <PresetCard
                      key={p.id}
                      preset={p}
                      active={activeId === p.id}
                      onApply={() => apply(p.config)}
                      onDelete={() => {
                        deleteUserPreset(p.id)
                        setMine(loadUserPresetsAsGallery())
                        flash('已删除')
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="bg-save-row" style={{ marginTop: 8 }}>
                <input
                  className="bg-save-input"
                  placeholder="用当前背景新建"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary bg-action"
                  onClick={onSaveMine}
                >
                  <Save size={14} strokeWidth={1.75} />
                  保存当前
                </button>
              </div>
            </>
          )}

          {msg ? <p className="bg-flash">{msg}</p> : null}
        </div>
      </aside>
    </div>
  )
}

function toHex(input: string): string | null {
  if (input.startsWith('#') && (input.length === 7 || input.length === 4)) {
    return input.length === 7 ? input : input
  }
  if (input.startsWith('#')) return input.slice(0, 7)
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
}
