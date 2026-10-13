import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ClipboardPaste,
  Copy,
  ImagePlus,
  Plus,
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
import type {
  BackgroundConfig,
  GradientStop,
} from '../../types/deck'
import { defaultGradientStops } from '../../types/deck'
import {
  cssBackground,
  resolveStops,
  syncLinearEnds,
  syncRadialEnds,
} from '../../utils/background'

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

function Field({
  label,
  children,
  row,
}: {
  label: string
  children: React.ReactNode
  row?: boolean
}) {
  return (
    <label className={'field' + (row ? ' field-row' : '')}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

function ColorStopEditor({
  stops,
  onChange,
}: {
  stops: GradientStop[]
  onChange: (next: GradientStop[]) => void
}) {
  const update = (index: number, patch: Partial<GradientStop>) => {
    const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(next)
  }
  const remove = (index: number) => {
    if (stops.length <= 2) return
    onChange(stops.filter((_, i) => i !== index))
  }
  const add = () => {
    const last = stops[stops.length - 1]
    const prev = stops[stops.length - 2] ?? last
    const midPos = Math.round(((prev?.position ?? 0) + (last?.position ?? 100)) / 2)
    const insertAt = stops.length - 1
    const next = [
      ...stops.slice(0, insertAt),
      { color: toHex(prev?.color || '#ffffff') || '#ffffff', position: midPos },
      ...stops.slice(insertAt),
    ]
    onChange(next)
  }
  return (
    <div className="bg-stops">
      <div className="bg-stops-head">
        <span>色标</span>
        <button type="button" className="bg-mini-btn" onClick={add}>
          <Plus size={12} strokeWidth={2} />
          添加
        </button>
      </div>
      {stops.map((s, i) => (
        <div key={i} className="bg-stop-row">
          <input
            type="color"
            value={toHex(s.color) || '#ffffff'}
            onChange={(e) => update(i, { color: e.target.value })}
            title="颜色"
          />
          <input
            type="text"
            className="bg-stop-hex"
            value={s.color}
            onChange={(e) => update(i, { color: e.target.value })}
            spellCheck={false}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={s.position}
            onChange={(e) => update(i, { position: Number(e.target.value) })}
            title="位置 %"
          />
          <span className="bg-stop-pct">{Math.round(s.position)}%</span>
          <button
            type="button"
            className="bg-mini-btn danger"
            disabled={stops.length <= 2}
            onClick={() => remove(i)}
            title="删除色标"
            aria-label="删除色标"
          >
            <Trash2 size={12} strokeWidth={1.75} />
          </button>
        </div>
      ))}
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
  const uploadTarget = useRef<'image' | 'texture'>('image')

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

  const linearStops = resolveStops(bg.linear.stops, bg.linear.start, bg.linear.end)
  const radialStops = resolveStops(bg.radial.stops, bg.radial.start, bg.radial.end)

  const setLinearStops = (stops: GradientStop[]) => {
    patch({ linear: syncLinearEnds({ ...bg.linear, stops }) })
  }
  const setRadialStops = (stops: GradientStop[]) => {
    patch({ radial: syncRadialEnds({ ...bg.radial, stops }) })
  }

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    const target = uploadTarget.current
    reader.onload = () => {
      const src = String(reader.result)
      if (target === 'texture') {
        setBackground(
          makeBg({
            mode: 'texture',
            texture: { src, repeat: bg.texture.repeat || 'repeat' },
          }),
        )
        flash('已应用纹理背景')
      } else {
        setBackground(
          makeBg({
            mode: 'image',
            image: {
              src,
              repeat: bg.image.repeat || 'no-repeat',
              x: bg.image.x || 'center',
              y: bg.image.y || 'center',
              width: bg.image.width || '100%',
              height: bg.image.height || '100%',
              sizeMode: bg.image.sizeMode || 'cover',
              opacity: bg.image.opacity ?? 100,
            },
          }),
        )
        flash('已应用图片背景')
      }
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const pickUpload = (kind: 'image' | 'texture') => {
    uploadTarget.current = kind
    fileRef.current?.click()
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
        /* not JSON */
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
  const pureOpacity = bg.pureOpacity ?? 100
  const imgOpacity = bg.image.opacity ?? 100
  const sizeMode = bg.image.sizeMode || 'custom'
  const radialKind =
    bg.radial.shapeKind ||
    (String(bg.radial.shape).includes('circle') ? 'circle' : 'ellipse')
  const posX = bg.radial.positionX || 'center'
  const posY = bg.radial.positionY || 'center'

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
        <p className="bg-live-caption">实时预览 · 应用后可撤销</p>

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
              <div className="bg-mode-pills" role="tablist" aria-label="背景模式">
                {(
                  [
                    ['pure', '纯色'],
                    ['linear', '线性'],
                    ['radial', '径向'],
                    ['image', '图片'],
                    ['texture', '纹理'],
                    ['custom', 'CSS'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={bg.mode === id}
                    className={
                      'bg-mode-pill' + (bg.mode === id ? ' active' : '')
                    }
                    onClick={() => {
                      if (id === 'linear' && (!bg.linear.stops || bg.linear.stops.length < 2)) {
                        patch({
                          mode: id,
                          linear: syncLinearEnds({
                            ...bg.linear,
                            stops: defaultGradientStops(bg.linear.start, bg.linear.end),
                          }),
                        })
                      } else if (
                        id === 'radial' &&
                        (!bg.radial.stops || bg.radial.stops.length < 2)
                      ) {
                        patch({
                          mode: id,
                          radial: syncRadialEnds({
                            ...bg.radial,
                            stops: defaultGradientStops(bg.radial.start, bg.radial.end),
                          }),
                        })
                      } else {
                        patch({ mode: id })
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {bg.mode === 'pure' && (
                <div className="bg-panel">
                  <Field label="颜色" row>
                    <input
                      type="color"
                      value={toHex(bg.pure) || '#f7f4ef'}
                      onChange={(e) => patch({ pure: e.target.value })}
                    />
                    <input
                      type="text"
                      className="bg-hex-input"
                      value={bg.pure}
                      onChange={(e) => patch({ pure: e.target.value })}
                      spellCheck={false}
                    />
                  </Field>
                  <Field label={`不透明度 ${pureOpacity}%`}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={pureOpacity}
                      onChange={(e) =>
                        patch({ pureOpacity: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>
              )}

              {bg.mode === 'linear' && (
                <div className="bg-panel">
                  <Field label={`角度 ${bg.linear.angle}°`}>
                    <input
                      type="range"
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
                  </Field>
                  <Field label="角度精确值" row>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={bg.linear.angle}
                      onChange={(e) =>
                        patch({
                          linear: {
                            ...bg.linear,
                            angle: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <span className="muted">deg</span>
                  </Field>
                  <ColorStopEditor stops={linearStops} onChange={setLinearStops} />
                </div>
              )}

              {bg.mode === 'radial' && (
                <div className="bg-panel">
                  <Field label="形状" row>
                    <select
                      value={radialKind}
                      onChange={(e) => {
                        const shapeKind = e.target.value as 'circle' | 'ellipse'
                        patch({
                          radial: syncRadialEnds({
                            ...bg.radial,
                            shapeKind,
                            positionX: posX,
                            positionY: posY,
                          }),
                        })
                      }}
                    >
                      <option value="ellipse">椭圆</option>
                      <option value="circle">圆形</option>
                    </select>
                  </Field>
                  <div className="bg-pos-grid">
                    <Field label="水平位置">
                      <select
                        value={
                          ['left', 'center', 'right'].includes(posX) ||
                          posX.endsWith('%')
                            ? posX.endsWith('%') &&
                              !['0%', '25%', '50%', '75%', '100%'].includes(posX)
                              ? '__custom__'
                              : posX
                            : '__custom__'
                        }
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '__custom__') return
                          patch({
                            radial: syncRadialEnds({
                              ...bg.radial,
                              shapeKind: radialKind,
                              positionX: v,
                              positionY: posY,
                            }),
                          })
                        }}
                      >
                        <option value="left">左</option>
                        <option value="center">中</option>
                        <option value="right">右</option>
                        <option value="0%">0%</option>
                        <option value="25%">25%</option>
                        <option value="50%">50%</option>
                        <option value="75%">75%</option>
                        <option value="100%">100%</option>
                        <option value="__custom__">自定义</option>
                      </select>
                      <input
                        type="text"
                        placeholder="如 30%"
                        value={posX}
                        onChange={(e) =>
                          patch({
                            radial: syncRadialEnds({
                              ...bg.radial,
                              shapeKind: radialKind,
                              positionX: e.target.value,
                              positionY: posY,
                            }),
                          })
                        }
                      />
                    </Field>
                    <Field label="垂直位置">
                      <select
                        value={
                          ['top', 'center', 'bottom'].includes(posY) ||
                          posY.endsWith('%')
                            ? posY.endsWith('%') &&
                              !['0%', '25%', '50%', '75%', '100%'].includes(posY)
                              ? '__custom__'
                              : posY
                            : '__custom__'
                        }
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '__custom__') return
                          patch({
                            radial: syncRadialEnds({
                              ...bg.radial,
                              shapeKind: radialKind,
                              positionX: posX,
                              positionY: v,
                            }),
                          })
                        }}
                      >
                        <option value="top">上</option>
                        <option value="center">中</option>
                        <option value="bottom">下</option>
                        <option value="0%">0%</option>
                        <option value="25%">25%</option>
                        <option value="50%">50%</option>
                        <option value="75%">75%</option>
                        <option value="100%">100%</option>
                        <option value="__custom__">自定义</option>
                      </select>
                      <input
                        type="text"
                        placeholder="如 20%"
                        value={posY}
                        onChange={(e) =>
                          patch({
                            radial: syncRadialEnds({
                              ...bg.radial,
                              shapeKind: radialKind,
                              positionX: posX,
                              positionY: e.target.value,
                            }),
                          })
                        }
                      />
                    </Field>
                  </div>
                  <ColorStopEditor stops={radialStops} onChange={setRadialStops} />
                </div>
              )}

              {bg.mode === 'image' && (
                <div className="bg-panel">
                  <button
                    type="button"
                    className="btn-secondary bg-action"
                    onClick={() => pickUpload('image')}
                  >
                    <ImagePlus size={14} strokeWidth={1.75} />
                    上传图片
                  </button>
                  <Field label="图片 URL / DataURL">
                    <textarea
                      rows={2}
                      value={bg.image.src}
                      onChange={(e) =>
                        patch({ image: { ...bg.image, src: e.target.value } })
                      }
                    />
                  </Field>
                  <Field label="尺寸模式" row>
                    <select
                      value={sizeMode}
                      onChange={(e) => {
                        const mode = e.target.value as
                          | 'cover'
                          | 'contain'
                          | 'custom'
                        patch({
                          image: {
                            ...bg.image,
                            sizeMode: mode,
                            ...(mode === 'cover'
                              ? { width: 'cover', height: 'auto' }
                              : mode === 'contain'
                                ? { width: 'contain', height: 'auto' }
                                : {
                                    width:
                                      bg.image.width === 'cover' ||
                                      bg.image.width === 'contain'
                                        ? '100%'
                                        : bg.image.width,
                                    height:
                                      bg.image.height === 'auto'
                                        ? '100%'
                                        : bg.image.height,
                                  }),
                          },
                        })
                      }}
                    >
                      <option value="cover">覆盖 cover</option>
                      <option value="contain">包含 contain</option>
                      <option value="custom">自定义 %</option>
                    </select>
                  </Field>
                  {sizeMode === 'custom' && (
                    <div className="bg-pos-grid">
                      <Field label="宽度">
                        <input
                          value={bg.image.width}
                          onChange={(e) =>
                            patch({
                              image: { ...bg.image, width: e.target.value },
                            })
                          }
                          placeholder="100%"
                        />
                      </Field>
                      <Field label="高度">
                        <input
                          value={bg.image.height}
                          onChange={(e) =>
                            patch({
                              image: { ...bg.image, height: e.target.value },
                            })
                          }
                          placeholder="100%"
                        />
                      </Field>
                    </div>
                  )}
                  <div className="bg-pos-grid">
                    <Field label="水平 X">
                      <input
                        value={bg.image.x}
                        onChange={(e) =>
                          patch({ image: { ...bg.image, x: e.target.value } })
                        }
                        placeholder="center / 50%"
                      />
                    </Field>
                    <Field label="垂直 Y">
                      <input
                        value={bg.image.y}
                        onChange={(e) =>
                          patch({ image: { ...bg.image, y: e.target.value } })
                        }
                        placeholder="center / 50%"
                      />
                    </Field>
                  </div>
                  <Field label="平铺" row>
                    <select
                      value={bg.image.repeat || 'no-repeat'}
                      onChange={(e) =>
                        patch({
                          image: { ...bg.image, repeat: e.target.value },
                        })
                      }
                    >
                      <option value="no-repeat">不平铺</option>
                      <option value="repeat">平铺</option>
                      <option value="repeat-x">水平平铺</option>
                      <option value="repeat-y">垂直平铺</option>
                      <option value="space">space</option>
                      <option value="round">round</option>
                    </select>
                  </Field>
                  <Field label={`透明度叠加 ${imgOpacity}%`}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={imgOpacity}
                      onChange={(e) =>
                        patch({
                          image: {
                            ...bg.image,
                            opacity: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </Field>
                </div>
              )}

              {bg.mode === 'texture' && (
                <div className="bg-panel">
                  <button
                    type="button"
                    className="btn-secondary bg-action"
                    onClick={() => pickUpload('texture')}
                  >
                    <ImagePlus size={14} strokeWidth={1.75} />
                    上传纹理
                  </button>
                  <Field label="纹理 URL / DataURL">
                    <textarea
                      rows={2}
                      value={bg.texture.src}
                      onChange={(e) =>
                        patch({
                          texture: { ...bg.texture, src: e.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="平铺方式" row>
                    <select
                      value={bg.texture.repeat || 'repeat'}
                      onChange={(e) =>
                        patch({
                          texture: {
                            ...bg.texture,
                            repeat: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="repeat">平铺</option>
                      <option value="repeat-x">水平平铺</option>
                      <option value="repeat-y">垂直平铺</option>
                      <option value="no-repeat">不平铺</option>
                      <option value="space">space</option>
                      <option value="round">round</option>
                    </select>
                  </Field>
                </div>
              )}

              {bg.mode === 'custom' && (
                <div className="bg-panel">
                  <Field label="CSS background">
                    <textarea
                      rows={5}
                      value={bg.custom}
                      onChange={(e) => patch({ custom: e.target.value })}
                      placeholder="linear-gradient(...) , radial-gradient(...)"
                      spellCheck={false}
                    />
                  </Field>
                  <div
                    className="bg-css-swatch"
                    style={{ background: bg.custom || 'transparent' }}
                    title="CSS 预览"
                  />
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onUpload}
              />

              <div className="bg-actions">
                <button
                  type="button"
                  className="btn-secondary bg-action"
                  onClick={copyCurrent}
                >
                  <Copy size={14} strokeWidth={1.75} />
                  复制
                </button>
                <button
                  type="button"
                  className="btn-secondary bg-action"
                  onClick={pasteFromClipboard}
                >
                  <ClipboardPaste size={14} strokeWidth={1.75} />
                  粘贴
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
                <p className="muted">
                  暂无自定义背景。在「自定义」里保存当前背景。
                </p>
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
  if (!input) return null
  if (input.startsWith('#') && (input.length === 7 || input.length === 4)) {
    return input.length === 7 ? input : expandShortHex(input)
  }
  if (input.startsWith('#') && input.length >= 7) return input.slice(0, 7)
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
}

function expandShortHex(h: string): string {
  if (h.length !== 4) return h
  return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
}
