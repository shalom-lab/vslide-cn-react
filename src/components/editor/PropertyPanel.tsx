import { useEffect, useRef } from 'react'
import {
  selectActiveAtom,
  selectActiveSlide,
  useDeckStore,
} from '../../store/useDeckStore'
import { defaultBackground, defaultEchartTitle } from '../../types/deck'
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
        <label className="field">
          模式
          <select
            value={bg.mode}
            onChange={(e) =>
              setBackground({
                ...bg,
                mode: e.target.value as typeof bg.mode,
              })
            }
          >
            <option value="pure">纯色</option>
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
            <option value="custom">自定义</option>
            <option value="image">图片</option>
            <option value="texture">纹理</option>
          </select>
        </label>
        {bg.mode === 'pure' && (
          <label className="field">
            颜色
            <input
              type="color"
              value={rgbToHex(bg.pure) || '#f9f9f9'}
              onChange={(e) =>
                setBackground({ ...bg, pure: e.target.value })
              }
            />
          </label>
        )}
        {bg.mode === 'custom' && (
          <label className="field">
            CSS
            <input
              value={bg.custom}
              onChange={(e) =>
                setBackground({ ...bg, custom: e.target.value })
              }
            />
          </label>
        )}
        {(bg.mode === 'image' || bg.mode === 'texture') && (
          <label className="field">
            图片 URL / DataURL
            <textarea
              rows={3}
              value={
                bg.mode === 'image' ? bg.image.src : bg.texture.src
              }
              onChange={(e) => {
                if (bg.mode === 'image') {
                  setBackground({
                    ...bg,
                    image: { ...bg.image, src: e.target.value },
                  })
                } else {
                  setBackground({
                    ...bg,
                    texture: { ...bg.texture, src: e.target.value },
                  })
                }
              }}
            />
          </label>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setBackground(defaultBackground())}
        >
          重置背景
        </button>
        <p className="hint">
          当前幻灯片 #{slide ? slide.y + 1 : '-'} ·{' '}
          {slide?.slideContent.length ?? 0} 个组件
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
              字号
              <input
                type="number"
                value={Number(d.fontSize) || 28}
                onChange={(e) =>
                  updateAtomDetail(activeSlideId, atom.i, {
                    fontSize: Number(e.target.value),
                  })
                }
              />
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
            <span className="hint">经 DOMPurify 消毒，不执行 JS</span>
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
