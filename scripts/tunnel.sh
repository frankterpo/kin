#!/usr/bin/env bash
# Start a cloudflared quick-tunnel to expose the local pipeline at :8000
# so Meta's webhook can reach /webhook/whatsapp over HTTPS.
#
# Usage:
#   ./scripts/tunnel.sh               # forwards http://localhost:8000
#   PORT=8080 ./scripts/tunnel.sh     # pick a different local port
#
# Look for the printed https://*.trycloudflare.com URL, then set it in the
# Meta dashboard as the webhook callback URL (append /webhook/whatsapp)
# with the same WHATSAPP_VERIFY_TOKEN you put in .env.

set -euo pipefail

PORT="${PORT:-8000}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found. Install with: brew install cloudflared" >&2
  exit 1
fi

echo "== Kin WhatsApp tunnel =="
echo "Local:  http://localhost:${PORT}"
echo "Health: http://localhost:${PORT}/health"
echo
echo "Cloudflared will print a https://*.trycloudflare.com URL below."
echo "In Meta > WhatsApp > Configuration, set:"
echo "  Callback URL: <that URL>/webhook/whatsapp"
echo "  Verify token: value of WHATSAPP_VERIFY_TOKEN in .env"
echo

exec cloudflared tunnel --no-autoupdate --url "http://localhost:${PORT}"
