import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  ClipboardPaste,
  Copy,
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
  const [cssDraft, setCssDraft] = useState(() => cssBackground(bg))

  const flash = useCallback((text: string) => {
    setMsg(text)
    window.setTimeout(() => setMsg(null), 1800)
  }, [])

  useEffect(() => {
    if (!open) return
    setMine(loadUserPresetsAsGallery())
    setCssDraft(cssBackground(useDeckStore.getState().deck.background))
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

  const applyCssDraft = useCallback(() => {
    const next = makeBg({
      mode: 'custom',
      custom: cssDraft.trim() || 'transparent',
      pure: bg.pure || '#ffffff',
    })
    setBackground(next)
    flash('已应用自定义 CSS')
  }, [bg.pure, cssDraft, flash, setBackground])

  const activeId = useMemo(() => {
    const hit = [...BUILTIN_PRESETS, ...mine].find((p) =>
      configsEqual(p.config, bg),
    )
    return hit?.id ?? null
  }, [bg, mine])

  const copyCurrent = async () => {
    const text = tab === 'custom' ? cssDraft : cssBackground(bg)
    try {
      await navigator.clipboard.writeText(text)
      flash('已复制 CSS')
    } catch {
      flash('复制失败')
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const trimmed = text.trim()
      if (!trimmed) {
        flash('剪贴板为空')
        return
      }
      try {
        const parsed = JSON.parse(trimmed) as {
          background?: BackgroundConfig
          css?: string
          mode?: string
        }
        if (parsed.background && typeof parsed.background === 'object') {
          apply(parsed.background as BackgroundConfig)
          setCssDraft(cssBackground(parsed.background as BackgroundConfig))
          flash('已粘贴背景配置')
          return
        }
        if (parsed.mode) {
          apply(parsed as unknown as BackgroundConfig)
          setCssDraft(cssBackground(parsed as unknown as BackgroundConfig))
          flash('已粘贴背景配置')
          return
        }
        if (typeof parsed.css === 'string') {
          setCssDraft(parsed.css)
          setTab('custom')
          flash('已粘贴 CSS')
          return
        }
      } catch {
        /* not JSON — treat as raw CSS */
      }
      setCssDraft(trimmed)
      setTab('custom')
      flash('已粘贴为自定义 CSS')
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
              onClick={() => {
                if (id === 'custom') {
                  setCssDraft(cssBackground(bg))
                }
                setTab(id)
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="drawer-body bg-drawer-body">
          {tab === 'presets' && (
            <>
              <p className="drawer-hint">
                纯色 / 柔和渐变为主 · 少量图片衬底 · 点击即应用（可撤销）
              </p>
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
              <p className="drawer-hint">
                直接编辑 CSS <code>background</code> 值；改完点应用
              </p>
              <div className="bg-panel">
                <label className="field">
                  <span className="field-label">CSS background</span>
                  <textarea
                    rows={6}
                    value={cssDraft}
                    onChange={(e) => setCssDraft(e.target.value)}
                    placeholder="linear-gradient(...) , #f7f4ef , url(...) center / cover"
                    spellCheck={false}
                  />
                </label>
                <div
                  className="bg-css-swatch"
                  style={{ background: cssDraft || 'transparent' }}
                  title="草稿预览"
                />
              </div>

              <div className="bg-actions">
                <button
                  type="button"
                  className="btn-primary bg-action"
                  onClick={applyCssDraft}
                >
                  应用
                </button>
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
