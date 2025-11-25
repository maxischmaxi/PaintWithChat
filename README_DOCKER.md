# 🐳 Docker Setup für PaintWithChat

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
mongodb://paintwithchat:paintwithchat123@localhost:27017/paintwithchat?authSource=admin
```

**Zugangsdaten:**

- Username: `paintwithchat`
- Password: `paintwithchat123`
- Database: `paintwithchat`
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
MONGODB_URI=mongodb://paintwithchat:paintwithchat123@localhost:27017/paintwithchat?authSource=admin
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
docker exec -it paintwithchat-mongodb mongosh -u paintwithchat -p paintwithchat123 --authenticationDatabase admin
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
docker exec paintwithchat-mongodb mongodump \
  -u paintwithchat \
  -p paintwithchat123 \
  --authenticationDatabase admin \
  --db paintwithchat \
  --out /data/backup

# Backup aus Container kopieren
docker cp paintwithchat-mongodb:/data/backup ./mongodb-backup
```

**Backup wiederherstellen:**

```bash
# Backup in Container kopieren
docker cp ./mongodb-backup paintwithchat-mongodb:/data/restore

# Restore durchführen
docker exec paintwithchat-mongodb mongorestore \
  -u paintwithchat \
  -p paintwithchat123 \
  --authenticationDatabase admin \
  --db paintwithchat \
  /data/restore/paintwithchat
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
      - /opt/paintwithchat/mongodb:/data/db
```
