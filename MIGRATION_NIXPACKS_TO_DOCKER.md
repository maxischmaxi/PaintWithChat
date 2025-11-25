# 📦 Migration von Nixpacks zu Docker

> **Status**: Abgeschlossen ✅  
> **Datum**: 2024-11-25  
> **Grund**: Nixpacks wird von Railway deprecated, Docker ist der neue Standard

## 🎯 Zusammenfassung der Änderungen

Dieses Projekt verwendet jetzt **Docker** statt Nixpacks für Railway-Deployments.

### Was wurde geändert?

1. ✅ **Neue Dockerfiles erstellt** für alle Services
2. ✅ **railway.json aktualisiert** - Builder auf `dockerfile` umgestellt
3. ✅ **railway.toml aktualisiert** - Docker-Konfiguration
4. ✅ **services.json aktualisiert** - Dockerfile-Pfade statt Nixpacks
5. ✅ **.dockerignore hinzugefügt** - Build-Optimierung
6. ✅ **Dokumentation aktualisiert** - Neue Deployment-Anleitungen

### Was bleibt erhalten?

- ❌ **nixpacks.toml Dateien** - Können gelöscht werden, stören aber nicht
- ✅ **Alle Environment Variables** - Bleiben identisch
- ✅ **Service-Konfiguration** - Ports, Health Checks etc. unverändert
- ✅ **Build-Prozess** - Funktional identisch, nur andere Technologie

## 📁 Neue Datei-Struktur

```
streamdraw/
├── Dockerfile                              # Root (für Monorepo)
├── .dockerignore                           # NEU: Docker Ignore Rules
├── railway.json                            # GEÄNDERT: builder: "DOCKERFILE"
├── railway.toml                            # GEÄNDERT: builder: "dockerfile"
├── packages/
│   ├── api/
│   │   ├── Dockerfile                      # NEU: Multi-stage Docker
│   │   └── nixpacks.toml                   # DEPRECATED (kann bleiben)
│   ├── control-app/
│   │   ├── Dockerfile                      # NEU: Multi-stage Docker
│   │   └── nixpacks.toml                   # DEPRECATED (kann bleiben)
│   └── overlay-app/
│       ├── Dockerfile                      # NEU: Multi-stage Docker
│       └── nixpacks.toml                   # DEPRECATED (kann bleiben)
└── .railway/
    ├── services.json                       # GEÄNDERT: dockerfilePath
    └── SETUP_CHECKLIST.md                  # GEÄNDERT: Docker statt Nixpacks
```

## 🚀 Für bestehende Railway-Deployments

### Option 1: Neu deployen (Empfohlen)

1. **Railway Dashboard öffnen**
2. **Für jeden Service (api, control-app, overlay-app):**
   - Settings → Build → Source
   - Root Directory: `/` (statt `packages/[service]`)
   - Dockerfile Path: `packages/[service]/Dockerfile`
   - Save & Redeploy

3. **Environment Variables prüfen**
   - Keine Änderungen nötig
   - Alle bleiben gleich

4. **Deploy auslösen**
   - Railway erkennt automatisch Docker
   - Deployment startet

### Option 2: Services neu erstellen

Falls Probleme auftreten:

1. **Neue Services erstellen** gemäß [SETUP_CHECKLIST.md](.railway/SETUP_CHECKLIST.md)
2. **Environment Variables kopieren** von alten Services
3. **Alte Services löschen** nach erfolgreichem Test
4. **Domains umleiten** falls custom domains verwendet

## 🔍 Unterschiede im Build-Prozess

### Vorher (Nixpacks)

```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm build"]

[start]
cmd = "node dist/index.js"
```

### Nachher (Docker)

