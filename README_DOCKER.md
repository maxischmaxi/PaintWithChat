# 🐳 Docker Setup für StreamDraw

## MongoDB mit Docker Compose

Die `docker-compose.yml` startet automatisch:

- **MongoDB** auf Port `27017`
- **Mongo Express** (Web UI) auf Port `8081`

### MongoDB starten

```bash
# MongoDB Container starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Status prüfen
docker-compose ps

# MongoDB stoppen
docker-compose down

# MongoDB stoppen und Daten löschen
docker-compose down -v
```

### Verbindungsdetails

**MongoDB Connection String:**

```
mongodb://streamdraw:streamdraw123@localhost:27017/streamdraw?authSource=admin
```

**Zugangsdaten:**

- Username: `streamdraw`
- Password: `streamdraw123`
- Database: `streamdraw`
- Port: `27017`

### Mongo Express (Web UI)

Nach dem Start der Container kannst du die Datenbank im Browser verwalten:

**URL:** http://localhost:8081

**Login:**

- Username: `admin`
- Password: `admin`

### Verwendung in der Anwendung

1. **Kopiere die .env Datei:**

```bash
cp .env.example .env
```

2. **Setze die MongoDB URI in `.env`:**

```env
MONGODB_URI=mongodb://streamdraw:streamdraw123@localhost:27017/streamdraw?authSource=admin
```

3. **Starte die Anwendung:**

```bash
pnpm dev
```

### Daten-Persistierung

Die MongoDB-Daten werden in Docker Volumes gespeichert:

- `mongodb_data` - Datenbank-Dateien
- `mongodb_config` - Konfigurationsdateien

Die Daten bleiben erhalten, auch wenn du die Container neu startest.

### Troubleshooting

**Container startet nicht:**

```bash
# Prüfe ob Port 27017 bereits belegt ist
lsof -i :27017

# Oder mit netstat
netstat -tuln | grep 27017

# Logs anzeigen
docker-compose logs mongodb
```

**Verbindung schlägt fehl:**

```bash
# Prüfe ob Container läuft
docker-compose ps

# Teste Verbindung mit mongosh
docker exec -it streamdraw-mongodb mongosh -u streamdraw -p streamdraw123 --authenticationDatabase admin
```

**Daten zurücksetzen:**

```bash
# Stoppe Container und lösche Volumes
docker-compose down -v

# Starte neu
docker-compose up -d
```

### Backup & Restore

**Backup erstellen:**

```bash
docker exec streamdraw-mongodb mongodump \
  -u streamdraw \
  -p streamdraw123 \
  --authenticationDatabase admin \
  --db streamdraw \
  --out /data/backup

# Backup aus Container kopieren
docker cp streamdraw-mongodb:/data/backup ./mongodb-backup
```

**Backup wiederherstellen:**

```bash
# Backup in Container kopieren
docker cp ./mongodb-backup streamdraw-mongodb:/data/restore

# Restore durchführen
docker exec streamdraw-mongodb mongorestore \
  -u streamdraw \
  -p streamdraw123 \
  --authenticationDatabase admin \
  --db streamdraw \
  /data/restore/streamdraw
```

### Produktion

Für die Produktion solltest du:

1. **Starke Passwörter** verwenden
2. **Mongo Express deaktivieren** oder absichern
3. **Volumes auf Host** mounten
4. **Backup-Strategie** implementieren
5. **MongoDB in separatem Network** isolieren

Beispiel für Produktion:

```yaml
services:
  mongodb:
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - /opt/streamdraw/mongodb:/data/db
```
