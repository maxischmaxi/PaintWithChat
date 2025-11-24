#!/bin/bash

# Script to sync Twitch Client ID from root .env to frontend .env files

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_ENV="$ROOT_DIR/.env"
CONTROL_ENV="$ROOT_DIR/packages/control-app/.env"
OVERLAY_ENV="$ROOT_DIR/packages/overlay-app/.env"

# Check if root .env exists
if [ ! -f "$ROOT_ENV" ]; then
    echo "❌ Error: Root .env not found at $ROOT_ENV"
    exit 1
fi

# Extract Client ID from root .env
CLIENT_ID=$(grep "^TWITCH_CLIENT_ID=" "$ROOT_ENV" | cut -d'=' -f2)

if [ -z "$CLIENT_ID" ]; then
    echo "❌ Error: TWITCH_CLIENT_ID not found in root .env"
    exit 1
fi

echo "📄 Found TWITCH_CLIENT_ID: ${CLIENT_ID:0:10}..."

# Update Control App .env
if [ -f "$CONTROL_ENV" ]; then
    sed -i "s/^VITE_TWITCH_CLIENT_ID=.*/VITE_TWITCH_CLIENT_ID=$CLIENT_ID/" "$CONTROL_ENV"
    echo "✅ Updated $CONTROL_ENV"
else
    echo "⚠️  Control App .env not found"
fi

# Update Overlay App .env
if [ -f "$OVERLAY_ENV" ]; then
    sed -i "s/^VITE_TWITCH_CLIENT_ID=.*/VITE_TWITCH_CLIENT_ID=$CLIENT_ID/" "$OVERLAY_ENV"
    echo "✅ Updated $OVERLAY_ENV"
else
    echo "⚠️  Overlay App .env not found"
fi

echo ""
echo "✅ Done! Frontend .env files updated with Client ID"
echo "   Please restart the frontend apps (Ctrl+C and run 'pnpm dev' again)"
