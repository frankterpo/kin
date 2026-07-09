import { Check, Copy, Download, RotateCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import type { DesignTokens, TasteVector } from '../types'
import { getDimensionLabel } from '../taste'
import { generateTasteFile, styleName } from '../rules'

interface Props {
  taste: TasteVector
  confidence: TasteVector
  tokens: DesignTokens
  onClose: () => void
  onReset: () => void
}

export function TasteCard({ taste, confidence, tokens, onClose, onReset }: Props) {
  const [copied, setCopied] = useState(false)
  const data = useMemo(() => (Object.keys(taste) as (keyof TasteVector)[]).map((key) => ({
    dimension: getDimensionLabel(key).replace('Roundness', 'Radius').replace('Type Class', 'Type'),
    value: Math.round(taste[key] * 100),
  })), [taste])
  const file = generateTasteFile(taste, tokens)
  const confidenceScore = Math.round(Object.values(confidence).reduce((a, b) => a + b, 0) / 14 * 100)

  async function copyFile() {
    await navigator.clipboard.writeText(file)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function downloadFile() {
    const blob = new Blob([file], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'taste.mdc'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="taste-overlay">
      <div className="taste-sheet">
        <header className="taste-sheet-header">
          <div><small>YOUR VISUAL FINGERPRINT</small><h2>{styleName(taste)}</h2></div>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <div className="taste-card-main">
          <div className="radar-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,.16)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: 'rgba(255,255,255,.62)', fontSize: 8 }} />
                <Radar dataKey="value" stroke="#d9ff53" fill="#d9ff53" fillOpacity={.28} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="taste-score"><strong>{confidenceScore}%</strong><span>TASTE LOCKED</span></div>
          </div>
          <div className="taste-palette">
            <div style={{ background: `oklch(${tokens.primaryLight} ${tokens.primarySat} ${tokens.primaryHue})` }} />
            <div style={{ background: `oklch(${tokens.accentLight} ${tokens.accentSat} ${tokens.accentHue})` }} />
            <div style={{ background: tokens.colorMode === 'dark' ? '#f3f2ed' : '#161615' }} />
            <div style={{ background: tokens.colorMode === 'dark' ? '#23231f' : '#e7e6df' }} />
          </div>
          <div className="type-specimen">
            <small>TYPE PAIRING</small><strong style={{ fontFamily: tokens.fontDisplay }}>Ag</strong>
            <span><b>{tokens.fontDisplay}</b><small>Display / {tokens.fontWeightDisplay}</small></span>
            <span><b>{tokens.fontBody}</b><small>Body / {tokens.fontWeightBody}</small></span>
          </div>
        </div>

        <section className="taste-file">
          <div className="taste-file-title"><div><span>.CURSOR / RULES</span><h3>taste.mdc</h3></div><i>READY</i></div>
          <pre>{file.split('\n').slice(0, 12).join('\n')}<span>{'\n'}…</span></pre>
          <div className="taste-file-actions">
            <button className="copy-rule" onClick={copyFile}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied taste file' : 'Copy Cursor rule'}</button>
            <button onClick={downloadFile} aria-label="Download taste file"><Download size={17} /></button>
          </div>
        </section>
        <button className="reset-taste" onClick={onReset}><RotateCcw size={13} /> Start a new taste</button>
      </div>
    </div>
  )
}
