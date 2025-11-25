# ✅ Setup-Anleitung (Aktualisiert)

## Problem behoben!

Das Import-Problem mit `@paintwithchat/shared` wurde behoben. Die TypeScript-Interfaces werden jetzt korrekt als ESM exportiert.

## Schnellstart

```bash
# 1. Dependencies installieren
pnpm install

# 2. Shared Package builden (WICHTIG!)
cd packages/shared
pnpm build
cd ../..

# 3. MongoDB starten
docker-compose up -d

# 4. .env Dateien erstellen
cp .env.example .env
cp packages/control-app/.env.example packages/control-app/.env
cp packages/overlay-app/.env.example packages/overlay-app/.env

# 5. Twitch Credentials eintragen (siehe unten)

# 6. Alle Services starten
pnpm dev
```

## Twitch App Setup

1. Gehe zu https://dev.twitch.tv/console/apps
2. Klicke "Register Your Application"
3. **Name**: PaintWithChat (oder beliebig)
4. **OAuth Redirect URLs** (beide hinzufügen!):
   ```
   http://localhost:5173/auth/callback
   http://localhost:5174/auth/callback
   ```
5. **Category**: Application Integration
6. Klicke "Create"
7. Kopiere die **Client ID**
8. Klicke "New Secret" und kopiere das **Client Secret**

## .env Konfiguration

### Root `.env`:

```env
MONGODB_URI=mongodb://paintwithchat:paintwithchat123@localhost:27017/paintwithchat?authSource=admin
TWITCH_CLIENT_ID=hier_deine_client_id
TWITCH_CLIENT_SECRET=hier_dein_client_secret
TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
JWT_SECRET=irgendein_langes_random_secret_hier
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### `packages/control-app/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=hier_deine_client_id
VITE_TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
```

### `packages/overlay-app/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=hier_deine_client_id
VITE_TWITCH_REDIRECT_URI=http://localhost:5174/auth/callback
```

## Wichtige Hinweise

### ⚠️ Shared Package nach Änderungen neu builden!

Wenn du Änderungen am `packages/shared` Package machst, musst du es neu builden:

```bash
cd packages/shared
pnpm build
cd ../..
```

Danach Vite-Cache löschen:

```bash
rm -rf packages/control-app/node_modules/.vite
rm -rf packages/overlay-app/node_modules/.vite
```

### Ports

- **API**: 3001
- **Control App**: 5173
- **Overlay App**: 5174
- **MongoDB**: 27017
- **Mongo Express**: 8081

### Services einzeln starten

```bash
# Terminal 1 - API
cd packages/api
pnpm dev

# Terminal 2 - Control App
cd packages/control-app
pnpm dev

# Terminal 3 - Overlay App
cd packages/overlay-app
pnpm dev
```

## Troubleshooting

### "UserSession is not exported"

```bash
cd packages/shared
pnpm build
rm -rf ../control-app/node_modules/.vite ../overlay-app/node_modules/.vite
```

### MongoDB Connection Error

```bash
docker-compose ps  # Check if running
docker-compose up -d  # Start if needed
```

### Port bereits belegt

```bash
# Finde Prozess
lsof -i :3001  # oder :5173, :5174

# Beende Prozess
kill -9 <PID>
```

### Twitch OAuth Error

- Überprüfe Client ID und Secret in allen .env Dateien
- Stelle sicher dass Redirect URIs **exakt** matchen
- Keine trailing slashes (/)!

## Nach dem Setup

1. Öffne http://localhost:5173
2. Klicke "Login with Twitch"
3. Authorisiere die App
4. Klicke "Start Session"
5. Kopiere die OBS Overlay URL
6. Füge sie in OBS als Browser Source ein (1920x1080)

## Test

Teste ob alles funktioniert:

```bash
# Prüfe ob MongoDB läuft
docker-compose ps

# Prüfe API
curl http://localhost:3001/health

# Öffne Apps im Browser
# Control: http://localhost:5173
# Overlay: http://localhost:5174
```

Viel Erfolg! 🎨
