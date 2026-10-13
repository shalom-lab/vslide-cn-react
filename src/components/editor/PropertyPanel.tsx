import { useEffect, useRef } from 'react'
import {
  selectActiveAtom,
  selectActiveSlide,
  useDeckStore,
} from '../../store/useDeckStore'
import {
  defaultEchartTitle,
  resolveTableFormat,
  type TableCellAlign,
} from '../../types/deck'
import { cssBackground } from '../../utils/background'
import { canLayerAction } from '../../utils/layerOrder'

export function PropertyPanel() {
  const atom = useDeckStore(selectActiveAtom)
  const slide = useDeckStore(selectActiveSlide)
  const bg = useDeckStore((s) => s.deck.background)
  const editorFocus = useDeckStore((s) => s.editorFocus)
  const updateAtomDetail = useDeckStore((s) => s.updateAtomDetail)
  const updateAtom = useDeckStore((s) => s.updateAtom)
  const removeActiveAtom = useDeckStore((s) => s.removeActiveAtom)
  const toggleFixedActiveAtom = useDeckStore((s) => s.toggleFixedActiveAtom)
  const duplicateActiveAtom = useDeckStore((s) => s.duplicateActiveAtom)
  const reorderActiveAtom = useDeckStore((s) => s.reorderActiveAtom)
  const setBackground = useDeckStore((s) => s.setBackground)
  const activeSlideId = useDeckStore((s) => s.activeSlideId)

  const sheetRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorFocus || !atom) return
    const map = {
      sheetData: sheetRef,
      atomContent: styleRef,
      atomBorder: borderRef,
      atomAnimation: animRef,
    } as const
    const el = map[editorFocus]?.current
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [editorFocus, atom])

  if (!atom) {
    return (
      <aside className="props">
        <h3>属性</h3>
        <p className="muted">选中画布中的组件以编辑属性（右键打开菜单）</p>
        <h4>幻灯片背景</h4>
        <div
          className="bg-props-preview"
          style={{ background: cssBackground(bg) }}
          title={bg.mode}
        />
        <p className="hint">
          点顶部工具栏「背景」打开 PPT 风格模板库（预设 / 自定义 / 我的）。
        </p>
        <label className="field">
          快捷 · 纯色
          <input
            type="color"
            value={rgbToHex(bg.pure) || '#f7f4ef'}
            onChange={(e) =>
              setBackground({ ...bg, mode: 'pure', pure: e.target.value })
            }
          />
        </label>
        <p className="hint">
          当前幻灯片 #{slide ? slide.y + 1 : '-'} ·{' '}
          {slide?.slideContent.length ?? 0} 个组件 · 模式 {bg.mode}
        </p>
        <p className="hint">
          文字 rem：画布 / 播放 / 缩略图舞台按「高度÷36」设根字号，Markdown /
          标题 / HTML / 表格用 rem·em 随舞台缩放。
        </p>
      </aside>
    )
  }

  const d = atom.atomContent.detail
  const titleObj =
    d.title && typeof d.title === 'object'
      ? (d.title as { text?: string })
      : null
  const titleStr =
    typeof d.title === 'string'
      ? d.title
      : titleObj?.text
        ? String(titleObj.text)
        : ''

  return (
    <aside className="props">
      <h3>属性</h3>
      <p className="atom-meta">
        {atom.atomType} / {atom.atomContent.atomName}
        {atom.static ? ' · 已固定' : ''}
        {atom.super ? ' · super' : ''}
        {typeof atom.zIndex === 'number' ? ` · 层 ${atom.zIndex}` : ''}
      </p>

      <h4>图层</h4>
      <div className="layer-btns">
        {(
          [
            ['front', '置顶'],
            ['forward', '上移'],
            ['backward', '下移'],
            ['back', '置底'],
          ] as const
        ).map(([action, label]) => (
          <button
            key={action}
            type="button"
            className="btn-secondary layer-btn"
            disabled={
              atom.super ||
              !canLayerAction(slide?.slideContent ?? [], atom.i, action)
            }
            onClick={() => reorderActiveAtom(action)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="hint">右键菜单同样支持图层；拖动重叠组件时仍可缩放。</p>

      <div ref={styleRef}>
        {atom.atomContent.atomName === 'text-shadow' && (
          <>
            <h4>样式</h4>
            <label className="field">
              文本
              <input
                value={String(d.text ?? '')}
                onChange={(e) =>
                  updateAtomDetail(activeSlideId, atom.i, {
                    text: e.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              字号（设计 px → rem）
              <input
                type="number"
                value={Number(d.fontSize) || 28}
                onChange={(e) =>
                  updateAtomDetail(activeSlideId, atom.i, {
                    fontSize: Number(e.target.value),
                  })
                }
              />
              <span className="hint">
                相对舞台缩放：舞台字号 = 高度/36，字号按设计稿 540 高换算为 rem
              </span>
            </label>
            <label className="field">
              字体
              <input
                value={String(d.fontFamily || 'Arial')}
                onChange={(e) =>
                  updateAtomDetail(activeSlideId, atom.i, {
                    fontFamily: e.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              颜色
              <input
                type="color"
                value={rgbToHex(String(d.color || '#2c3e50')) || '#2c3e50'}
                onChange={(e) =>
                  updateAtomDetail(activeSlideId, atom.i, {
                    color: e.target.value,
                  })
                }
              />
            </label>
          </>
        )}

        {atom.atomContent.atomName === 'text-md' && (
          <label className="field">
            Markdown（支持 $公式$ / $$块公式$$）
            <textarea
              rows={12}
              value={String(d.markdown ?? '')}
              onChange={(e) =>
                updateAtomDetail(activeSlideId, atom.i, {
                  markdown: e.target.value,
                })
              }
            />
            <span className="hint">
              经 DOMPurify 消毒，不执行 JS · 正文字号跟随舞台 rem
            </span>
          </label>
        )}

        {atom.atomContent.atomName === 'custom-html' && (
          <label className="field">
            HTML 源码（安全子集）
            <textarea
              rows={14}
              value={String(d.html ?? '')}
              onChange={(e) =>
                updateAtomDetail(activeSlideId, atom.i, {
                  html: e.target.value,
                })
              }
            />
            <span className="hint">
              脚本 / 事件 / iframe / javascript: 会被剥离
            </span>
          </label>
        )}

        {atom.atomType === 'echart' && (
          <label className="field">
            标题 (title.text)
            <input
              value={titleStr}
              onChange={(e) =>
                updateAtomDetail(activeSlideId, atom.i, {
                  title: {
                    ...defaultEchartTitle(e.target.value),
                    ...(titleObj || {}),
                    text: e.target.value,
                  },
                })
              }
            />
          </label>
        )}
        {atom.atomContent.atomName === 'simple-table' &&
          (() => {
            const fmt = resolveTableFormat(d)
            const patch = (partial: Record<string, unknown>) =>
              updateAtomDetail(activeSlideId, atom.i, partial)
            return (
              <>
            <h4>表格样式</h4>
            <label className="field checkbox-field">
              <span>首行为表头</span>
              <input
                type="checkbox"
                checked={fmt.headerRow}
                onChange={(e) => patch({ headerRow: e.target.checked })}
              />
            </label>
            <label className="field checkbox-field">
              <span>表头加粗</span>
              <input
                type="checkbox"
                checked={fmt.boldHeader}
                disabled={!fmt.headerRow}
                onChange={(e) => patch({ boldHeader: e.target.checked })}
              />
            </label>
            <label className="field checkbox-field">
              <span>斑马纹</span>
              <input
                type="checkbox"
                checked={fmt.zebra}
                onChange={(e) => patch({ zebra: e.target.checked })}
              />
            </label>
            <label className="field">
              单元格对齐
              <select
                value={fmt.cellAlign}
                onChange={(e) =>
                  patch({ cellAlign: e.target.value as TableCellAlign })
                }
              >
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </label>
            <label className="field">
              表头背景
              <input
                type="color"
                value={
                  fmt.headerBackground.startsWith('#')
                    ? fmt.headerBackground.slice(0, 7)
                    : '#eef3f6'
                }
                disabled={!fmt.headerRow}
                onChange={(e) => patch({ headerBackground: e.target.value })}
              />
            </label>
            <label className="field">
              边框颜色
              <input
                type="color"
                value={
                  fmt.borderColor.startsWith('#')
                    ? fmt.borderColor.slice(0, 7)
                    : '#d0d0d0'
                }
                onChange={(e) => patch({ borderColor: e.target.value })}
              />
            </label>
            <label className="field">
              边框宽度
              <input
                type="number"
                min={0}
                max={8}
                step={1}
                value={fmt.borderWidth}
                onChange={(e) =>
                  patch({ borderWidth: Number(e.target.value) })
                }
              />
            </label>
              <p className="hint">下方 JSON 仍可直接改 sheetData（高级）。</p>
              </>
            )
          })()}
      </div>

      {(atom.atomType === 'echart' || atom.atomType === 'tables') && (
        <div
          className={'field' + (editorFocus === 'sheetData' ? ' focus-flash' : '')}
          ref={sheetRef}
        >
          <label className="field">
            数据 sheetData (JSON 二维数组)
            <textarea
              rows={8}
              value={JSON.stringify(d.sheetData ?? [], null, 2)}
              onChange={(e) => {
                try {
                  const sheetData = JSON.parse(e.target.value)
                  if (Array.isArray(sheetData)) {
                    updateAtomDetail(activeSlideId, atom.i, { sheetData })
                  }
                } catch {
                  /* ignore while typing */
                }
              }}
            />
            <span className="hint">
              nr={String(d.nr ?? '-')} · nc={String(d.nc ?? '-')}
            </span>
          </label>
        </div>
      )}

      {atom.atomType === 'images' && (
        <label className="field">
          图片 src
          <textarea
            rows={4}
            value={String(d.src ?? '')}
            onChange={(e) =>
              updateAtomDetail(activeSlideId, atom.i, { src: e.target.value })
            }
          />
        </label>
      )}

      <div ref={borderRef}>
        <h4>边框</h4>
        <label className="field">
          宽度
          <input
            type="number"
            min={0}
            value={atom.atomBorder.width}
            onChange={(e) =>
              updateAtom(activeSlideId, atom.i, {
                atomBorder: {
                  ...atom.atomBorder,
                  width: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="field">
          类型
          <select
            value={atom.atomBorder.type}
            onChange={(e) =>
              updateAtom(activeSlideId, atom.i, {
                atomBorder: { ...atom.atomBorder, type: e.target.value },
              })
            }
          >
            <option value="solid">实线</option>
            <option value="dashed">----</option>
            <option value="dotted">.....</option>
          </select>
        </label>
        <label className="field">
          颜色
          <input
            type="color"
            value={atom.atomBorder.color.startsWith('#')
              ? atom.atomBorder.color.slice(0, 7)
              : '#808080'}
            onChange={(e) =>
              updateAtom(activeSlideId, atom.i, {
                atomBorder: { ...atom.atomBorder, color: e.target.value },
              })
            }
          />
        </label>
        <label className="field">
          圆角
          <input
            type="number"
            min={0}
            value={atom.atomBorder.radius}
            onChange={(e) =>
              updateAtom(activeSlideId, atom.i, {
                atomBorder: {
                  ...atom.atomBorder,
                  radius: Number(e.target.value),
                },
              })
            }
          />
        </label>
      </div>

      <div ref={animRef}>
        <h4>动画</h4>
        <label className="field">
          出场次序 order
          <input
            type="number"
            min={1}
            value={atom.atomAnimation.order}
            onChange={(e) =>
              updateAtom(activeSlideId, atom.i, {
                atomAnimation: {
                  ...atom.atomAnimation,
                  order: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="field">
          进入 enter
          <input
            value={atom.atomAnimation.enter}
            onChange={(e) =>
              updateAtom(activeSlideId, atom.i, {
                atomAnimation: {
                  ...atom.atomAnimation,
                  enter: e.target.value,
                },
              })
            }
          />
        </label>
        <label className="field">
          离开 leave
          <input
            value={atom.atomAnimation.leave}
            onChange={(e) =>
              updateAtom(activeSlideId, atom.i, {
                atomAnimation: {
                  ...atom.atomAnimation,
                  leave: e.target.value,
                },
              })
            }
          />
        </label>
      </div>

      <div className="props-actions">
        <button type="button" className="btn-secondary" onClick={toggleFixedActiveAtom}>
          {atom.static ? '取消固定' : '固定'}
        </button>
        <button type="button" className="btn-secondary" onClick={duplicateActiveAtom}>
          复制
        </button>
        <button type="button" className="btn-danger" onClick={removeActiveAtom}>
          删除组件
        </button>
      </div>
    </aside>
  )
}

function rgbToHex(input: string): string | null {
  if (input.startsWith('#')) return input.slice(0, 7)
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
}
