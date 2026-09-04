# ☁️ Bubble.io Dev Studio — Cloud Sync Microservice (v3.3.8)

A high-performance, autonomous Node.js service running on Oracle Cloud Infrastructure (Always-Free Tier) that serves as the backend bridge for Bubble.io Dev Studio's **⚡ 1-Click Cloud Direct Sync**.

---

## 🌟 How It Works

The microservice acts as an authorized collaborator bot (`bubbledevstudio.bot@gmail.com`). When a developer initiates sync from Bubble.io Dev Studio, the microservice executes a prioritized dual-strategy extraction:

1. **Strategy 1: Official Bubble Export Protocol (Priority)**:
   Fetches the full application export directly from `https://bubble.io/appeditor/export/${branch}/${appId}.bubble`. Returns 100% complete AST containing all pages, reusable elements, workflows, action chains, and data models.
2. **Strategy 2: Multi-Path AST Assembly (Fallback)**:
   If the export route is throttled or restricted, fetches granular AST paths via `/appeditor/load_multiple_paths` and normalizes them into standard `.bubble` blueprint JSON.

---

## 🚀 Deployment Options on Oracle Cloud VM

### Method A: Native Systemd Service (Recommended on Oracle Linux 9)

1. **Install Node.js 20+**:
   ```bash
   sudo dnf module enable nodejs:20 -y
   sudo dnf install nodejs git -y
   ```

2. **Clone & Setup Directory**:
   ```bash
   sudo mkdir -p /opt/bubble-cloud-sync
   sudo chown -R $USER:$USER /opt/bubble-cloud-sync
   cp -r /path/to/server/bubble-cloud-sync/* /opt/bubble-cloud-sync/
   cd /opt/bubble-cloud-sync
   npm install --omit=dev
   ```

3. **Configure Environment (`.env`)**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Provide:
   ```env
   PORT=8080
   BUBBLE_BOT_SESSION=your_bubble_session_cookie_here
   # Optional: Protect with a secret API key
   # SYNC_API_SECRET=your_super_secret_key_here
   ```

4. **Create Systemd Service (`/etc/systemd/system/bubble-sync.service`)**:
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

5. **Enable and Start Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now bubble-sync.service
   sudo systemctl status bubble-sync.service
   ```

---

### Method B: Docker & Docker Compose

1. **Start with Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

2. **Inspect Logs**:
   ```bash
   docker compose logs -f
   ```

---

## 🔒 Firewall & Security Configuration

### 1. Oracle Cloud Infrastructure (OCI) VCN Security List
In the OCI Web Console:
* Navigate to **Networking ➔ Virtual Cloud Networks ➔ your VCN ➔ Security Lists**.
* Add an **Ingress Rule**:
  - **Source CIDR**: `0.0.0.0/0`
  - **IP Protocol**: `TCP`
  - **Destination Port Range**: `8080` (or `443` if using Nginx reverse proxy with SSL).

### 2. VM OS Firewall (Oracle Linux `firewalld` or `iptables`)
```bash
# Oracle Linux / RHEL (firewalld)
sudo firewall-cmd --zone=public --add-port=8080/tcp --permanent
sudo firewall-cmd --reload

# Or Ubuntu / Debian (iptables)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo netfilter-persistent save
```

---

## 📡 API Endpoints

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

**Response (Success)**:
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

## 🛡️ Built-in Security Protections

1. **Rate Limiting**: IP-based sliding window (`express-rate-limit`) restricting clients to **30 requests per 15 minutes** to prevent brute-force attacks and abuse.
2. **Payload Protection**: Request body parsing capped at 50MB with strict JSON validation.
3. **Bot Session Isolation**: The session cookie never leaves the server's environment memory.
4. **No Database Access**: Only accesses Bubble app definition endpoints (`/appeditor/...`), ensuring zero exposure to live user data.
