import { ArrowUpRight, Bell, ChevronDown, Command, MoreHorizontal, Plus, Search, Sparkles, TrendingUp } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { DesignTokens } from '../types'
import { tokensToCSSVariables } from '../tokens'

interface Props {
  tokens: DesignTokens
  compact?: boolean
}

export function LivePreview({ tokens, compact = false }: Props) {
  const vars = tokensToCSSVariables(tokens) as CSSProperties
  return (
    <div
      className={`preview-shell ${compact ? 'preview-compact' : ''} ${tokens.gradientsEnabled ? 'has-gradient' : ''} ${tokens.textureEnabled ? 'has-texture' : ''}`}
      style={vars}
    >
      <div className="preview-noise" />
      <aside className="preview-sidebar">
        <div className="preview-logo"><Command size={15} /><b>FORMA</b></div>
        <nav>
          <span className="active"><span>◈</span> Overview</span>
          <span><span>◫</span> Projects</span>
          <span><span>◎</span> Analytics</span>
          <span><span>◇</span> Team</span>
        </nav>
        <div className="preview-profile"><i>LM</i><div><b>Leah M.</b><small>Design lead</small></div></div>
      </aside>

      <main className="preview-main">
        <header>
          <label><Search size={13} /><span>Search anything...</span></label>
          <button aria-label="Notifications"><Bell size={14} /></button>
          <button className="preview-avatar">LM</button>
        </header>

        <section className="preview-content">
          <div className="preview-title-row">
            <div><small>MONDAY, 13 OCT</small><h2>Good morning, Leah.</h2><p>Here’s what’s happening across your workspace.</p></div>
            <button className="preview-primary"><Plus size={13} /> New project</button>
          </div>

          <div className="preview-stats">
            {[
              ['Revenue', '$48.2k', '+12.4%'],
              ['Active users', '12,842', '+8.2%'],
              ['Conversion', '4.82%', '+1.1%'],
            ].map(([label, value, change], index) => (
              <article key={label}>
                <div><span>{label}</span><MoreHorizontal size={13} /></div>
                <strong>{value}</strong>
                <small className={index === 2 ? 'accent-dot' : ''}><TrendingUp size={10} /> {change}</small>
              </article>
            ))}
          </div>

          <div className="preview-grid">
            <article className="preview-chart">
              <div className="preview-card-head"><div><b>Performance</b><small>Last 6 months</small></div><button>Monthly <ChevronDown size={10} /></button></div>
              <div className="chart-bars">
                {[32, 46, 39, 68, 55, 83, 72, 91, 62, 78, 86, 96].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
              </div>
              <div className="chart-labels"><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span></div>
            </article>
            <article className="preview-activity">
              <div className="preview-card-head"><div><b>Recent activity</b><small>Live updates</small></div><Sparkles size={14} /></div>
              {[
                ['AN', 'New campaign launched', '2m'],
                ['JK', 'Homepage approved', '18m'],
                ['RB', 'Report exported', '1h'],
              ].map(([initials, event, time]) => (
                <div className="activity-item" key={event}><i>{initials}</i><span><b>{event}</b><small>Workspace update</small></span><small>{time}</small></div>
              ))}
              <button className="view-all">View all activity <ArrowUpRight size={11} /></button>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
