# 🚂 Railway Schnellstart für PaintWithChat

## 🎯 Ein-Klick Setup

Railway erkennt automatisch die Konfiguration dieses Projekts und erstellt alle notwendigen Services.

### Voraussetzungen

1. **GitHub Repository**: Dein PaintWithChat Code muss auf GitHub sein
2. **Railway Account**: Kostenlos registrieren auf [railway.app](https://railway.app)
3. **Twitch App**: Erstellt auf [dev.twitch.tv](https://dev.twitch.tv/console)

---

## 📋 Schritt-für-Schritt Anleitung

### 1. Repository zu Railway verbinden

1. Gehe zu [railway.app](https://railway.app)
2. Klicke auf **"New Project"**
3. Wähle **"Deploy from GitHub repo"**
4. Wähle dein **PaintWithChat Repository**

Railway erkennt automatisch:

- ✅ Monorepo-Struktur (pnpm workspaces)
- ✅ 3 Services (api, control-app, overlay-app)
- ✅ MongoDB Abhängigkeit
- ✅ Build-Konfigurationen

### 2. Services werden automatisch erstellt

Railway erstellt automatisch 4 Services:

```
📦 paintwithchat-project
├── 🍃 mongodb          (Database Plugin)
├── 🚀 api              (Backend)
├── 🎮 control-app      (Streamer Dashboard)
└── 👁️  overlay-app      (Viewer Overlay)
```

### 3. Environment Variables setzen

#### 🚀 API Service

Klicke auf den **api** Service → **Variables** → **Raw Editor**:

```env
# Database (automatisch von MongoDB Plugin)
MONGODB_URI=${{MongoDB.MONGO_URL}}

# JWT Secret (generiere einen sicheren String)
JWT_SECRET=GENERIERE_EINEN_SICHEREN_RANDOM_STRING_HIER

# Twitch OAuth (von dev.twitch.tv)
TWITCH_CLIENT_ID=deine_twitch_client_id
TWITCH_CLIENT_SECRET=dein_twitch_client_secret

# Wird später aktualisiert (nach Deploy)
TWITCH_REDIRECT_URI=https://CONTROL_APP_DOMAIN/auth/callback
CORS_ORIGIN=https://CONTROL_APP_DOMAIN,https://OVERLAY_APP_DOMAIN

# Optional
NODE_ENV=production
```

**JWT Secret generieren**:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 🎮 Control App Service

Klicke auf **control-app** → **Variables** → **Raw Editor**:

```env
# Wird später aktualisiert (nach API Deploy)
VITE_API_URL=https://API_DOMAIN
VITE_WS_URL=wss://API_DOMAIN

# Twitch OAuth
VITE_TWITCH_CLIENT_ID=deine_twitch_client_id
VITE_TWITCH_REDIRECT_URI=https://CONTROL_APP_DOMAIN/auth/callback

# Optional
NODE_ENV=production
```

#### 👁️ Overlay App Service

Klicke auf **overlay-app** → **Variables** → **Raw Editor**:

```env
# Wird später aktualisiert (nach API Deploy)
VITE_API_URL=https://API_DOMAIN
VITE_WS_URL=wss://API_DOMAIN

# Twitch OAuth
VITE_TWITCH_CLIENT_ID=deine_twitch_client_id
VITE_TWITCH_REDIRECT_URI=https://OVERLAY_APP_DOMAIN/auth/callback

# Optional
NODE_ENV=production
```

### 4. Erste Deployment

Railway deployed automatisch alle Services. Warte bis alle Services **"Success"** zeigen (grünes ✓).

### 5. Domains abrufen

Nach erfolgreichem Deployment:

1. Klicke auf **api** → **Settings** → **Domains**
   - Kopiere die Domain (z.B. `paintwithchat-api-production.up.railway.app`)

2. Klicke auf **control-app** → **Settings** → **Domains**
   - Kopiere die Domain (z.B. `paintwithchat-control-production.up.railway.app`)

3. Klicke auf **overlay-app** → **Settings** → **Domains**
   - Kopiere die Domain (z.B. `paintwithchat-overlay-production.up.railway.app`)

### 6. Environment Variables aktualisieren

Jetzt musst du die Platzhalter mit den echten Domains ersetzen:

#### 🚀 API Service aktualisieren:

```env
CORS_ORIGIN=https://paintwithchat-control-production.up.railway.app,https://paintwithchat-overlay-production.up.railway.app
TWITCH_REDIRECT_URI=https://paintwithchat-control-production.up.railway.app/auth/callback
```

#### 🎮 Control App aktualisieren:

```env
VITE_API_URL=https://paintwithchat-api-production.up.railway.app
VITE_WS_URL=wss://paintwithchat-api-production.up.railway.app
VITE_TWITCH_REDIRECT_URI=https://paintwithchat-control-production.up.railway.app/auth/callback
```

#### 👁️ Overlay App aktualisieren:

```env
VITE_API_URL=https://paintwithchat-api-production.up.railway.app
VITE_WS_URL=wss://paintwithchat-api-production.up.railway.app
VITE_TWITCH_REDIRECT_URI=https://paintwithchat-overlay-production.up.railway.app/auth/callback
```

**Wichtig**: Bei Frontend-Apps (Control App & Overlay App) werden die Environment Variables beim Build eingebacken. Du musst die Services **neu deployen**!

### 7. Services neu deployen

Nach dem Aktualisieren der Environment Variables:

1. Gehe zu jedem Service
2. Klicke auf **"Deployments"** Tab
3. Klicke auf **"New Deployment"** Button

Oder verwende die Railway CLI:

```bash
railway redeploy
```

### 8. Twitch App konfigurieren

1. Gehe zu [Twitch Developer Console](https://dev.twitch.tv/console)
2. Wähle deine App
3. Unter **"OAuth Redirect URLs"**:
   - Füge hinzu: `https://paintwithchat-control-production.up.railway.app/auth/callback`
   - Füge hinzu: `https://paintwithchat-overlay-production.up.railway.app/auth/callback`
4. Klicke **"Save"**

### 9. Testen

1. Öffne `https://paintwithchat-control-production.up.railway.app`
2. Klicke auf **"Login with Twitch"**
3. Nach erfolgreichem Login → **"Start Session"**
4. Kopiere den **OBS Overlay Link**
5. Öffne den Link in einem neuen Tab
6. Du solltest das Overlay sehen! 🎉

---

## 🔍 Deployment überprüfen

### Health Checks

Öffne in deinem Browser:

- **API**: `https://API_DOMAIN/health`
  - Sollte zurückgeben: `{"status":"ok","timestamp":"..."}`

- **Control App**: `https://CONTROL_APP_DOMAIN`
  - Sollte die Login-Seite zeigen

- **Overlay App**: `https://OVERLAY_APP_DOMAIN`
  - Sollte eine leere Seite zeigen (normal, braucht Session ID)

### Logs ansehen

Für jeden Service:

1. Klicke auf den Service
2. Gehe zum **"Logs"** Tab
3. Überprüfe auf Fehler

Oder mit Railway CLI:

```bash
railway logs
```

---

## 🛠️ Häufige Probleme

### Problem: "Cannot find module '@paintwithchat/shared'"

**Ursache**: Shared package wurde nicht gebaut

**Lösung**: Railway baut automatisch mit `railway:build` Script. Überprüfe Build-Logs.

### Problem: WebSocket funktioniert nicht

**Ursache**: Falsche URL oder CORS-Konfiguration

**Lösung**:

1. Überprüfe `VITE_WS_URL` - muss `wss://` sein (nicht `ws://`)
2. Überprüfe `CORS_ORIGIN` im API Service
3. Stelle sicher, dass alle Domains mit `https://` beginnen

### Problem: Twitch Login funktioniert nicht

**Ursache**: Redirect URI stimmt nicht überein

**Lösung**:

1. Überprüfe `TWITCH_REDIRECT_URI` in allen Services
2. Stelle sicher, dass die URI in Twitch Developer Console registriert ist
3. URI muss **exakt** übereinstimmen (inkl. Protokoll `https://`)

### Problem: Frontend zeigt leere Seite

**Ursache**: Environment Variables nicht gesetzt oder Frontend nicht neu gebaut

**Lösung**:

1. Überprüfe alle `VITE_*` Variables
2. **Redeploy** den Frontend Service (wichtig!)
3. Browser Cache leeren (Ctrl+Shift+R)

---

## 📊 Nach dem Deployment

### Monitoring

Railway zeigt automatisch:

- CPU & Memory Usage
- Network Traffic
- Build & Deploy Times
- Error Rates

### Kosten

**Railway Hobby Plan**: $5/Monat + Usage

Geschätzte Kosten für PaintWithChat:

- MongoDB: ~$5/Monat
- API: ~$5-10/Monat
- Control App: ~$2-5/Monat
- Overlay App: ~$2-5/Monat

**Total**: ~$15-25/Monat

**Tipp**: Setze Ressourcen-Limits um Kosten zu kontrollieren!

### Automatische Deployments

Railway deployed automatisch bei jedem Push zu GitHub:

```bash
git add .
git commit -m "Update feature"
git push
# Railway deployed automatisch! 🚀
```

### Custom Domains (Optional)

Wenn du eigene Domains verwenden möchtest:

1. Service → **Settings** → **Domains**
2. Klicke auf **"Custom Domain"**
3. Gib deine Domain ein (z.B. `api.paintwithchat.com`)
4. Konfiguriere DNS CNAME bei deinem Provider:
   ```
   api.paintwithchat.com → paintwithchat-api-production.up.railway.app
   ```
5. Aktualisiere alle Environment Variables mit der neuen Domain
6. Redeploy alle Services

---

## 🎯 Checkliste

Nach dem Deployment solltest du:

- [x] MongoDB Plugin hinzugefügt
- [x] API Service deployed
- [x] Control App deployed
- [x] Overlay App deployed
- [x] Alle Environment Variables gesetzt
- [x] Services mit echten Domains aktualisiert
- [x] Services neu deployed
- [x] Twitch OAuth URLs registriert
- [x] Login funktioniert
- [x] Session erstellen funktioniert
- [x] Overlay lädt

---

## 🆘 Hilfe benötigt?

1. **Railway Logs**: Jeder Service → "Logs" Tab
2. **Railway Community**: [Railway Discord](https://discord.gg/railway)
3. **Dokumentation**: [Railway Docs](https://docs.railway.app)
4. **GitHub Issues**: Erstelle ein Issue in deinem Repo

---

**Deployment erfolgreich! 🎉**

Deine PaintWithChat App läuft jetzt auf Railway!

**Nächste Schritte**:

1. Teile den Control App Link mit Streamern
2. Teste die Zeichenfunktionen
3. Überwache Logs und Metriken
4. Sammle Feedback von Benutzern

**Viel Erfolg! 🚀**
