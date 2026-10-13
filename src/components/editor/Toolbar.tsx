import { Link } from 'react-router-dom'
import { BrandLogo } from '../BrandLogo'
import { useDeckStore } from '../../store/useDeckStore'
import { serializeDeck } from '../../utils/serialize'

export function Toolbar() {
  const fileName = useDeckStore((s) => s.deck.fileName)
  const deck = useDeckStore((s) => s.deck)
  const replaceDeck = useDeckStore((s) => s.replaceDeck)
  const resetSample = useDeckStore((s) => s.resetSample)
  const saveDeck = useDeckStore((s) => s.saveDeck)
  const showToast = useDeckStore((s) => s.showToast)

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
    showToast('已下载 JSON')
  }

  const openFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replaceDeck(JSON.parse(String(reader.result)))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'JSON 解析失败')
      }
      e.target.value = ''
    }
    reader.onerror = () => showToast('读取文件失败')
    reader.readAsText(file)
  }

  return (
    <header className="toolbar">
      <div className="toolbar-left-cluster">
        <Link to="/" className="toolbar-brand" title="微思文稿">
          <BrandLogo size={18} />
        </Link>
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
          <li onClick={saveDeck} title="保存到本机 localStorage">
            保存
          </li>
          <li onClick={download}>下载</li>
          <li onClick={resetSample}>示例</li>
        </ul>
      </div>
      <div className="toolbar-title">{fileName}.json</div>
      <div className="toolbar-spacer" />
    </header>
  )
}
