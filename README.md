# Taste Engine

Your visual taste, learned by reaction and compiled for Cursor.

Swipe through contrasting design directions. A 14-dimensional taste model updates locally after every gesture, breeds new versions of a live SaaS dashboard, and exports the result as `.cursor/rules/taste.mdc`.

## Run

```bash
npm install
npm run dev
```

The demo works without credentials using its built-in attributed studio corpus and local persistence.

Optional Supabase sync:

```bash
cp .env.example .env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npx supabase db push
```

## Gestures

- Swipe right: keep; move taste toward the card
- Swipe left: pass; move taste away from non-neutral attributes
- Swipe up: lock it; apply double learning weight
- Long press: inspect the 14 attributes taught by that card

After eight swipes, generated variants enter the deck. As confidence rises, their exploration range narrows. Every eighth generated cycle deliberately explores off-taste territory.

## Corpus pipeline

Place licensed or attributed images in `corpus/raw`, then run:

```bash
ANTHROPIC_API_KEY=... npm run tagging -- corpus/raw corpus/tagged.json
```

The script asks a vision model for the 14-dimensional vector and dominant hues. Keep attribution metadata when importing the output into Supabase.

## Architecture

```text
gesture → pure taste update → confidence / variance
                    ↓
             tokensFromTaste()
               ↙          ↘
       live CSS mirror    variant sampler
                    ↓
          .cursor/rules/taste.mdc
```

The swipe loop and token mapping are pure client-side math; no API is required during the live demo. Supabase adds corpus storage and session audit logs. The Anthropic API is only used in the offline corpus-tagging script.

## Demo note

The built-in cards are original CSS compositions created for Taste Engine. Any external corpus added for an event should retain source attribution and appropriate demo rights.
