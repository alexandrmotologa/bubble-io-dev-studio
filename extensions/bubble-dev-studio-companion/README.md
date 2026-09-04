# 🔌 Bubble Dev Studio Companion (Chrome / Edge / Chromium Extension)

Lightning-fast 1-click AST & blueprint synchronization between the Bubble.io Editor and Bubble Dev Studio Desktop.

---

## 🌟 How It Works

The companion extension injects a sleek floating **"⚡ Sync to Dev Studio"** button directly into your active Bubble Editor tabs (`https://bubble.io/page?id=...`). 

When clicked, the extension extracts the full application definition (UI elements, workflows, action properties, data schemas, and option sets) from your active editor session and streams it via HTTP POST directly to Bubble Dev Studio Desktop's local bridge server (`http://127.0.0.1:41890/sync`).

- **No manual downloading required**
- **Works on Bubble Free & Paid plans**
- **100% private local transmission** over loopback port `41890`

---

## 🚀 Installation Guide (Takes 15 Seconds)

Compatible with **Google Chrome**, **Microsoft Edge**, **Brave**, **Arc**, and any Chromium-based browser:

1. Open your browser and navigate to the extensions page:
   - Chrome / Brave / Arc: `chrome://extensions`
   - Edge: `edge://extensions`
2. Toggle **Developer mode** (usually in the top right corner).
3. Click the **"Load unpacked"** button in the top left toolbar.
4. Select this directory:
   ```text
   extensions/bubble-dev-studio-companion
   ```
   (Full path: `b:\workgit\bubble-io-dev-studio\extensions\bubble-dev-studio-companion`)
5. The extension icon will appear in your browser extensions bar!

---

## 🎯 How to Use

1. Ensure **Bubble.io Dev Studio** is running on your desktop.
2. Open your Bubble application editor in your browser (e.g., `https://bubble.io/page?id=your-app-id`).
3. Look for the floating **"⚡ Sync to Dev Studio"** badge in the bottom-right corner of the editor.
4. Click **"⚡ Sync to Dev Studio"**.
5. In under 1 second, your application AST is received by Dev Studio, automatically parsed, and indexed for Dead Code Detection, ERD diagrams, and Data Studio.
