# 🔧 Environment Variables Setup

## Problem: Frontend zeigt "your_twitch_client_id"

Die Frontend-Apps (Control & Overlay) haben ihre **eigenen** `.env` Dateien, die du separat konfigurieren musst!

## ✅ Lösung: Automatisches Sync-Script

### Option 1: Automatisch synchronisieren (empfohlen)

```bash
# 1. Trage deine Twitch Credentials in die Root .env ein
nano .env  # oder dein bevorzugter Editor

# 2. Führe das Sync-Script aus
pnpm sync-env

# 3. Starte die Apps neu
pnpm dev
```

Das Script kopiert automatisch die `TWITCH_CLIENT_ID` aus der Root `.env` in beide Frontend `.env` Dateien.

### Option 2: Manuell konfigurieren

#### 1. Root `.env` (für Backend):

```bash
nano .env
```

```env
MONGODB_URI=mongodb://streamdraw:streamdraw123@localhost:27017/streamdraw?authSource=admin
TWITCH_CLIENT_ID=deine_client_id_hier
TWITCH_CLIENT_SECRET=dein_client_secret_hier
TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
JWT_SECRET=ein_langes_random_secret
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

#### 2. Control App `.env`:

```bash
nano packages/control-app/.env
```

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=deine_client_id_hier  # ← WICHTIG: Gleiche wie oben!
VITE_TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
```

#### 3. Overlay App `.env`:

```bash
nano packages/overlay-app/.env
```

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=deine_client_id_hier  # ← WICHTIG: Gleiche wie oben!
VITE_TWITCH_REDIRECT_URI=http://localhost:5174/auth/callback
```

## ⚠️ Wichtig!

### Vite benötigt `VITE_` Prefix!

Frontend Environment Variables **müssen** mit `VITE_` beginnen, damit Vite sie in die App einbindet.

**Backend (.env):**

```env
TWITCH_CLIENT_ID=abc123
TWITCH_CLIENT_SECRET=xyz789
```

**Frontend (packages/\*/. env):**

```env
VITE_TWITCH_CLIENT_ID=abc123  # ← VITE_ Prefix!
```

### Nach Änderungen Frontend neu starten!

Environment Variables werden beim **Build-Zeit** eingebunden, nicht zur Laufzeit.

```bash
# Stoppe die Apps (Ctrl+C)
# Starte neu
pnpm dev
```

## 🔍 Troubleshooting

### "your_twitch_client_id" wird angezeigt

**Problem:** Die Frontend `.env` hat noch den Platzhalter-Wert.

**Lösung:**

```bash
pnpm sync-env
# Dann Apps neu starten
```

### Client ID stimmt nicht überein

**Problem:** Root `.env` und Frontend `.env` haben unterschiedliche Client IDs.

**Lösung:** Führe `pnpm sync-env` aus oder stelle sicher, dass alle drei `.env` Dateien die gleiche `TWITCH_CLIENT_ID` haben.

### Änderungen werden nicht übernommen

**Problem:** Vite lädt Environment Variables nur beim Start.

**Lösung:**

```bash
# Stoppe alle Prozesse
pkill -f vite

# Lösche Vite Cache
rm -rf packages/control-app/node_modules/.vite
rm -rf packages/overlay-app/node_modules/.vite

# Neu starten
pnpm dev
```

## 📋 Checkliste

- [ ] Root `.env` mit Twitch Credentials gefüllt
- [ ] `pnpm sync-env` ausgeführt ODER
- [ ] Frontend `.env` Dateien manuell konfiguriert
- [ ] Alle drei `.env` Dateien haben die gleiche Client ID
- [ ] Apps neu gestartet
- [ ] Im Browser öffnen: http://localhost:5173
- [ ] Twitch Login Button klicken
- [ ] Sollte jetzt zur Twitch Auth Seite mit **deiner** Client ID weiterleiten

## 🎯 Quick Check

Überprüfe ob die Client IDs übereinstimmen:

```bash
# Zeige alle Client IDs (maskiert)
echo "Root:    $(grep TWITCH_CLIENT_ID= .env | cut -d'=' -f2 | head -c 10)..."
echo "Control: $(grep VITE_TWITCH_CLIENT_ID= packages/control-app/.env | cut -d'=' -f2 | head -c 10)..."
echo "Overlay: $(grep VITE_TWITCH_CLIENT_ID= packages/overlay-app/.env | cut -d'=' -f2 | head -c 10)..."
```

Alle drei sollten **gleich** sein!
