# 🚂 Railway Deployment - Dateiübersicht

> ⚠️ **IMPORTANT UPDATE (2024-11-25)**: Projekt verwendet jetzt **Docker** statt Nixpacks!

Komplette Railway-Konfiguration für PaintWithChat mit Docker-Support!

## 📂 Dateistruktur

```
paintwithchat/
├── 📁 .railway/                          Railway Konfigurationsverzeichnis
│   ├── README.md                         Übersicht aller Konfigurationen
│   ├── services.json                     Service-Definitionen (Docker)
│   ├── railway-env-template.txt          Environment Variables Kopiervorlage
│   └── SETUP_CHECKLIST.md                Schritt-für-Schritt Deployment Guide
│
├── 📁 Root-Level Konfigurationen
│   ├── railway.json                      Railway Hauptkonfiguration (Docker)
│   ├── railway.toml                      Alternative TOML-Konfiguration (Docker)
│   ├── Dockerfile                        Root Dockerfile (Monorepo)
│   ├── .dockerignore                     Docker Ignore Rules
│   ├── nixpacks.toml                     ⚠️ DEPRECATED
│   └── .railwayignore                    Deployment Ignore-Datei
│
├── 📁 Dokumentation
│   ├── RAILWAY_DOCKER_DEPLOYMENT.md      ⭐ Docker Deployment Guide
│   ├── MIGRATION_NIXPACKS_TO_DOCKER.md   Migration Guide
│   ├── RAILWAY_QUICKSTART.md             Schnelleinstieg
│   ├── RAILWAY_DEPLOYMENT.md             Deployment-Dokumentation
│   └── RAILWAY_FILES_SUMMARY.md          Diese Datei
│
└── 📁 Service-spezifische Konfigurationen
    ├── packages/api/Dockerfile           ✅ API Docker Build
    ├── packages/api/nixpacks.toml        ⚠️ DEPRECATED
    ├── packages/control-app/Dockerfile   ✅ Control App Docker Build
    ├── packages/control-app/nixpacks.toml ⚠️ DEPRECATED
    ├── packages/overlay-app/Dockerfile   ✅ Overlay App Docker Build
    └── packages/overlay-app/nixpacks.toml ⚠️ DEPRECATED
```

## 🎯 Quick Links

### Für sofortiges Deployment

👉 **[RAILWAY_QUICKSTART.md](RAILWAY_QUICKSTART.md)** - Starte hier!

### Für detaillierte Informationen

📖 **[RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)** - Vollständige Doku

### Für Schritt-für-Schritt Anleitung

✅ **[.railway/SETUP_CHECKLIST.md](.railway/SETUP_CHECKLIST.md)** - Checklist

### Für Environment Variables

📋 **[.railway/railway-env-template.txt](.railway/railway-env-template.txt)** - Env Vars

## 🚀 Was wurde konfiguriert?

Railway wird automatisch folgende Services erkennen und erstellen:

### 1. 🍃 MongoDB (Database Plugin)

- Automatisch vorgeschlagen beim ersten Deployment
- `MONGO_URL` wird automatisch als Environment Variable gesetzt
- Version: 8.0

### 2. 🚀 API (Backend Service)

- **Location**: `packages/api/`
- **Build**: Nixpacks mit custom config
- **Start**: `node dist/index.js`
- **Health Check**: `/health`
- **Env Vars**: 6 required

### 3. 🎮 Control App (Frontend - Streamer Dashboard)

- **Location**: `packages/control-app/`
- **Build**: Vite → Static files
- **Start**: `serve -s dist`
- **Env Vars**: 4 required (VITE\_\*)

### 4. 👁️ Overlay App (Frontend - Viewer Overlay)

- **Location**: `packages/overlay-app/`
- **Build**: Vite → Static files
- **Start**: `serve -s dist`
- **Env Vars**: 4 required (VITE\_\*)

## 📋 Deployment in 7 Schritten

