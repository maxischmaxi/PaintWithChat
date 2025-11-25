# 🔧 Railway Deployment Fix - Health Check Failed

## Problem

Der API-Service build läuft durch, aber der Health Check schlägt fehl:

- **Symptom**: "1/1 replicas never became healthy!"
- **Health Check Path**: Wird auf `/` statt `/health` gecheckt
- **Ursache**: Falsche Railway Service-Konfiguration

## ✅ Lösung

### Schritt 1: Railway Service Settings überprüfen

1. **Öffne Railway Dashboard**
2. **Wähle dein Projekt**
3. **Klicke auf den API Service**
4. **Gehe zu Settings**

### Schritt 2: Service Settings konfigurieren

#### Root Directory

```
/
```

**NICHT** `packages/api` - Das ist wichtig!

#### Dockerfile Path

```
packages/api/Dockerfile
```

#### Health Check Path

```
/health
```

#### Health Check Timeout

```
300
```

(5 Minuten - gibt der DB Zeit zum Connecten)

### Schritt 3: Environment Variables setzen

**Wichtig**: Diese müssen VOR dem Deployment gesetzt sein!

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=<generiere mit: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
TWITCH_CLIENT_ID=<deine-twitch-client-id>
TWITCH_CLIENT_SECRET=<dein-twitch-client-secret>
TWITCH_REDIRECT_URI=https://DEINE-CONTROL-APP-URL/auth/callback
CORS_ORIGIN=https://DEINE-CONTROL-APP-URL,https://DEINE-OVERLAY-APP-URL
```

### Schritt 4: Redeploy

1. **Settings → Redeploy**
2. **Warte auf Build** (sollte ~3-4 Minuten dauern)
3. **Prüfe Logs**

## 📊 Erwartete Logs

### Successful Build Logs

```
[Region: europe-west4]
=========================
Using Detected Dockerfile
=========================

✅ Shared package built:
total 8
drwxr-xr-x ... dist

✅ API built:
total 32
drwxr-xr-x ... dist

📦 Checking built files:
packages/shared/
packages/api/
packages/api/dist/
  config/
  middleware/
  models/
  routes/
  socket/
  utils/
  index.js

====================
Starting Healthcheck
====================
Path: /health
Retry window: 5m0s

Attempt #1 succeeded!

Deployment successful!
```

### Startup Logs

```
🚀 PaintWithChat API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 HTTP Server: http://localhost:3001
🔌 WebSocket Server: ws://localhost:3001
🌍 Environment: production
🗄️  Database: mongodb://...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🐛 Troubleshooting

### Health Check schlägt immer noch fehl

**Problem**: Service startet nicht
**Lösung**:

1. Prüfe die Logs: Railway Dashboard → Service → Logs
2. Suche nach Fehlern:
   - MongoDB Connection Error?
   - Missing Environment Variables?
   - TypeScript Build Error?

### MongoDB Connection Failed

**Symptom**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Lösung**:

1. Stelle sicher, dass MongoDB Plugin installiert ist
2. Variable `MONGODB_URI=${{MongoDB.MONGO_URL}}` gesetzt?
3. MongoDB Service läuft? (grünes ✓)

### Port Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::3001`

**Lösung**:

- Das sollte in Railway nie passieren
- Wenn doch: Deployment neu starten

### Build Failed - Cannot find module

**Symptom**: `Error: Cannot find module '@paintwithchat/shared'`

**Lösung**:

1. Dockerfile korrekt? (siehe unten)
2. Root Directory = `/`?
3. Dockerfile Path = `packages/api/Dockerfile`?

## 📝 Korrekte Dockerfile-Struktur

Das API Dockerfile sollte so aussehen:

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Deps stage - Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile

# Builder stages
FROM deps AS shared-builder
COPY packages/shared ./packages/shared
RUN cd packages/shared && pnpm build

FROM shared-builder AS api-builder
COPY packages/api ./packages/api
RUN cd packages/api && pnpm build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/api/package.json ./packages/api/package.json

RUN pnpm install --frozen-lockfile --prod

COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=api-builder /app/packages/api/dist ./packages/api/dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "packages/api/dist/index.js"]
```

## 🔍 Health Check Endpoint testen

Nach erfolgreichem Deployment kannst du den Health Check manuell testen:

```bash
curl https://DEINE-API-URL/health
```

**Erwartete Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-11-25T..."
}
```

## 📚 Railway Dashboard Navigation

```
Railway Dashboard
  └─ Dein Projekt
      ├─ MongoDB (Plugin) ✅
      ├─ paintwithchat-api
      │   ├─ Settings
      │   │   ├─ Build
      │   │   │   ├─ Root Directory: /
      │   │   │   └─ Dockerfile Path: packages/api/Dockerfile
      │   │   ├─ Deploy
      │   │   │   ├─ Health Check Path: /health
      │   │   │   └─ Health Check Timeout: 300
      │   │   └─ Domains
      │   ├─ Variables
      │   └─ Logs
      ├─ paintwithchat-control
      └─ paintwithchat-overlay
```

## ✅ Deployment Checklist

- [ ] MongoDB Plugin installiert und läuft
- [ ] API Service erstellt
- [ ] Root Directory = `/`
- [ ] Dockerfile Path = `packages/api/Dockerfile`
- [ ] Health Check Path = `/health`
- [ ] Health Check Timeout = `300`
- [ ] Alle Environment Variables gesetzt
- [ ] Service deployed
- [ ] Logs zeigen erfolgreichen Start
- [ ] Health Check erfolgreich
- [ ] `/health` Endpoint antwortet

## 🚀 Next Steps

Nach erfolgreichem API-Deployment:

1. **Control App deployen**
2. **Overlay App deployen**
3. **Domains sammeln**
4. **Environment Variables aktualisieren**
5. **Services neu deployen**

Siehe: [.railway/SETUP_CHECKLIST.md](.railway/SETUP_CHECKLIST.md)

---

**Bei weiteren Problemen**: Schicke die kompletten Deployment Logs!
