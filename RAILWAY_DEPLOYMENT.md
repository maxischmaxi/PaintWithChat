# 🚂 Railway Deployment Guide für PaintWithChat

Dieses Dokument beschreibt, wie du PaintWithChat auf Railway deployen kannst.

## 📋 Übersicht

PaintWithChat besteht aus 4 Services, die auf Railway deployed werden:

1. **MongoDB** - Datenbank (Railway Plugin)
2. **API** - Backend Server (Express + Socket.io)
3. **Control App** - Streamer Control Panel (React SPA)
4. **Overlay App** - Viewer Overlay (React SPA)

## 🚀 Schnellstart

### 1. Railway Projekt erstellen

```bash
# Railway CLI installieren (optional)
npm install -g @railway/cli

# In Railway einloggen
railway login

# Neues Projekt erstellen
railway init
```

### 2. Services in Railway erstellen

Du musst **4 Services** in deinem Railway-Projekt erstellen:

#### Service 1: MongoDB (Database)

1. Klicke auf "New Service" → "Database" → "Add MongoDB"
2. Railway erstellt automatisch die Datenbank
3. Die `MONGODB_URI` Variable wird automatisch gesetzt

#### Service 2: API (Backend)

1. Klicke auf "New Service" → "GitHub Repo"
2. Wähle dein PaintWithChat Repository
3. **Root Directory**: `/packages/api`
4. **Build Command**: `cd ../.. && pnpm install && pnpm --filter @paintwithchat/shared build && pnpm --filter @paintwithchat/api build`
5. **Start Command**: `cd packages/api && node dist/index.js`
6. Setze folgende **Environment Variables**:

```env
# Required
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=<generiere-einen-sicheren-random-string>
TWITCH_CLIENT_ID=<deine-twitch-client-id>
TWITCH_CLIENT_SECRET=<dein-twitch-client-secret>

# Will be set after Control App deployment
TWITCH_REDIRECT_URI=https://<control-app-domain>/auth/callback

# Will be set after frontends are deployed
CORS_ORIGIN=https://<control-app-domain>,https://<overlay-app-domain>

# Optional
NODE_ENV=production
PORT=3001
```

#### Service 3: Control App (Frontend)

1. Klicke auf "New Service" → "GitHub Repo"
2. Wähle dein PaintWithChat Repository
3. **Root Directory**: `/packages/control-app`
4. **Build Command**: `cd ../.. && pnpm install && pnpm --filter @paintwithchat/shared build && pnpm --filter @paintwithchat/control-app build`
5. **Start Command**: `npx serve -s packages/control-app/dist -l $PORT`
6. Setze folgende **Environment Variables**:

```env
# Will be set after API deployment
VITE_API_URL=https://<api-domain>
VITE_WS_URL=wss://<api-domain>

# Twitch OAuth
VITE_TWITCH_CLIENT_ID=<deine-twitch-client-id>
VITE_TWITCH_REDIRECT_URI=https://<control-app-domain>/auth/callback
```

#### Service 4: Overlay App (Frontend)

1. Klicke auf "New Service" → "GitHub Repo"
2. Wähle dein PaintWithChat Repository
3. **Root Directory**: `/packages/overlay-app`
4. **Build Command**: `cd ../.. && pnpm install && pnpm --filter @paintwithchat/shared build && pnpm --filter @paintwithchat/overlay-app build`
5. **Start Command**: `npx serve -s packages/overlay-app/dist -l $PORT`
6. Setze folgende **Environment Variables**:

```env
# Will be set after API deployment
VITE_API_URL=https://<api-domain>
VITE_WS_URL=wss://<api-domain>

# Twitch OAuth
VITE_TWITCH_CLIENT_ID=<deine-twitch-client-id>
VITE_TWITCH_REDIRECT_URI=https://<overlay-app-domain>/auth/callback
```

### 3. Domain-Konfiguration

Nach dem Deployment erhältst du für jeden Service eine Railway-Domain:

