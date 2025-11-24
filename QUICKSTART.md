# 🚀 Schnellstart-Anleitung

## 1. Dependencies installieren

```bash
pnpm install
```

## 2. Shared Package builden

```bash
cd packages/shared
pnpm build
cd ../..
```

## 3. MongoDB starten

```bash
docker-compose up -d
```

Mongo Express UI: http://localhost:8081 (admin/admin)

## 4. Umgebungsvariablen konfigurieren

### Root .env erstellen:

```bash
cp .env.example .env
```

Bearbeite `.env` und füge deine Twitch Credentials ein:

```env
MONGODB_URI=mongodb://streamdraw:streamdraw123@localhost:27017/streamdraw?authSource=admin
TWITCH_CLIENT_ID=deine_twitch_client_id
TWITCH_CLIENT_SECRET=dein_twitch_client_secret
TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
JWT_SECRET=ein_sicheres_random_secret
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### Control App .env:

```bash
cp packages/control-app/.env.example packages/control-app/.env
```

Bearbeite `packages/control-app/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=deine_twitch_client_id
VITE_TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Overlay App .env:

```bash
cp packages/overlay-app/.env.example packages/overlay-app/.env
```

Bearbeite `packages/overlay-app/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=deine_twitch_client_id
VITE_TWITCH_REDIRECT_URI=http://localhost:5174/auth/callback
```

## 5. Twitch App konfigurieren

1. Gehe zu https://dev.twitch.tv/console/apps
2. Klicke "Register Your Application"
3. Name: `StreamDraw` (oder beliebig)
4. OAuth Redirect URLs:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5174/auth/callback`
5. Category: `Application Integration`
6. Kopiere `Client ID` und generiere `Client Secret`

## 6. Anwendung starten

### Option A: Alle Services parallel (empfohlen)

```bash
pnpm dev
```

### Option B: Einzeln in separaten Terminals

```bash
# Terminal 1: API
pnpm api

# Terminal 2: Control App
pnpm control

# Terminal 3: Overlay App
pnpm overlay
```

## 7. URLs

- **API**: http://localhost:3001
- **Control Panel**: http://localhost:5173
- **Overlay**: http://localhost:5174
- **MongoDB UI**: http://localhost:8081

## 8. Erste Session starten

1. Öffne http://localhost:5173
2. Klicke "Login with Twitch"
3. Authorisiere die App
4. Klicke "Start Session"
5. Kopiere die OBS Overlay URL
6. In OBS: Quelle hinzufügen → Browser → URL einfügen
   - Breite: 1920
   - Höhe: 1080
   - Häkchen bei "Control audio via OBS"

## 9. Zuschauer einladen

Teile die Overlay-URL mit deinen Zuschauern:

```
http://localhost:5174?session=DEINE_SESSION_ID
```

Die Session-ID findest du im Control Panel in der OBS Overlay URL.

## ✅ Checkliste

- [ ] `pnpm install` ausgeführt
- [ ] Shared package gebaut (`cd packages/shared && pnpm build`)
- [ ] MongoDB läuft (`docker-compose up -d`)
- [ ] Alle `.env` Dateien erstellt und konfiguriert
- [ ] Twitch App erstellt und Credentials eingetragen
- [ ] Services gestartet (`pnpm dev`)
- [ ] Control Panel im Browser geöffnet
- [ ] Mit Twitch eingeloggt
- [ ] Session gestartet

## 🐛 Häufige Probleme

### "Module not found: @streamdraw/shared"

```bash
cd packages/shared
pnpm build
```

### MongoDB Connection Error

```bash
docker-compose ps  # Prüfe ob MongoDB läuft
docker-compose logs mongodb  # Zeige Logs
```

### Twitch OAuth Error

- Überprüfe ob Client ID und Secret korrekt sind
- Stelle sicher, dass Redirect URIs exakt matchen
- Keine trailing slashes in URLs!

### Port bereits belegt

```bash
# Finde Prozess der Port belegt
lsof -i :3001  # oder :5173, :5174

# Beende Prozess
kill -9 PID
```

## 📚 Weitere Infos

- [README.md](README.md) - Vollständige Dokumentation
- [README_DOCKER.md](README_DOCKER.md) - Docker Details