1. **Git Push**

   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push
   ```

2. **Railway verbinden**
   - Gehe zu https://railway.app
   - New Project → Deploy from GitHub repo
   - Wähle dein PaintWithChat Repository

3. **Services werden automatisch erstellt**
   - Railway liest `.railway/services.json`
   - Erstellt 3 Services + MongoDB Plugin

4. **Environment Variables setzen**
   - Kopiere aus `.railway/railway-env-template.txt`
   - Setze in jedem Service

5. **Erstes Deployment abwarten**
   - Warte auf grünes ✓ bei allen Services

6. **Domains kopieren & Env Vars aktualisieren**
   - Kopiere Railway-Domains
   - Aktualisiere Environment Variables mit echten Domains
   - **WICHTIG**: Frontend Services NEU deployen!

7. **Twitch OAuth & Testen**
   - Registriere Redirect URIs in Twitch Developer Console
   - Teste Login, Session, Overlay

## 🔧 Wichtige Konfigurationsdateien

### `.railway/services.json` ⭐ WICHTIGSTE DATEI

Diese Datei wird von Railway automatisch erkannt und definiert alle Services:

- Service-Namen und Icons
- Root Directories
- Build Commands
- Start Commands
- Health Checks
- Required Environment Variables
- MongoDB Plugin

### `nixpacks.toml` Dateien

Definieren Build-Prozess für jeden Service:

- **Root**: Monorepo-Level Config
- **API**: Backend Build-Steps
- **Control App**: Frontend Build (Vite)
- **Overlay App**: Frontend Build (Vite)

### `.railwayignore`

Definiert was NICHT deployed wird:

- node_modules
- .env Dateien
- Build Artifacts
- Development Tools

## 🎓 Wichtige Konzepte

### Monorepo Support

Railway erkennt automatisch:

- `pnpm-workspace.yaml`
- Shared packages (`@paintwithchat/shared`)
- Build-Reihenfolge (shared → services)

### Environment Variables

**Backend (API)**:

- Normale Env Vars
- Runtime verfügbar
- Änderungen → Redeploy automatisch

**Frontend (Vite)**:

- `VITE_*` Variablen
- **WIRD IN BUILD EINGEBAUT!**
- Änderungen → **MANUELLER REDEPLOY ERFORDERLICH!**

### Health Checks

Railway prüft automatisch:

- API: `GET /health` → `{"status":"ok"}`
- Frontend: `GET /` → HTTP 200

## 🛠️ Häufige Aufgaben

### Environment Variable ändern

**API (Backend)**:

1. Service → Variables → Variable ändern
2. Speichern
3. ✅ Automatischer Redeploy

**Frontend (Control/Overlay)**:

1. Service → Variables → Variable ändern
2. Speichern
3. ⚠️ **MANUELL** Service neu deployen!

### Logs ansehen

```bash
# Railway CLI
railway logs

# Oder: Service → Logs Tab in Railway UI
```

### Rollback durchführen

1. Service → Deployments
2. Letztes erfolgreiches Deployment finden
3. "..." → "Rollback to this deployment"

### Custom Domain hinzufügen

1. Service → Settings → Domains
2. Custom Domain → Domain eingeben
3. DNS CNAME konfigurieren
4. Environment Variables aktualisieren
5. Services neu deployen

## ⚠️ Wichtige Warnungen

### 🔴 Frontend MUSS neu deployed werden nach Env Var Änderungen!

VITE\_\* Variablen werden beim BUILD in den Code eingebaut. Änderungen sind erst nach Redeploy aktiv!

### 🔴 WebSocket URL muss wss:// sein

In Production `wss://` verwenden, nicht `ws://`

### 🔴 CORS_ORIGIN: Keine Leerzeichen!

Korrekt: `https://app1.com,https://app2.com`
Falsch: `https://app1.com, https://app2.com`

### 🔴 Twitch Redirect URIs registrieren

Alle Redirect URIs müssen in der Twitch Developer Console registriert sein!

## 📚 Weitere Dokumentation

| Dokument                              | Zweck             | Wann lesen?                     |
| ------------------------------------- | ----------------- | ------------------------------- |
| **RAILWAY_QUICKSTART.md**             | Schneller Start   | Für erstes Deployment           |
| **RAILWAY_DEPLOYMENT.md**             | Detaillierte Doku | Bei Problemen / für Verständnis |
| **.railway/SETUP_CHECKLIST.md**       | Step-by-Step      | Während Deployment              |
| **.railway/railway-env-template.txt** | Env Vars Vorlage  | Beim Setzen der Variables       |
| **.railway/README.md**                | Config Übersicht  | Für technische Details          |

## 🎯 Nächste Schritte

1. ✅ Lies **RAILWAY_QUICKSTART.md**
2. ✅ Folge der **SETUP_CHECKLIST.md**
3. ✅ Verwende **railway-env-template.txt** für Env Vars
4. ✅ Bei Problemen: **RAILWAY_DEPLOYMENT.md** → Troubleshooting

## 🆘 Support

**Bei Problemen**:

1. Checke `.railway/SETUP_CHECKLIST.md`
2. Siehe `RAILWAY_DEPLOYMENT.md` → Troubleshooting
3. Railway Logs überprüfen
4. Railway Discord: https://discord.gg/railway

---

**Alles bereit für Railway Deployment! 🚀**

Railway wird beim Verbinden mit deinem Repository automatisch:

- ✅ services.json erkennen
- ✅ 3 Services erstellen
- ✅ MongoDB Plugin vorschlagen
- ✅ Nixpacks für Build verwenden
- ✅ Health Checks konfigurieren

**Du musst nur noch Environment Variables setzen und deployen!**
