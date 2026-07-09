import type { InspirationCard } from '../types'

export function InspirationVisual({ card }: { card: InspirationCard }) {
  if (card.storage_url) {
    return <img className="inspiration-image" src={card.storage_url} alt={card.title ?? 'Design inspiration'} draggable={false} />
  }

  return (
    <div className={`inspiration-art art-${card.visual ?? 'editorial'}`}>
      {card.visual === 'editorial' && <>
        <div className="art-kicker">INDEPENDENT / 024</div><h2>Shape<br />the <em>unseen.</em></h2>
        <div className="art-editorial-grid"><span>Ideas for a more considered digital culture.</span><i /></div>
        <b className="art-issue">JOURNAL—24</b>
      </>}
      {card.visual === 'candy' && <>
        <i className="candy-orb one" /><i className="candy-orb two" /><span className="candy-star">✦</span>
        <div className="candy-pill">YOUR MONEY, BUT FUN</div><h2>Save happy.</h2>
        <div className="candy-phone"><span>Good morning</span><strong>£8,420</strong><button>+ Add money</button></div>
      </>}
      {card.visual === 'terminal' && <>
        <div className="terminal-bar"><i /><i /><i /><span>taste://local</span></div>
        <code><b>$</b> build --with-intent<br /><span>Compiling interface...</span><br /><span>✓ 14 signals learned</span><br /><b>_</b></code>
        <div className="terminal-status">SYSTEM ONLINE <i /></div>
      </>}
      {card.visual === 'luxury' && <>
        <div className="luxury-mark">A</div><small>OBJECTS OF QUIET INTENTION</small>
        <h2>Form,<br /><em>refined.</em></h2><div className="luxury-line" />
        <p>Edition No. 07<br />London · Copenhagen</p>
      </>}
      {card.visual === 'brutalist' && <>
        <div className="brutal-tape">DESIGN IS A VERB ↗</div><h2>MAKE<br />NOISE</h2>
        <div className="brutal-stamp">ISSUE<br /><b>04</b></div><p>NO TEMPLATES<br />NO APOLOGIES</p>
      </>}
      {card.visual === 'glass' && <>
        <i className="glass-glow one" /><i className="glass-glow two" />
        <div className="glass-window"><div><span>◉ LUMINOUS</span><b>•••</b></div><h2>Focus,<br />beautifully.</h2><p>3 tasks in flow</p><button>Begin session →</button></div>
      </>}
      {card.visual === 'swiss' && <>
        <div className="swiss-index">01—08</div><h2>FORM<br />FOLLOWS<br /><i>FOCUS</i></h2>
        <div className="swiss-dot" /><p>International programme<br />for digital craft<br />Zürich 2026</p>
      </>}
      {card.visual === 'memphis' && <>
        <i className="memphis-circle" /><i className="memphis-zig">〰</i><i className="memphis-box" />
        <h2>PLAY<br /><span>WORKS.</span></h2><p>Serious tools for<br />unserious minds →</p>
      </>}
    </div>
  )
}