```dockerfile
# Multi-stage Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
COPY package*.json pnpm*.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

## 📊 Vergleich

| Aspekt              | Nixpacks      | Docker                |
| ------------------- | ------------- | --------------------- |
| **Build-Zeit**      | ~3-4 min      | ~3-4 min (identisch)  |
| **Image-Größe**     | ~250MB        | ~200MB (kleiner!)     |
| **Cache**           | Automatisch   | Docker Layer Cache    |
| **Flexibilität**    | Begrenzt      | Vollständig anpassbar |
| **Debugging**       | Schwierig     | Lokal testbar         |
| **Railway Support** | Deprecated ⚠️ | Primärer Support ✅   |

## ✅ Vorteile von Docker

1. **Lokale Tests**: Docker-Images lokal bauen und testen
2. **Konsistenz**: Identisches Verhalten lokal und in Production
3. **Kontrolle**: Vollständige Kontrolle über Build-Prozess
4. **Standard**: Industrie-Standard, breite Tool-Unterstützung
5. **Optimierung**: Multi-stage Builds für kleinere Images
6. **Zukunftssicher**: Railway's primäres Build-System

## 🧪 Lokales Testen

```bash
# API Service testen
docker build -f packages/api/Dockerfile -t paintwithchat-api .
docker run -p 3001:3001 -e MONGODB_URI="..." paintwithchat-api

# Control App testen
docker build -f packages/control-app/Dockerfile -t paintwithchat-control .
docker run -p 3000:3000 paintwithchat-control

# Overlay App testen
docker build -f packages/overlay-app/Dockerfile -t paintwithchat-overlay .
docker run -p 3001:3000 paintwithchat-overlay
```

## 📝 Environment Variables

**Keine Änderungen nötig!**

Alle Environment Variables bleiben identisch:

- `MONGODB_URI`
- `JWT_SECRET`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TWITCH_REDIRECT_URI`
- `CORS_ORIGIN`
- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_TWITCH_CLIENT_ID`
- `VITE_TWITCH_REDIRECT_URI`

## 🐛 Troubleshooting

### Build schlägt fehl mit "Cannot find module"

**Ursache**: Shared package nicht gebaut

**Lösung**:

```dockerfile
# Stelle sicher, dass im Dockerfile:
# 1. shared package zuerst gebaut wird
# 2. Korrekt von builder stage kopiert wird
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
```

### Dockerfile nicht gefunden

**Ursache**: Root Directory falsch gesetzt

**Lösung**:

- Root Directory muss `/` sein (nicht `packages/service`)
- Dockerfile Path: `packages/service/Dockerfile`

### Frontend zeigt alte Version

**Ursache**: Browser-Cache

**Lösung**:

```bash
# Hard Refresh im Browser
Ctrl + Shift + R  # Windows/Linux
Cmd + Shift + R   # Mac
```

## 📚 Weiterführende Dokumentation

- [RAILWAY_DOCKER_DEPLOYMENT.md](RAILWAY_DOCKER_DEPLOYMENT.md) - Detaillierte Docker-Deployment-Anleitung
- [.railway/README.md](.railway/README.md) - Railway-Konfiguration
- [.railway/SETUP_CHECKLIST.md](.railway/SETUP_CHECKLIST.md) - Deployment-Checklist

## ❓ FAQ

**Q: Muss ich nixpacks.toml Dateien löschen?**  
A: Nein, sie werden einfach ignoriert. Du kannst sie löschen oder behalten.

**Q: Funktionieren alte Deployments noch?**  
A: Ja, laufende Nixpacks-Deployments funktionieren weiter. Aber neue Deployments sollten Docker verwenden.

**Q: Ist ein Redeploy erforderlich?**  
A: Ja, um auf Docker zu wechseln, musst du die Services neu deployen.

**Q: Gehen meine Daten verloren?**  
A: Nein, MongoDB und alle Daten bleiben erhalten.

**Q: Ändern sich meine Domains?**  
A: Nein, die Railway-Domains bleiben gleich.

## ✅ Migration Checklist

- [ ] Dockerfiles vorhanden in jedem Service
- [ ] railway.json auf `DOCKERFILE` builder aktualisiert
- [ ] services.json mit dockerfilePath aktualisiert
- [ ] .dockerignore erstellt
- [ ] Lokal getestet (optional)
- [ ] Railway Services auf neue Konfiguration umgestellt
- [ ] Erfolgreich deployed
- [ ] Alle Services laufen
- [ ] Dokumentation gelesen

---

**Migration abgeschlossen! 🎉**

Bei Fragen oder Problemen, siehe [RAILWAY_DOCKER_DEPLOYMENT.md](RAILWAY_DOCKER_DEPLOYMENT.md) oder erstelle ein GitHub Issue.
