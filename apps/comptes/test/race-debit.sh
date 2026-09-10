#!/usr/bin/env bash
set -euo pipefail
WALLET="${1:?wallet id}"
TOKEN="dev-service-token-comptes"
BASE="http://localhost:3001"

corr() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  else
    # fallback POSIX-ish
    cat /proc/sys/kernel/random/uuid 2>/dev/null || python3 -c 'import uuid; print(uuid.uuid4())'
  fi
}

curl -s -X POST "$BASE/accounts/$WALLET/debit" \
  -H "content-type: application/json" \
  -H "x-service-token: $TOKEN" \
  -H "x-correlation-id: $(corr)" \
  -d '{"amountMinor":80,"currency":"XOF","operationId":"race-a"}' \
  -o /tmp/race-a.json -w "%{http_code}" > /tmp/race-a.code &
curl -s -X POST "$BASE/accounts/$WALLET/debit" \
  -H "content-type: application/json" \
  -H "x-service-token: $TOKEN" \
  -H "x-correlation-id: $(corr)" \
  -d '{"amountMinor":80,"currency":"XOF","operationId":"race-b"}' \
  -o /tmp/race-b.json -w "%{http_code}" > /tmp/race-b.code &
wait
echo "A=$(cat /tmp/race-a.code) B=$(cat /tmp/race-b.code)"
echo "body-a=$(cat /tmp/race-a.json)"
echo "body-b=$(cat /tmp/race-b.json)"
curl -s "$BASE/accounts/$WALLET/balance"
echo
