import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import { Info, Sparkles } from 'lucide-react'
import type { InspirationCard, TasteVector, VariantCard } from '../types'
import { getDimensionEndpoints, getDimensionLabel } from '../taste'
import { InspirationVisual } from './InspirationVisual'
import { LivePreview } from './LivePreview'

type Card = { type: 'inspiration'; data: InspirationCard } | { type: 'variant'; data: VariantCard }

interface Props {
  card: Card
  onSwipe: (direction: 'left' | 'right' | 'up') => void
  active: boolean
}

export function SwipeCard({ card, onSwipe, active }: Props) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-14, 14])
  const likeOpacity = useTransform(x, [25, 110], [0, 1])
  const passOpacity = useTransform(x, [-110, -25], [1, 0])
  const superOpacity = useTransform(y, [-120, -35], [1, 0])
  const [flipped, setFlipped] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attrs = card.data.attrs

  function startHold() {
    if (!active) return
    holdTimer.current = setTimeout(() => setFlipped(true), 440)
  }
  function endHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current)
  }

  return (
    <motion.div
      className={`swipe-card ${flipped ? 'is-flipped' : ''}`}
      style={{ x, y, rotate, zIndex: active ? 4 : 1 }}
      drag={active && !flipped}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.86}
      whileDrag={{ scale: 1.015 }}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onDragEnd={(_, info) => {
        endHold()
        if (info.offset.y < -105) onSwipe('up')
        else if (info.offset.x > 105) onSwipe('right')
        else if (info.offset.x < -105) onSwipe('left')
      }}
    >
      <div className="swipe-card-inner">
        <div className="swipe-card-front">
          <motion.div className="swipe-verdict verdict-like" style={{ opacity: likeOpacity }}>KEEP</motion.div>
          <motion.div className="swipe-verdict verdict-pass" style={{ opacity: passOpacity }}>PASS</motion.div>
          <motion.div className="swipe-verdict verdict-super" style={{ opacity: superOpacity }}><Sparkles size={14} /> LOCK IT</motion.div>
          {card.type === 'inspiration'
            ? <InspirationVisual card={card.data} />
            : <div className="variant-visual"><div className="variant-badge"><Sparkles size={11} /> BRED FOR YOU</div><LivePreview tokens={card.data.tokens} compact /></div>
          }
          <div className="card-caption">
            <div>
              <small>{card.type === 'variant' ? 'LIVE VARIANT' : card.data.styleLabel}</small>
              <h3>{card.type === 'variant' ? 'Your interface, evolved' : card.data.title}</h3>
            </div>
            <button onClick={(event) => { event.stopPropagation(); setFlipped(true) }} aria-label="Show learned attributes"><Info size={18} /></button>
          </div>
        </div>
        <div className="swipe-card-back">
          <div className="attribute-head"><div><small>WHAT THIS TEACHES</small><h3>Design DNA</h3></div><button onClick={() => setFlipped(false)}>Done</button></div>
          <div className="attribute-list">
            {(Object.keys(attrs) as (keyof TasteVector)[]).map((dim) => {
              const [low, high] = getDimensionEndpoints(dim)
              return <div className="attribute-row" key={dim}>
                <div><b>{getDimensionLabel(dim)}</b><span>{attrs[dim] < .5 ? low : high}</span></div>
                <div className="attribute-track"><i style={{ width: `${attrs[dim] * 100}%` }} /></div>
              </div>
            })}
          </div>
          <p>Long-press any card to reveal its signals.</p>
        </div>
      </div>
    </motion.div>
  )
}