- **API**: `paintwithchat-api.up.railway.app`
- **Control App**: `paintwithchat-control.up.railway.app`
- **Overlay App**: `paintwithchat-overlay.up.railway.app`

**Wichtig**: Aktualisiere nun die Environment Variables mit den echten Domains!

#### API Service aktualisieren:

```env
CORS_ORIGIN=https://paintwithchat-control.up.railway.app,https://paintwithchat-overlay.up.railway.app
TWITCH_REDIRECT_URI=https://paintwithchat-control.up.railway.app/auth/callback
```

#### Control App aktualisieren:

```env
VITE_API_URL=https://paintwithchat-api.up.railway.app
VITE_WS_URL=wss://paintwithchat-api.up.railway.app
VITE_TWITCH_REDIRECT_URI=https://paintwithchat-control.up.railway.app/auth/callback
```

#### Overlay App aktualisieren:

```env
VITE_API_URL=https://paintwithchat-api.up.railway.app
VITE_WS_URL=wss://paintwithchat-api.up.railway.app
VITE_TWITCH_REDIRECT_URI=https://paintwithchat-overlay.up.railway.app/auth/callback
```

### 4. Twitch OAuth konfigurieren

1. Gehe zu [Twitch Developer Console](https://dev.twitch.tv/console)
2. Wähle deine Anwendung
3. Füge die Redirect URIs hinzu:
   - `https://paintwithchat-control.up.railway.app/auth/callback`
   - `https://paintwithchat-overlay.up.railway.app/auth/callback`

### 5. Services neu deployen

Nach dem Aktualisieren der Environment Variables:

1. Gehe zu jedem Service in Railway
2. Klicke auf "Deploy" → "Redeploy"

## 📁 Projekt-Struktur für Railway

```
paintwithchat/
├── railway.json              # Hauptkonfiguration
├── railway.toml              # Alternative Konfiguration
├── nixpacks.toml             # Nixpacks Build-Config
├── packages/
│   ├── api/
│   │   ├── nixpacks.toml     # API-spezifische Build-Config
│   │   └── ...
│   ├── control-app/
│   │   ├── nixpacks.toml     # Control App Build-Config
│   │   └── ...
│   ├── overlay-app/
│   │   ├── nixpacks.toml     # Overlay App Build-Config
│   │   └── ...
│   └── shared/
│       └── ...
└── RAILWAY_DEPLOYMENT.md     # Diese Datei
```

## 🔧 Erweiterte Konfiguration

### Monorepo Setup

Railway erkennt automatisch pnpm workspaces. Die Build-Befehle sind so konfiguriert, dass:

1. Zuerst `packages/shared` gebaut wird
2. Dann der jeweilige Service gebaut wird
3. Dependencies korrekt aufgelöst werden

### Environment Variables Referenz

#### Shared Package (automatisch)

Keine Environment Variables nötig - wird während des Builds kompiliert.

#### API Service

| Variable               | Erforderlich | Beispiel                            | Beschreibung                            |
| ---------------------- | ------------ | ----------------------------------- | --------------------------------------- |
| `MONGODB_URI`          | ✅           | `${{MongoDB.MONGO_URL}}`            | MongoDB Verbindungs-URI                 |
| `JWT_SECRET`           | ✅           | `your-secret-key-here`              | Secret für JWT-Token                    |
| `TWITCH_CLIENT_ID`     | ✅           | `abc123...`                         | Twitch App Client ID                    |
| `TWITCH_CLIENT_SECRET` | ✅           | `xyz789...`                         | Twitch App Client Secret                |
| `TWITCH_REDIRECT_URI`  | ✅           | `https://app.com/auth/callback`     | OAuth Redirect URI                      |
| `CORS_ORIGIN`          | ✅           | `https://app1.com,https://app2.com` | Erlaubte Origins (kommagetrennt)        |
| `NODE_ENV`             | ❌           | `production`                        | Node Environment                        |
| `PORT`                 | ❌           | `3001`                              | Server Port (Railway setzt automatisch) |

#### Control App

| Variable                   | Erforderlich | Beispiel                            | Beschreibung         |
| -------------------------- | ------------ | ----------------------------------- | -------------------- |
| `VITE_API_URL`             | ✅           | `https://api.example.com`           | API Base URL         |
| `VITE_WS_URL`              | ✅           | `wss://api.example.com`             | WebSocket URL        |
| `VITE_TWITCH_CLIENT_ID`    | ✅           | `abc123...`                         | Twitch App Client ID |
| `VITE_TWITCH_REDIRECT_URI` | ✅           | `https://control.com/auth/callback` | OAuth Redirect URI   |

#### Overlay App

| Variable                   | Erforderlich | Beispiel                            | Beschreibung         |
| -------------------------- | ------------ | ----------------------------------- | -------------------- |
| `VITE_API_URL`             | ✅           | `https://api.example.com`           | API Base URL         |
| `VITE_WS_URL`              | ✅           | `wss://api.example.com`             | WebSocket URL        |
| `VITE_TWITCH_CLIENT_ID`    | ✅           | `abc123...`                         | Twitch App Client ID |
| `VITE_TWITCH_REDIRECT_URI` | ✅           | `https://overlay.com/auth/callback` | OAuth Redirect URI   |

### Custom Domains (Optional)

Wenn du eigene Domains verwenden möchtest:

1. Gehe zu Service Settings in Railway
2. Klicke auf "Settings" → "Domains"
3. Füge deine Custom Domain hinzu
4. Konfiguriere DNS bei deinem Domain-Provider:
   - **CNAME**: `your-domain.com` → `your-service.up.railway.app`
5. Aktualisiere alle Environment Variables mit den neuen Domains

## 🐛 Troubleshooting

### Build schlägt fehl

**Problem**: `Cannot find module '@paintwithchat/shared'`

**Lösung**: Stelle sicher, dass der Build-Befehl `packages/shared` zuerst baut:

```bash
cd ../.. && pnpm install && pnpm --filter @paintwithchat/shared build && pnpm --filter @paintwithchat/api build
```

### WebSocket Verbindung schlägt fehl

**Problem**: Frontend kann keine WebSocket-Verbindung herstellen

**Lösung**:

1. Überprüfe `VITE_WS_URL` - muss `wss://` (nicht `ws://`) sein
2. Überprüfe `CORS_ORIGIN` im API Service
3. Stelle sicher, dass die API läuft (Health Check: `https://api-domain/health`)

### Twitch OAuth funktioniert nicht

**Problem**: Redirect loop oder "Invalid redirect URI"

**Lösung**:

1. Überprüfe `TWITCH_REDIRECT_URI` in allen Services
2. Stelle sicher, dass die URI in der Twitch Developer Console registriert ist
3. URI muss exakt übereinstimmen (inkl. Protokoll und Trailing Slash)

### Frontend zeigt leere Seite

**Problem**: React App lädt nicht

**Lösung**:

1. Überprüfe Browser Console auf Fehler
2. Stelle sicher, dass alle `VITE_*` Environment Variables gesetzt sind
3. Frontend muss neu gebaut werden, wenn Env Vars geändert wurden (Vite baked sie in den Build ein)

### MongoDB Verbindung schlägt fehl

**Problem**: API kann keine Verbindung zur Datenbank herstellen

**Lösung**:

1. Überprüfe `MONGODB_URI` Environment Variable
2. Stelle sicher, dass MongoDB Service läuft
3. Verwende die Railway-interne Variable: `${{MongoDB.MONGO_URL}}`

## 📊 Monitoring

### Health Checks

Railway führt automatisch Health Checks durch:

- **API**: `GET /health`
  - Erwartete Antwort: `{"status":"ok","timestamp":"..."}`

### Logs ansehen

```bash
# Railway CLI
railway logs

# Oder in der Railway Web UI:
# Service auswählen → "Logs" Tab
```

### Metriken

Railway zeigt automatisch:

- CPU Usage
- Memory Usage
- Network Traffic
- Build Times
- Deployment History

## 🔄 Deployment Workflow

### Automatisches Deployment

Railway deployed automatisch bei jedem Push zu deinem GitHub Repository:

1. Code ändern und committen
2. Push zu GitHub
3. Railway erkennt Changes
4. Automatischer Build & Deploy

### Manuelles Deployment

```bash
# Mit Railway CLI
railway up

# Oder in der Railway Web UI:
# Service → "Deployments" → "Deploy"
```

### Rollback

Falls ein Deployment fehlschlägt:

1. Gehe zu Service → "Deployments"
2. Finde das letzte erfolgreiche Deployment
3. Klicke auf "..." → "Rollback to this deployment"

## 💰 Kosten-Optimierung

### Railway Pricing

- **Hobby Plan**: $5/Monat + Usage
- **Pro Plan**: $20/Monat + Usage

### Ressourcen-Limits

Setze Ressourcen-Limits für jeden Service:

1. Service Settings → "Resources"
2. Setze CPU/Memory Limits:
   - **API**: 0.5 vCPU, 512 MB RAM
   - **Control App**: 0.25 vCPU, 256 MB RAM
   - **Overlay App**: 0.25 vCPU, 256 MB RAM
   - **MongoDB**: 1 vCPU, 1 GB RAM

### Sleep Mode (Hobby Plan)

Services schlafen nach Inaktivität:

- Setzt Environment Variable: `RAILWAY_SLEEP_MODE=true`
- Services wachen bei Request auf
- Nicht empfohlen für Production

## 🔐 Sicherheit

### Secrets Management

**Wichtig**: Speichere niemals Secrets im Code!

✅ **Gut**: Environment Variables in Railway
❌ **Schlecht**: Hardcoded in `.env` Files

### JWT Secret generieren

```bash
# Sichere Random String generieren
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### CORS konfigurieren

Setze nur notwendige Origins:

```env
CORS_ORIGIN=https://control-app.com,https://overlay-app.com
```

Niemals: `CORS_ORIGIN=*`

## 📚 Weiterführende Links

- [Railway Docs](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Nixpacks](https://nixpacks.com/)
- [Twitch Developer Console](https://dev.twitch.tv/console)

## 🆘 Support

Bei Problemen:

1. Überprüfe die Logs in Railway
2. Teste lokal mit `pnpm dev`
3. Überprüfe alle Environment Variables
4. Erstelle ein GitHub Issue

---

**Viel Erfolg beim Deployment! 🚀**

## 🏥 Health Checks

### API Health Check Endpoints

Die API bietet mehrere Health Check Endpoints:

#### Basic Health Check (verwendet von Railway)
```
GET /health
Response: {"status":"ok","timestamp":"..."}
```

Railway verwendet diesen Endpoint automatisch:
- Interval: Alle 30 Sekunden
- Timeout: 10 Sekunden
- Failure Threshold: 3 Fehler → Service Restart

#### Detailed Health Check
```
GET /health/detailed
Response: {
  "status": "healthy",
  "database": {"connected": true},
  "memory": {...},
  "uptime": 3600
}
```

Verwende diesen für:
- Monitoring Dashboards
- Debugging
- Status Pages

#### Weitere Endpoints
- `GET /health/ready` - Bereitschafts-Check (inkl. DB)
- `GET /health/live` - Prozess-Lebenszeichen

**Mehr Details**: Siehe `packages/api/HEALTH_CHECKS.md`

### Railway Health Check Konfiguration

Die Health Checks sind bereits konfiguriert in:
- `.railway/services.json` - Service-spezifische Config
- `packages/api/nixpacks.toml` - Nixpacks Health Check Config
- `railway.json` - Globale Railway Config

Keine manuelle Konfiguration nötig - Railway erkennt `/health` automatisch!

