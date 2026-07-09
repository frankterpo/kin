import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Eye, Heart, RotateCcw, Sparkles, ThumbsDown, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SEED_CORPUS } from './corpus'
import { LivePreview } from './components/LivePreview'
import { SwipeCard } from './components/SwipeCard'
import { TasteCard } from './components/TasteCard'
import { initConfidence, initTasteVector, sampleVariant, updateConfidence, updateTaste } from './taste'
import { loadInspiration, persistSession } from './supabase'
import { tokensFromTaste } from './tokens'
import type { InspirationCard, SwipeRecord, TasteVector, VariantCard } from './types'
import './App.css'

type Screen = 'intro' | 'deck' | 'mirror'
type DeckCard = { type: 'inspiration'; data: InspirationCard } | { type: 'variant'; data: VariantCard }

function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [corpus, setCorpus] = useState(SEED_CORPUS)
  const [taste, setTaste] = useState<TasteVector>(initTasteVector)
  const [confidence, setConfidence] = useState<TasteVector>(initConfidence)
  const [liked, setLiked] = useState<TasteVector[]>([])
  const [swipes, setSwipes] = useState<SwipeRecord[]>([])
  const [showTaste, setShowTaste] = useState(false)
  const [showSignals, setShowSignals] = useState(false)
  const [deckKey, setDeckKey] = useState(0)
  const sessionId = useRef(crypto.randomUUID())
  const tokens = useMemo(() => tokensFromTaste(taste), [taste])
  const swipeCount = swipes.length

  useEffect(() => {
    loadInspiration().then((remote) => {
      if (remote.length) setCorpus(remote)
    })
  }, [])

  useEffect(() => {
    if (!swipes.length) return
    const timer = setTimeout(() => persistSession(sessionId.current, taste, confidence, swipes), 350)
    return () => clearTimeout(timer)
  }, [taste, confidence, swipes])

  const currentCard = useMemo<DeckCard>(() => {
    const shouldVariant = swipeCount >= 8 && (swipeCount >= 12 || swipeCount % 2 === 0)
    if (shouldVariant) {
      const attrs = sampleVariant(taste, confidence, swipeCount > 0 && (swipeCount + 1) % 8 === 0)
      const data: VariantCard = { id: `variant-${deckKey}`, attrs, tokens: tokensFromTaste(attrs) }
      return { type: 'variant', data }
    }
    return { type: 'inspiration', data: corpus[swipeCount % corpus.length] }
  }, [confidence, corpus, deckKey, swipeCount, taste])

  const nextCard = useMemo<DeckCard>(() => {
    const index = (swipeCount + 1) % corpus.length
    return { type: 'inspiration', data: corpus[index] }
  }, [corpus, swipeCount])

  function handleSwipe(direction: 'left' | 'right' | 'up') {
    const attrs = currentCard.data.attrs
    const nextTaste = updateTaste(taste, attrs, direction, swipeCount)
    const nextLiked = direction === 'left' ? liked : [...liked, attrs]
    const record: SwipeRecord = {
      cardId: currentCard.data.id,
      cardType: currentCard.type,
      direction,
      attrs,
      timestamp: Date.now(),
    }
    setTaste(nextTaste)
    setLiked(nextLiked)
    setConfidence(updateConfidence(nextTaste, nextLiked, confidence))
    setSwipes((items) => [...items, record])
    setDeckKey((key) => key + 1)
    if (navigator.vibrate) navigator.vibrate(direction === 'up' ? [25, 35, 25] : 18)
  }

  function reset() {
    setTaste(initTasteVector())
    setConfidence(initConfidence())
    setLiked([])
    setSwipes([])
    setShowTaste(false)
    setDeckKey((key) => key + 1)
    sessionId.current = crypto.randomUUID()
  }

  const lockedDimensions = (Object.keys(confidence) as (keyof TasteVector)[])
    .sort((a, b) => confidence[b] - confidence[a])
    .slice(0, 3)
  const averageConfidence = Object.values(confidence).reduce((sum, value) => sum + value, 0) / 14

  if (screen === 'intro') {
    const defaultTokens = tokensFromTaste(initTasteVector())
    return (
      <main className="intro-screen">
        <div className="intro-nav"><div className="brand-mark"><i>TE</i><span>TASTE<br />ENGINE</span></div><small>CURSOR iOS · LONDON</small></div>
        <div className="intro-copy">
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>THE DEFAULT</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>
            This is what every<br /><em>AI-built app</em> looks like.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>
            Grey. Rounded. Forgettable. Let’s teach your agent something it can’t invent: <b>your taste.</b>
          </motion.p>
        </div>
        <motion.div className="intro-preview" initial={{ opacity: 0, scale: .96, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: .14, type: 'spring' }}>
          <LivePreview tokens={defaultTokens} />
          <div className="slop-stamp">GENERIC SLOP</div>
        </motion.div>
        <button className="start-button" onClick={() => setScreen('deck')}>Train my taste <ArrowLeft size={17} style={{ transform: 'rotate(180deg)' }} /></button>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark"><i>TE</i><span>TASTE<br />ENGINE</span></div>
        <div className="header-progress"><span>{swipeCount}<small> SWIPES</small></span><div><i style={{ width: `${Math.min(100, averageConfidence * 100)}%` }} /></div></div>
        <button className="taste-chip" onClick={() => setShowTaste(true)}><Sparkles size={13} /> MY TASTE</button>
      </header>

      {screen === 'deck' && (
        <section className="deck-screen">
          <div className="deck-heading">
            <div><span>{swipeCount < 8 ? '01 / LEARN' : '02 / BREED'}</span><h1>{swipeCount < 8 ? 'What feels right?' : 'Now it evolves.'}</h1></div>
            <button onClick={() => setScreen('mirror')}><Eye size={15} /> Mirror</button>
          </div>

          <div className="deck-stage">
            <div className="card-ghost"><SwipeCard card={nextCard} onSwipe={() => {}} active={false} /></div>
            <AnimatePresence mode="popLayout">
              <motion.div key={deckKey} className="active-card-wrap" initial={{ opacity: 0, scale: .97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .22 }}>
                <SwipeCard card={currentCard} onSwipe={handleSwipe} active />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="swipe-actions">
            <button className="pass-action" onClick={() => handleSwipe('left')}><ThumbsDown size={21} /></button>
            <button className="super-action" onClick={() => handleSwipe('up')}><WandSparkles size={22} /></button>
            <button className="like-action" onClick={() => handleSwipe('right')}><Heart size={22} /></button>
          </div>
          <p className="gesture-hint"><span>← PASS</span><span>HOLD FOR DNA</span><span>KEEP →</span></p>

          {swipeCount >= 3 && (
            <button className={`signal-dock ${showSignals ? 'expanded' : ''}`} onClick={() => setShowSignals((value) => !value)}>
              <div className="signal-dock-title"><span><i /> MODEL LEARNING LIVE</span><b>{Math.round(averageConfidence * 100)}% LOCKED</b></div>
              <div className="signal-bars">
                {lockedDimensions.map((dim) => <div key={dim}><span>{dim.replace('_', ' ')}</span><i><b style={{ width: `${confidence[dim] * 100}%` }} /></i><small>{Math.round(confidence[dim] * 100)}%</small></div>)}
              </div>
            </button>
          )}
        </section>
      )}

      {screen === 'mirror' && (
        <section className="mirror-screen">
          <div className="mirror-heading"><button onClick={() => setScreen('deck')}><ArrowLeft size={16} /> Deck</button><div><span>LIVE MIRROR</span><h1>Your app is learning.</h1></div><button onClick={reset} aria-label="Reset"><RotateCcw size={15} /></button></div>
          <div className="mirror-preview"><LivePreview tokens={tokens} /></div>
          <div className="mirror-footer"><span><i /> STYLE SYNCED</span><p>Every swipe re-derives the interface tokens.</p><button onClick={() => setScreen('deck')}>Keep swiping</button></div>
        </section>
      )}

      {showTaste && <TasteCard taste={taste} confidence={confidence} tokens={tokens} onClose={() => setShowTaste(false)} onReset={reset} />}
    </main>
  )
}

export default App
