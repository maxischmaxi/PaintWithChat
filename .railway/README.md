# 🚂 Railway Deployment Konfiguration

Dieses Verzeichnis enthält alle Konfigurationsdateien für das Deployment von PaintWithChat auf Railway.

## 📁 Dateien-Übersicht

```
.railway/
├── README.md                    # Diese Datei
├── services.json                # Service-Definitionen für Railway
├── railway-env-template.txt     # Environment Variables Vorlage
└── SETUP_CHECKLIST.md           # Schritt-für-Schritt Checklist
```

## 🚀 Schnellstart

1. **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Komplette Schritt-für-Schritt Anleitung
2. **[services.json](services.json)** - Wird automatisch von Railway erkannt
3. **[railway-env-template.txt](railway-env-template.txt)** - Kopiere Environment Variables von hier

## 📚 Zusätzliche Dokumentation

- **[../RAILWAY_QUICKSTART.md](../RAILWAY_QUICKSTART.md)** - Schnelleinstieg Guide
- **[../RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md)** - Detaillierte Deployment-Dokumentation
- **[../README.md](../README.md)** - Hauptdokumentation des Projekts

## 🎯 Was macht Railway automatisch?

Wenn du dein Repository mit Railway verbindest, erkennt Railway automatisch:

### ✅ Monorepo-Struktur

- Erkennt `pnpm-workspace.yaml`
- Installiert Dependencies korrekt
- Baut `packages/shared` zuerst

### ✅ Service-Definitionen

- Liest `services.json`
- Erstellt 3 Services automatisch:
  - 🚀 **api** (Backend)
  - 🎮 **control-app** (Streamer Dashboard)
  - 👁️ **overlay-app** (Viewer Overlay)

### ✅ Build-Konfigurationen

- Verwendet Nixpacks für jeden Service
- Liest Service-spezifische `nixpacks.toml` Dateien:
  - `packages/api/nixpacks.toml`
  - `packages/control-app/nixpacks.toml`
  - `packages/overlay-app/nixpacks.toml`

### ✅ MongoDB Plugin

- Schlägt automatisch MongoDB vor
- Setzt `MONGODB_URI` Environment Variable

## 🔧 Service-Konfigurationen

### 1. API Service

**Location**: `packages/api/`

**Build Process**:

```bash
1. pnpm install --frozen-lockfile
2. Build packages/shared
3. Build packages/api
```

**Start Command**:

```bash
node dist/index.js
```

**Required Environment Variables**:

- `MONGODB_URI`
- `JWT_SECRET`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TWITCH_REDIRECT_URI`
- `CORS_ORIGIN`

**Health Check**: `/health`

---

### 2. Control App Service

**Location**: `packages/control-app/`

**Build Process**:

```bash
1. pnpm install --frozen-lockfile
2. Build packages/shared
3. Build packages/control-app (Vite)
```

**Start Command**:

```bash
npx serve -s dist -l $PORT
```

**Required Environment Variables**:

- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_TWITCH_CLIENT_ID`
- `VITE_TWITCH_REDIRECT_URI`

**Important**: VITE\_\* variables are baked into build. Redeploy after changes!

---

### 3. Overlay App Service

**Location**: `packages/overlay-app/`

**Build Process**:

```bash
1. pnpm install --frozen-lockfile
2. Build packages/shared
3. Build packages/overlay-app (Vite)
```

**Start Command**:

```bash
npx serve -s dist -l $PORT
```

**Required Environment Variables**:

- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_TWITCH_CLIENT_ID`
- `VITE_TWITCH_REDIRECT_URI`

**Important**: VITE\_\* variables are baked into build. Redeploy after changes!

---

## 🔄 Deployment Workflow

### Initial Deployment

```
1. Connect GitHub Repo to Railway
2. Railway erkennt services.json
3. Services werden automatisch erstellt
4. Environment Variables setzen
5. Services deployen
6. Domains kopieren
7. Environment Variables mit echten Domains aktualisieren
8. Services NEU deployen
```

### Updates deployen

Railway deployed automatisch bei jedem Git Push:

```bash
git add .
git commit -m "Update feature"
git push
# Railway deployed automatisch! 🚀
```

### Manuelles Deployment

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Login
railway login

# Service auswählen und deployen
railway up
```

## 🌐 Domain-Konfiguration

### Standard Railway Domains

Nach dem Deployment erhältst du automatisch:

