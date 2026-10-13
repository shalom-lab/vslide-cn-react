import { Link } from 'react-router-dom'
import { useDeckStore } from '../../store/useDeckStore'
import { serializeDeck } from '../../utils/serialize'

export function Toolbar() {
  const fileName = useDeckStore((s) => s.deck.fileName)
  const deck = useDeckStore((s) => s.deck)
  const replaceDeck = useDeckStore((s) => s.replaceDeck)
  const resetSample = useDeckStore((s) => s.resetSample)

  const download = () => {
    const payload = serializeDeck(deck)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${fileName || 'vslide'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const openFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replaceDeck(JSON.parse(String(reader.result)))
      } catch (err) {
        alert(err instanceof Error ? err.message : 'JSON 解析失败')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <header className="toolbar">
      <ul className="menu">
        <li>
          <Link to="/">首页</Link>
        </li>
        <li>
          <label className="file-label">
            打开
            <input type="file" accept=".json" onChange={openFile} hidden />
          </label>
        </li>
        <li onClick={download}>下载</li>
        <li onClick={resetSample}>示例</li>
      </ul>
      <div className="toolbar-title">{fileName}.json</div>
      <div className="toolbar-spacer" />
    </header>
  )
}
