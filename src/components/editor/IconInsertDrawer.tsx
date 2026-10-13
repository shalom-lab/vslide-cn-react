import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  Cloud,
  Compass,
  Flame,
  Globe2,
  Heart,
  Home,
  Lightbulb,
  MapPin,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useDeckStore } from '../../store/useDeckStore'

interface Props {
  open: boolean
  onClose: () => void
}

const ICON_CATALOG: { id: string; label: string; Icon: LucideIcon; color: string; paths: string }[] = [
  { id: 'sparkles', label: '亮点', Icon: Sparkles, color: '#7c3aed', paths: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>' },
  { id: 'trending', label: '趋势', Icon: TrendingUp, color: '#2563eb', paths: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>' },
  { id: 'target', label: '目标', Icon: Target, color: '#dc2626', paths: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' },
  { id: 'rocket', label: '增长', Icon: Rocket, color: '#ea580c', paths: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>' },
  { id: 'users', label: '团队', Icon: Users, color: '#0891b2', paths: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { id: 'globe', label: '全球', Icon: Globe2, color: '#0d9488', paths: '<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>' },
  { id: 'lightbulb', label: '创意', Icon: Lightbulb, color: '#ca8a04', paths: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>' },
  { id: 'shield', label: '安全', Icon: Shield, color: '#4f46e5', paths: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' },
  { id: 'award', label: '成就', Icon: Award, color: '#d97706', paths: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>' },
  { id: 'check', label: '完成', Icon: CheckCircle2, color: '#16a34a', paths: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>' },
  { id: 'zap', label: '高效', Icon: Zap, color: '#eab308', paths: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>' },
  { id: 'heart', label: '喜爱', Icon: Heart, color: '#e11d48', paths: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
  { id: 'star', label: '星标', Icon: Star, color: '#f59e0b', paths: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>' },
  { id: 'home', label: '首页', Icon: Home, color: '#64748b', paths: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' },
  { id: 'book', label: '知识', Icon: BookOpen, color: '#6366f1', paths: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3 0z"/>' },
  { id: 'cloud', label: '云端', Icon: Cloud, color: '#0ea5e9', paths: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>' },
  { id: 'map', label: '定位', Icon: MapPin, color: '#ef4444', paths: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>' },
  { id: 'bell', label: '提醒', Icon: Bell, color: '#f97316', paths: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>' },
  { id: 'activity', label: '动态', Icon: Activity, color: '#14b8a6', paths: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>' },
  { id: 'compass', label: '方向', Icon: Compass, color: '#8b5cf6', paths: '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>' },
  { id: 'flame', label: '热点', Icon: Flame, color: '#f43f5e', paths: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
  { id: 'chart', label: '图表', Icon: BarChart3, color: '#3b82f6', paths: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>' },
]

function buildIconSrc(entry: (typeof ICON_CATALOG)[number]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="${entry.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${entry.paths}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/**
 * Icon library drawer. Pick an icon, then drag on canvas to place (SVG image atom).
 */
export function IconInsertDrawer({ open, onClose }: Props) {
  const armPendingInsert = useDeckStore((s) => s.armPendingInsert)
  const [q, setQ] = useState('')

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

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return ICON_CATALOG
    return ICON_CATALOG.filter(
      (i) => i.label.includes(s) || i.id.includes(s),
    )
  }, [q])

  if (!open) return null

  return (
    <div className="drawer-root" role="dialog" aria-label="插入图标">
      <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
      <aside className="drawer-panel icon-drawer">
        <header className="drawer-header">
          <h3>图标库</h3>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>
        <div className="drawer-body">
          <p className="drawer-hint">
            先选择图标，再到画布拖框放置 · Esc 关闭
          </p>
          <input
            className="icon-search"
            placeholder="搜索图标…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="icon-grid">
            {list.map((entry) => {
              const I = entry.Icon
              return (
                <button
                  key={entry.id}
                  type="button"
                  className="icon-card"
                  title={entry.label}
                  onClick={() => {
                    armPendingInsert({
                      kind: 'icon',
                      src: buildIconSrc(entry),
                    })
                    onClose()
                  }}
                >
                  <I size={28} strokeWidth={1.75} color={entry.color} />
                  <span>{entry.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}
