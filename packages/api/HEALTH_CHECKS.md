# 🏥 API Health Check Endpoints

Die PaintWithChat API bietet mehrere Health Check Endpoints für verschiedene Monitoring-Zwecke.

## 📍 Endpoints

### 1. Basic Health Check

**Endpoint**: `GET /health`

**Zweck**: Schneller Check ob Server läuft

**Verwendung**:

- Railway Health Checks
- Load Balancers
- Uptime Monitoring
- Schnelle Status-Checks

**Response (200 OK)**:

```json
{
  "status": "ok",
  "timestamp": "2024-11-25T01:30:00.000Z"
}
```

**Beispiel**:

```bash
curl https://api.yourdomain.com/health
```

---

### 2. Detailed Health Check

**Endpoint**: `GET /health/detailed`

**Zweck**: Umfassender Check inkl. Datenbankverbindung und System-Metriken

**Verwendung**:

- Monitoring Dashboards
- Debugging
- Status-Pages
- DevOps Monitoring

**Response (200 OK - Healthy)**:

```json
{
  "status": "healthy",
  "timestamp": "2024-11-25T01:30:00.000Z",
  "uptime": 3600,
  "version": "v20.11.0",
  "environment": "production",
  "database": {
    "connected": true,
    "state": "connected"
  },
  "memory": {
    "usage": {
      "rss": "150MB",
      "heapUsed": "75MB",
      "heapTotal": "100MB"
    },
    "percentage": "75%"
  }
}
```

**Response (503 Service Unavailable - Unhealthy)**:

```json
{
  "status": "unhealthy",
  "timestamp": "2024-11-25T01:30:00.000Z",
  "uptime": 3600,
  "version": "v20.11.0",
  "environment": "production",
  "database": {
    "connected": false,
    "state": "disconnected"
  },
  "memory": {
    "usage": {
      "rss": "150MB",
      "heapUsed": "75MB",
      "heapTotal": "100MB"
    },
    "percentage": "75%"
  }
}
```

**Beispiel**:

```bash
curl https://api.yourdomain.com/health/detailed
```

---

### 3. Readiness Check

**Endpoint**: `GET /health/ready`

**Zweck**: Prüft ob Server bereit ist Requests zu empfangen

**Verwendung**:

- Kubernetes Readiness Probes
- Load Balancer Ready Check
- Deployment Verification

**Response (200 OK - Ready)**:

```json
{
  "status": "ready",
  "timestamp": "2024-11-25T01:30:00.000Z"
}
```

**Response (503 Service Unavailable - Not Ready)**:

```json
{
  "status": "not_ready",
  "timestamp": "2024-11-25T01:30:00.000Z",
  "reason": "Database not connected"
}
```

**Beispiel**:

```bash
curl https://api.yourdomain.com/health/ready
```

---

### 4. Liveness Check

**Endpoint**: `GET /health/live`

**Zweck**: Prüft ob Server-Prozess am Leben ist (ohne externe Dependencies)

**Verwendung**:

- Kubernetes Liveness Probes
- Process Monitoring
- Quick Alive Check

**Response (200 OK)**:

```json
{
  "status": "alive",
  "timestamp": "2024-11-25T01:30:00.000Z",
  "uptime": 3600
}
```

**Beispiel**:

```bash
curl https://api.yourdomain.com/health/live
```

---

## 🔍 Endpoint-Vergleich

| Endpoint           | Prüft DB | Prüft Memory | Schnell | Zweck                |
| ------------------ | -------- | ------------ | ------- | -------------------- |
| `/health`          | ❌       | ❌           | ✅      | Basis Check          |
| `/health/detailed` | ✅       | ✅           | ❌      | Vollständiger Status |
| `/health/ready`    | ✅       | ❌           | ✅      | Bereitschaft         |
| `/health/live`     | ❌       | ❌           | ✅      | Prozess-Check        |

## 🚂 Railway Konfiguration

Railway verwendet automatisch `/health` für Health Checks:

```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

**Health Check Intervall**: Alle 30 Sekunden
**Timeout**: 10 Sekunden
**Failure Threshold**: 3 aufeinanderfolgende Fehler → Service Restart

## 📊 Monitoring Setup

### Uptime Monitoring (z.B. UptimeRobot, Pingdom)

```
URL: https://api.yourdomain.com/health
Interval: 60 seconds
Expected Response: 200 OK
Expected Content: "ok"
```

### Detailed Monitoring (z.B. Datadog, New Relic)

```
URL: https://api.yourdomain.com/health/detailed
Interval: 300 seconds (5 minutes)
Expected Response: 200 OK
Alert wenn: status !== "healthy"
```

### Status Page (z.B. StatusPage.io)

```
Component: API Server
Check: GET /health/detailed
Display: database.connected, uptime, memory.percentage
```

## 🔧 Custom Health Checks

Du kannst weitere Health Checks in `/packages/api/src/routes/health.ts` hinzufügen:

```typescript
// Beispiel: WebSocket Status Check
router.get("/websocket", (req: Request, res: Response) => {
  const wsConnections = io.sockets.sockets.size;
  res.json({
    status: "ok",
    connections: wsConnections,
    timestamp: new Date().toISOString(),
  });
});
```

## 🐛 Debugging

### Server startet nicht

```bash
# Prüfe ob Port belegt ist
curl http://localhost:3001/health
```

### Datenbank-Verbindung fehlt

```bash
# Detaillierter Check
curl http://localhost:3001/health/detailed | jq .database
```

### Memory Leak Verdacht

```bash
# Überwache Memory über Zeit
watch -n 5 'curl -s http://localhost:3001/health/detailed | jq .memory'
```

## 🚨 Alarm-Konfiguration

### Critical (Sofort)

- `/health` returns 500 or timeout
- `/health/ready` returns 503 for > 5 minutes

### Warning (Zeitverzögert)

- `/health/detailed` shows `database.connected: false`
- Memory percentage > 90% for > 10 minutes
- Uptime < 60 seconds (häufige Restarts)

### Info (Logging)

- `/health/detailed` zeigt erhöhten Memory Usage
- Langsame Response Times

## 📝 Logging

Health Check Requests werden NICHT geloggt, um Logs nicht zu spammen.

Wenn du Health Check Logging aktivieren möchtest:

```typescript
// In packages/api/src/routes/health.ts
router.get("/", (req: Request, res: Response) => {
  console.log(`Health check from ${req.ip}`); // Add logging
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
```

## 🔗 Integration Beispiele

### Docker Compose

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Node.js Client

```typescript
async function checkHealth() {
  try {
    const response = await fetch("https://api.yourdomain.com/health/detailed");
    const data = await response.json();

    if (data.status === "healthy") {
      console.log("✅ API is healthy");
    } else {
      console.error("❌ API is unhealthy:", data);
    }
  } catch (error) {
    console.error("❌ API unreachable:", error);
  }
}
```

---

**Health Checks sind implementiert! 🎉**

Railway und andere Monitoring-Tools können jetzt automatisch den Status der API überwachen.
