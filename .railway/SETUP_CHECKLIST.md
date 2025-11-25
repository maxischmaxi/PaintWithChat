# ✅ Railway Deployment Checklist

Folge dieser Checkliste Schritt für Schritt, um PaintWithChat auf Railway zu deployen.

## 📋 Vor dem Deployment

- [ ] **GitHub Repository erstellt** und Code gepusht
- [ ] **Railway Account** erstellt auf [railway.app](https://railway.app)
- [ ] **Twitch App erstellt** auf [dev.twitch.tv/console](https://dev.twitch.tv/console)
  - [ ] Client ID notiert
  - [ ] Client Secret notiert

## 🚀 Phase 1: Services erstellen

- [ ] **Railway Projekt erstellt**
  - [ ] New Project → Deploy from GitHub repo
  - [ ] PaintWithChat Repository ausgewählt

- [ ] **MongoDB Plugin hinzugefügt**
  - [ ] New → Database → MongoDB
  - [ ] Warten bis deployed (grünes ✓)

- [ ] **API Service erstellt**
  - [ ] New → GitHub Repo
  - [ ] Root Directory: `/`
  - [ ] Dockerfile Path: `packages/api/Dockerfile`
  - [ ] Docker Build erkannt

- [ ] **Control App Service erstellt**
  - [ ] New → GitHub Repo
  - [ ] Root Directory: `/`
  - [ ] Dockerfile Path: `packages/control-app/Dockerfile`
  - [ ] Docker Build erkannt

- [ ] **Overlay App Service erstellt**
  - [ ] New → GitHub Repo
  - [ ] Root Directory: `/`
  - [ ] Dockerfile Path: `packages/overlay-app/Dockerfile`
  - [ ] Docker Build erkannt

## 🔧 Phase 2: Environment Variables setzen (Initial)

### API Service

- [ ] **Variables → Raw Editor** geöffnet
- [ ] Folgende Variables gesetzt:
  ```
  MONGODB_URI=${{MongoDB.MONGO_URL}}
  JWT_SECRET=[GENERIERT MIT: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
  TWITCH_CLIENT_ID=[DEINE_TWITCH_CLIENT_ID]
  TWITCH_CLIENT_SECRET=[DEIN_TWITCH_CLIENT_SECRET]
  CORS_ORIGIN=https://PLACEHOLDER,https://PLACEHOLDER
  TWITCH_REDIRECT_URI=https://PLACEHOLDER/auth/callback
  NODE_ENV=production
  ```

### Control App Service

- [ ] **Variables → Raw Editor** geöffnet
- [ ] Folgende Variables gesetzt:
  ```
  VITE_API_URL=https://PLACEHOLDER
  VITE_WS_URL=wss://PLACEHOLDER
  VITE_TWITCH_CLIENT_ID=[DEINE_TWITCH_CLIENT_ID]
  VITE_TWITCH_REDIRECT_URI=https://PLACEHOLDER/auth/callback
  NODE_ENV=production
  ```

### Overlay App Service

- [ ] **Variables → Raw Editor** geöffnet
- [ ] Folgende Variables gesetzt:
  ```
  VITE_API_URL=https://PLACEHOLDER
  VITE_WS_URL=wss://PLACEHOLDER
  VITE_TWITCH_CLIENT_ID=[DEINE_TWITCH_CLIENT_ID]
  VITE_TWITCH_REDIRECT_URI=https://PLACEHOLDER/auth/callback
  NODE_ENV=production
  ```

## 📦 Phase 3: Erstes Deployment

- [ ] **Alle Services deployen**
  - [ ] API: Warten auf grünes ✓
  - [ ] Control App: Warten auf grünes ✓
  - [ ] Overlay App: Warten auf grünes ✓

- [ ] **Deployment Logs prüfen**
  - [ ] API: Keine Errors
  - [ ] Control App: Build erfolgreich
  - [ ] Overlay App: Build erfolgreich

## 🌐 Phase 4: Domains sammeln

- [ ] **API Domain kopiert**
  - [ ] Service → Settings → Domains
  - [ ] Domain notiert: `_______________________________`

- [ ] **Control App Domain kopiert**
  - [ ] Service → Settings → Domains
  - [ ] Domain notiert: `_______________________________`

- [ ] **Overlay App Domain kopiert**
  - [ ] Service → Settings → Domains
  - [ ] Domain notiert: `_______________________________`

## 🔄 Phase 5: Environment Variables aktualisieren

### API Service

- [ ] **CORS_ORIGIN aktualisiert**
  ```
  https://[CONTROL_APP_DOMAIN],https://[OVERLAY_APP_DOMAIN]
  ```
- [ ] **TWITCH_REDIRECT_URI aktualisiert**
  ```
  https://[CONTROL_APP_DOMAIN]/auth/callback
  ```

### Control App Service

- [ ] **VITE_API_URL aktualisiert**
  ```
  https://[API_DOMAIN]
  ```
- [ ] **VITE_WS_URL aktualisiert**
  ```
  wss://[API_DOMAIN]
  ```
- [ ] **VITE_TWITCH_REDIRECT_URI aktualisiert**
  ```
  https://[CONTROL_APP_DOMAIN]/auth/callback
  ```

### Overlay App Service

- [ ] **VITE_API_URL aktualisiert**
  ```
  https://[API_DOMAIN]
  ```
- [ ] **VITE_WS_URL aktualisiert**
  ```
  wss://[API_DOMAIN]
  ```
- [ ] **VITE_TWITCH_REDIRECT_URI aktualisiert**
  ```
  https://[OVERLAY_APP_DOMAIN]/auth/callback
  ```

## 🔁 Phase 6: Services neu deployen

- [ ] **API Service neu deployed**
  - [ ] Deployments → New Deployment
  - [ ] Warten auf grünes ✓

- [ ] **Control App Service neu deployed**
  - [ ] Deployments → New Deployment
  - [ ] Warten auf grünes ✓
  - [ ] **WICHTIG**: Frontend MUSS neu gebaut werden!

- [ ] **Overlay App Service neu deployed**
  - [ ] Deployments → New Deployment
  - [ ] Warten auf grünes ✓
  - [ ] **WICHTIG**: Frontend MUSS neu gebaut werden!

## 🔐 Phase 7: Twitch OAuth konfigurieren

- [ ] **Twitch Developer Console** geöffnet: [dev.twitch.tv/console](https://dev.twitch.tv/console)
- [ ] **Deine App** ausgewählt
- [ ] **OAuth Redirect URLs** hinzugefügt:
  - [ ] `https://[CONTROL_APP_DOMAIN]/auth/callback`
  - [ ] `https://[OVERLAY_APP_DOMAIN]/auth/callback`
- [ ] **Änderungen gespeichert**

## ✅ Phase 8: Deployment testen

### API Health Check

- [ ] **API Health Endpoint** geöffnet: `https://[API_DOMAIN]/health`
- [ ] **Response**: `{"status":"ok","timestamp":"..."}`

### Control App

- [ ] **Control App** geöffnet: `https://[CONTROL_APP_DOMAIN]`
- [ ] **Login-Seite** wird angezeigt
- [ ] **Login with Twitch** geklickt
- [ ] **Twitch OAuth** funktioniert
- [ ] **Zurück zur App** redirected
- [ ] **Dashboard** wird angezeigt
- [ ] **Start Session** geklickt
- [ ] **Session erstellt** (Session ID angezeigt)

### Overlay App

- [ ] **Session Link kopiert** (aus Control App)
- [ ] **Overlay** geöffnet: `https://[OVERLAY_APP_DOMAIN]?session=[SESSION_ID]`
- [ ] **"No drawer yet"** wird angezeigt (normal)
- [ ] **Hintergrund transparent** (für OBS)

### WebSocket Verbindung

- [ ] **Browser DevTools** geöffnet (F12)
- [ ] **Console** Tab
- [ ] **Keine WebSocket Errors**
- [ ] **"Connected"** Status in Control App

### Drawing Test (zukünftig)

- [ ] Drawer ausgewählt (wenn User vorhanden)
- [ ] Zeichnen funktioniert
- [ ] Overlay zeigt Zeichnung in Echtzeit

## 📊 Phase 9: Monitoring einrichten

- [ ] **Railway Logs** überprüft für jeden Service
- [ ] **Ressourcen-Limits** gesetzt:
  - [ ] API: 0.5 vCPU, 512 MB RAM
  - [ ] Control App: 0.25 vCPU, 256 MB RAM
  - [ ] Overlay App: 0.25 vCPU, 256 MB RAM
  - [ ] MongoDB: 1 vCPU, 1 GB RAM

- [ ] **Alerts** konfiguriert (optional)

## 🎉 Deployment abgeschlossen!

- [ ] **Alle Tests bestanden**
- [ ] **Deployment dokumentiert**
- [ ] **Domains notiert** für zukünftige Referenz
- [ ] **Team informiert**

---

## 📝 Notizen

**API Domain:**

```
______________________________________________________
```

**Control App Domain:**

```
______________________________________________________
```

**Overlay App Domain:**

```
______________________________________________________
```

**Deployment Datum:**

```
______________________________________________________
```

**Bekannte Probleme:**

```
______________________________________________________
______________________________________________________
______________________________________________________
```

---

## 🆘 Troubleshooting

Falls Probleme auftreten:

1. **Logs überprüfen**: Service → Logs Tab
2. **Environment Variables**: Alle Platzhalter ersetzt?
3. **Redeploy**: Frontend-Services nach Env-Änderungen?
4. **Twitch URLs**: In Developer Console registriert?
5. **WebSocket**: `wss://` statt `ws://`?
6. **CORS**: Alle Domains korrekt (kein Leerzeichen)?

**Railway Support:**

- Dokumentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app
