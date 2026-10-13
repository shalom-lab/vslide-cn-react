import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import {
  CHART_PALETTES,
  type ChartPalette,
  type ChartPaletteId,
} from '../../chartThemes/palettes'
import { useSettingsStore } from '../../store/useSettingsStore'

interface Props {
  open: boolean
  onClose: () => void
}

function PaletteCard({
  palette,
  active,
  onSelect,
}: {
  palette: ChartPalette
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={'palette-card' + (active ? ' active' : '')}
      onClick={onSelect}
      title={`应用「${palette.label}」`}
      aria-pressed={active}
      aria-label={palette.label}
    >
      <div className="palette-swatches" aria-hidden>
        {palette.colors.slice(0, 8).map((c) => (
          <span key={c} className="palette-swatch" style={{ background: c }} />
        ))}
      </div>
      <div className="palette-meta">
        <span className="palette-name">{palette.label}</span>
        <span className="palette-hint">{palette.hint}</span>
      </div>
      {active ? (
        <span className="palette-check">
          <Check size={12} strokeWidth={2.5} />
        </span>
      ) : null}
    </button>
  )
}

/** Right-side settings drawer: global chart color scheme. */
export function SettingsDrawer({ open, onClose }: Props) {
  const chartPaletteId = useSettingsStore((s) => s.chartPaletteId)
  const setChartPaletteId = useSettingsStore((s) => s.setChartPaletteId)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const select = (id: ChartPaletteId) => {
    setChartPaletteId(id)
  }

  return (
    <div className="drawer-root" role="dialog" aria-label="设置">
      <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
      <aside className="drawer-panel settings-drawer">
        <header className="drawer-header">
          <h3>设置</h3>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>
        <div className="drawer-body settings-drawer-body">
          <section className="settings-section">
            <h4 className="settings-section-title">图表配色</h4>
            <p className="drawer-hint">
              全局默认系列颜色，应用于未单独指定颜色的图表。偏好保存在本机。
            </p>
            <div className="palette-grid">
              {CHART_PALETTES.map((p) => (
                <PaletteCard
                  key={p.id}
                  palette={p}
                  active={chartPaletteId === p.id}
                  onSelect={() => select(p.id)}
                />
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
