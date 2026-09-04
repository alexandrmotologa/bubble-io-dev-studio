# 📸 Visual QA & Regression Suite Guide (v3.3.8)

The **Visual QA Suite** automates responsive multi-device pixel diff testing for Bubble.io web applications.

---

## 1. Subtabs & Module Structure

The **Visual QA Suite** contains 5 specialized subtabs:

1. **📸 Visual Regression Suite & Diff Inspector**:
   - Multi-target test execution across desktop, tablet, and mobile viewports.
   - **4 Visual Diff Inspection Modes**:
     - ↔️ **Split Slider**: Drag the interactive vertical divider left and right to inspect layout shifts pixel-by-pixel.
     - 🔲 **Side-by-Side**: View Baseline and Current Release captures with synchronized zooming.
     - 🧅 **Onion Skin**: Layer the two captures on top of each other with adjustable alpha opacity (0–100%).
     - 🔥 **Heatmap Highlight**: Visual overlay highlighting bounding boxes of pixel discrepancies.
   - **Approve Baseline Snapshot**: Promote any test capture to the new production reference with 1 click.

2. **📱 4-Up Multi-Device Live Matrix**:
   - Interactive synchronized viewport matrix: Desktop 4K (`1920×1080`), MacBook Air (`1280×800`), iPad Pro (`834×1194`), and iPhone 16 Pro (`393×852`).
   - Device rotation toggle (Portrait ↔ Landscape).
   - Add custom breakpoint sizes and scale zoom (50%, 75%, 100%).

3. **🎯 Target Viewports & Custom Routes**:
   - Add page routes (e.g. `/index`, `/pricing`, `/dashboard`) with device presets.
   - 1-click **Load Responsive Preset Viewports** for active project.

4. **🛡️ Protected Page Authentication**:
   - **Agency Plan HTTP Basic Auth**: Authenticate password-protected Bubble apps (`username:password@app.bubbleapps.io`).
   - **User Session Login Flow**: Automate login form filling before taking regression captures.

5. **⚙️ Tolerance Thresholds & Element Masking**:
   - Configure mismatch tolerance percentage (0.01% – 5.0%).
   - Define CSS masking selectors (e.g. `.timestamp`, `.user-avatar`, `.realtime-ticker`) to ignore dynamic areas.
   - Export standalone offline HTML regression reports.
