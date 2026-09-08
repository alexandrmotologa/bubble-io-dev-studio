# Visual QA & Regression Suite Guide

The Visual QA Suite provides multi-device responsive screenshot comparisons and pixel difference detection for Bubble.io applications.

---

## Subtabs & Module Structure

The Visual QA Suite includes five sections:

### 1. Visual Regression & Diff Inspector
- Test execution across desktop, tablet, and mobile viewports.
- **Four Comparison Modes**:
  - **Split Slider**: Drag a divider horizontally to inspect layout changes pixel-by-pixel.
  - **Side-by-Side**: Compare baseline and test captures side by side with synchronized zoom.
  - **Onion Skin**: Overlay the two captures with adjustable opacity (0% to 100%).
  - **Heatmap**: Highlights bounding boxes around detected pixel differences.
- **Baseline Approval**: Set any capture as the new reference baseline with one click.

### 2. Multi-Device Matrix
- Synchronized viewport matrix for standard screen sizes:
  - Desktop: `1920x1080`
  - Laptop: `1280x800`
  - Tablet: `834x1194`
  - Mobile: `393x852`
- Orientation toggle (portrait and landscape).
- Custom breakpoint additions and scaling options (50%, 75%, 100%).

### 3. Target Viewports & Custom Routes
- Configure specific page paths (such as `/index`, `/pricing`, `/dashboard`) with device presets.
- Load responsive presets for the active project.

### 4. Protected Page Authentication
- **HTTP Basic Auth**: Authenticate password-protected Bubble apps (`username:password@app.bubbleapps.io`).
- **Session Login Flow**: Automate login form filling before taking regression screenshots.

### 5. Tolerance Thresholds & Element Masking
- Set mismatch tolerance percentages (0.01% to 5.0%).
- Define CSS masking selectors (such as `.timestamp`, `.user-avatar`, or `.realtime-ticker`) to ignore dynamic regions during comparison.
- Export standalone HTML regression reports.
