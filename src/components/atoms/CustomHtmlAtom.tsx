import { useMemo } from 'react'
import type { AtomContent } from '../../types/deck'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

const DEFAULT_HTML_SAMPLE = `<div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,#eef2ff,#fce7f3);border:1px solid #c7d2fe;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;height:100%;">
  <h3 style="margin:0 0 8px;color:#3730a3;font-size:18px;">安全 HTML 卡片</h3>
  <p style="margin:0 0 12px;color:#4c1d95;font-size:13px;line-height:1.5;">静态展示用。脚本、事件与 javascript: 链接会被 DOMPurify 剥离。</p>
  <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:8px;overflow:hidden;">
    <thead>
      <tr style="background:#e0e7ff;">
        <th style="padding:8px 10px;border:1px solid #c7d2fe;text-align:left;">项</th>
        <th style="padding:8px 10px;border:1px solid #c7d2fe;text-align:left;">说明</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">渲染</td>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">消毒后的静态 HTML</td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">脚本</td>
        <td style="padding:8px 10px;border:1px solid #c7d2fe;">禁止执行</td>
      </tr>
    </tbody>
  </table>
</div>`

export function defaultCustomHtmlSample(): string {
  return DEFAULT_HTML_SAMPLE
}

export function CustomHtmlAtom({ atomContent }: { atomContent: AtomContent }) {
  const raw =
    typeof atomContent.detail.html === 'string'
      ? atomContent.detail.html
      : ''
  const html = useMemo(() => sanitizeHtml(raw), [raw])

  return (
    <div
      className="atom-custom-html"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
