# Bubble.io Dev Studio - Cloud Sync Microservice

Node.js service that fetches Bubble application exports for Bubble.io Dev Studio's cloud synchronization feature.

---

## How It Works

The microservice authenticates using a collaborator account (`bubbledevstudio.bot@gmail.com`). When a sync request arrives from Bubble.io Dev Studio, the service attempts two extraction methods:

1. **Official Export Protocol (Primary)**:
   Fetches the application export directly from `https://bubble.io/appeditor/export/${branch}/${appId}.bubble`. This returns the full AST, including pages, reusable elements, workflows, action chains, and data models.
2. **Multi-Path AST Assembly (Fallback)**:
   If the export route is throttled or restricted, the service fetches individual AST paths via `/appeditor/load_multiple_paths` and formats them into a standard `.bubble` JSON file.

---

## Deployment on Oracle Cloud VM

### Method A: Systemd Service (Oracle Linux 9)

1. **Install Node.js 20+**:
   ```bash
   sudo dnf module enable nodejs:20 -y
   sudo dnf install nodejs git -y
   ```

2. **Set up application directory**:
   ```bash
   sudo mkdir -p /opt/bubble-cloud-sync
   sudo chown -R $USER:$USER /opt/bubble-cloud-sync
   cp -r /path/to/server/bubble-cloud-sync/* /opt/bubble-cloud-sync/
   cd /opt/bubble-cloud-sync
   npm install --omit=dev
   ```

3. **Configure environment (`.env`)**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Add your settings:
   ```env
   PORT=8080
   BUBBLE_BOT_SESSION=your_bubble_session_cookie_here
   # Optional secret key:
   # SYNC_API_SECRET=your_secret_key_here
   ```

4. **Create a systemd unit (`/etc/systemd/system/bubble-sync.service`)**:
   ```ini
   [Unit]
   Description=Bubble.io Dev Studio Cloud Sync Microservice
   After=network.target

   [Service]
   Type=simple
   User=opc
   WorkingDirectory=/opt/bubble-cloud-sync
   ExecStart=/usr/bin/node src/server.js
   Restart=always
   RestartSec=5
   EnvironmentFile=/opt/bubble-cloud-sync/.env

   [Install]
   WantedBy=multi-user.target
   ```

5. **Start the service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now bubble-sync.service
   sudo systemctl status bubble-sync.service
   ```

---

### Method B: Docker & Docker Compose

1. **Start containers**:
   ```bash
   docker compose up -d --build
   ```

2. **View logs**:
   ```bash
   docker compose logs -f
   ```

---

## Firewall & Security Configuration

### 1. Oracle Cloud Infrastructure (OCI) Security List
In the OCI Web Console:
* Open **Networking > Virtual Cloud Networks > your VCN > Security Lists**.
* Add an **Ingress Rule**:
  - **Source CIDR**: `0.0.0.0/0`
  - **IP Protocol**: `TCP`
  - **Destination Port Range**: `8080` (or `443` behind a reverse proxy with SSL).

### 2. Host Firewall (Oracle Linux `firewalld` or `iptables`)
```bash
# Oracle Linux / RHEL (firewalld)
sudo firewall-cmd --zone=public --add-port=8080/tcp --permanent
sudo firewall-cmd --reload

# Ubuntu / Debian (iptables)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo netfilter-persistent save
```

---

## API Endpoints

### 1. Health Check
```http
GET /health
```
**Response**:
```json
{
  "status": "ok",
  "service": "bubble-cloud-sync",
  "version": "1.0.0",
  "hasBotSession": true,
  "rateLimitWindowMinutes": 15,
  "maxRequestsPerWindow": 30
}
```

### 2. Application AST Synchronization
```http
POST /v1/sync
Content-Type: application/json
X-Sync-Secret: <optional-secret>

{
  "appId": "quiz2coin-search-test",
  "branch": "test"
}
```

**Response**:
```json
{
  "success": true,
  "appId": "quiz2coin-search-test",
  "branch": "test",
  "source": "official_export",
  "stats": {
    "pagesCount": 18,
    "workflowsCount": 1123,
    "elementsCount": 234,
    "dataTypesCount": 53
  },
  "data": { ... }
}
```

---

## Security Protections

1. **Rate Limiting**: Uses `express-rate-limit` capped at 30 requests per 15 minutes per IP address.
2. **Payload Limits**: Limits request body size to 50MB with strict JSON parsing.
3. **Session Isolation**: The session cookie stays in server environment memory and is not sent to clients.
4. **No Database Access**: Only queries Bubble app definition endpoints (`/appeditor/...`), without accessing database records.
