# Bubble.io Dev Studio - Cloud Sync Microservice (Oracle Cloud / Buildprint Style)

A high-performance Node.js service that runs 24/7 on your server (e.g., Oracle Cloud Always-Free instance) and acts as an autonomous collaborator bot to synchronize Bubble application schemas.

---

## 🚀 Quick Start on Oracle Cloud VM

### 1. Requirements
- An Oracle Cloud VM (e.g., Ubuntu 22.04 / 24.04 or Oracle Linux)
- Docker & Docker Compose installed:
  ```bash
  sudo apt update && sudo apt install -y docker.io docker-compose-plugin
  ```

### 2. Deployment
1. Clone this repository or copy the `server/bubble-cloud-sync` folder to your Oracle VM:
   ```bash
   mkdir -p ~/bubble-cloud-sync
   cd ~/bubble-cloud-sync
   ```
2. Create your `.env` file:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Paste your `BUBBLE_BOT_SESSION` (the `bubble_session` cookie of your bot account).

3. Start with Docker Compose:
   ```bash
   docker compose up -d --build
   ```

4. Verify health:
   ```bash
   curl http://localhost:8080/health
   ```

---

## 🔒 Firewall Configuration on Oracle Cloud
In Oracle Cloud Infrastructure (OCI) Console:
1. Go to **Networking -> Virtual Cloud Networks -> your VCN -> Security Lists**.
2. Add an **Ingress Rule**:
   - Source CIDR: `0.0.0.0/0`
   - Protocol: `TCP`
   - Destination Port: `8080` (or `443` if using Nginx reverse proxy with SSL).
3. Open firewall on the VM:
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
   sudo netfilter-persistent save # or sudo ufw allow 8080
   ```

---

## 📡 API Endpoints

### `GET /health`
Returns service status and whether bot session is configured.

### `POST /v1/sync`
Fetches the full application AST JSON:
```json
{
  "appId": "quiz2coin-search-test",
  "branch": "test"
}
```
