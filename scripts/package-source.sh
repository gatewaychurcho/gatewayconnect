#!/usr/bin/env sh
set -eu

archive="gatewayconnect-source-$(date +%Y%m%d-%H%M%S).zip"

rm -f "$archive"
zip -r "$archive" . \
  -x "./.git/*" \
  -x "./node_modules/*" \
  -x "./dist/*" \
  -x "./.env" \
  -x "./.env.*" \
  -x "!./.env.example" \
  -x "./gatewayconnect-source-*.zip" \
  -x "./*.log" >/dev/null

zip -q "$archive" .env.example

printf 'Created %s\n' "$archive"