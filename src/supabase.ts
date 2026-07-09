import { createClient } from '@supabase/supabase-js'
import type { InspirationCard, SwipeRecord, TasteVector } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && anonKey ? createClient(url, anonKey) : null

export async function loadInspiration(): Promise<InspirationCard[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('inspiration')
    .select('id, storage_url, attrs, hues, source')
    .limit(150)
  if (error) {
    console.warn('Using local corpus:', error.message)
    return []
  }
  return (data ?? []) as InspirationCard[]
}

export async function persistSession(
  sessionId: string,
  taste: TasteVector,
  confidence: TasteVector,
  swipes: SwipeRecord[],
) {
  localStorage.setItem('taste-engine-session', JSON.stringify({ sessionId, taste, confidence, swipes }))
  if (!supabase) return

  const { error } = await supabase.from('sessions').upsert({
    id: sessionId,
    taste,
    confidence,
    swipes,
    updated_at: new Date().toISOString(),
  })
  if (error) console.warn('Session persisted locally only:', error.message)
}