```
API:         https://paintwithchat-api-production.up.railway.app
Control App: https://paintwithchat-control-production.up.railway.app
Overlay App: https://paintwithchat-overlay-production.up.railway.app
```

### Custom Domains (Optional)

1. Service → Settings → Domains → Custom Domain
2. DNS CNAME konfigurieren:
   ```
   api.yourdomain.com → paintwithchat-api-production.up.railway.app
   ```
3. Environment Variables aktualisieren
4. Services neu deployen

## 🔐 Environment Variables Best Practices

### ✅ DO

- Verwende Railway Variables für Secrets
- Generiere sichere JWT Secrets
- Nutze `${{MongoDB.MONGO_URL}}` für DB-URI
- Setze `NODE_ENV=production`

### ❌ DON'T

- Niemals Secrets im Code
- Keine `.env` Dateien committen
- Keine Wildcards in CORS (`*`)
- Frontend Envs nicht vergessen zu aktualisieren

## 📊 Monitoring

### Logs ansehen

**Railway Web UI**:

1. Service auswählen
2. "Logs" Tab

**Railway CLI**:

```bash
railway logs
```

### Metriken

Railway Dashboard zeigt automatisch:

- CPU Usage
- Memory Usage
- Network Traffic
- Request Count
- Error Rate

### Health Checks

Railway prüft automatisch:

- **API**: `GET /health` → `{"status":"ok"}`
- **Frontend**: `GET /` → HTTP 200

## 💰 Kosten-Schätzung

**Railway Hobby Plan**: $5/Monat + Usage

**Geschätzte monatliche Kosten**:

```
MongoDB:      ~$5-10
API:          ~$5-10
Control App:  ~$2-5
Overlay App:  ~$2-5
─────────────────────
Total:        ~$15-30/Monat
```

**Optimierung**:

- Setze Ressourcen-Limits
- Nutze Sleep Mode (Hobby Plan)
- Überwache Usage regelmäßig

## 🛠️ Troubleshooting

### Build schlägt fehl

**Error**: `Cannot find module '@paintwithchat/shared'`

**Fix**:

```bash
# Check build order in nixpacks.toml
# Ensure packages/shared builds first
cd /app/packages/shared && pnpm build
```

### WebSocket Connection Failed

**Error**: Frontend kann keine WebSocket-Verbindung herstellen

**Fix**:

1. Check `VITE_WS_URL` - muss `wss://` sein
2. Check `CORS_ORIGIN` im API Service
3. Verify API läuft: `https://api-domain/health`

### Twitch OAuth Loop

**Error**: Redirect loop nach Twitch Login

**Fix**:

1. Check `TWITCH_REDIRECT_URI` in allen Services
2. Verify URI in Twitch Developer Console
3. URI muss exakt matchen (inkl. `https://`)

### Frontend zeigt leere Seite

**Error**: React App lädt nicht

**Fix**:

1. Browser Console checken
2. Alle `VITE_*` Variables gesetzt?
3. **REDEPLOY** Frontend Service (wichtig!)
4. Browser Cache leeren (Ctrl+Shift+R)

## 🔗 Nützliche Links

- **Railway Docs**: https://docs.railway.app
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Nixpacks**: https://nixpacks.com
- **Twitch Developer**: https://dev.twitch.tv/console

## 📞 Support

Bei Problemen:

1. **Logs checken**: Railway UI → Service → Logs
2. **Lokal testen**: `pnpm dev`
3. **Environment Variables**: Alle gesetzt?
4. **GitHub Issue**: Erstelle Issue in deinem Repo
5. **Railway Support**: Discord oder Docs

## ✅ Deployment Checklist

Schneller Überblick:

- [ ] Repository mit Railway verbunden
- [ ] MongoDB Plugin hinzugefügt
- [ ] Alle 3 Services erstellt
- [ ] Environment Variables gesetzt
- [ ] Services deployed
- [ ] Domains kopiert
- [ ] Env Vars mit Domains aktualisiert
- [ ] Services NEU deployed
- [ ] Twitch OAuth URLs registriert
- [ ] Login funktioniert
- [ ] Session erstellen funktioniert
- [ ] Overlay lädt

**Detaillierte Checklist**: [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)

---

**Viel Erfolg beim Deployment! 🚀**

Bei Fragen oder Problemen, siehe die detaillierte Dokumentation oder erstelle ein GitHub Issue.
