# 📸 Visual QA & Regression Suite Guide

The **Visual QA Suite** automates responsive multi-device pixel diff testing for Bubble.io web applications.

---

## 1. Multi-Device Viewport Matrix

Test your Bubble application across 4 standard viewports simultaneously:

1. 💻 **Desktop Large**: `1920 × 1080` (Full HD)
2. 💻 **Desktop Standard**: `1440 × 900`
3. 📱 **Tablet**: `768 × 1024` (iPad)
4. 📱 **Mobile**: `375 × 812` (iPhone X/12/13/14)

---

## 2. Agency Plan HTTP Basic Auth Protection

If your Bubble application is on an Agency plan and protected by password authentication:

1. Configure your **HTTP Basic Auth Username** and **Password** in the Connection Wizard or Visual QA Suite.
2. In the **Electron Desktop App**, the native session intercepts and authenticates basic auth dialogs automatically.
3. Target URLs are formatted as `https://username:password@your-app.bubbleapps.io/page-name` for full automated test execution.

---

## 3. Visual Diff Inspection Modes

When inspecting visual deviations between Baseline and Latest screenshots, choose from 3 inspection modes:

* ↔️ **Split Slider**: Drag the interactive vertical divider left and right to inspect layout shifts pixel-by-pixel.
* 🔲 **Side-by-Side**: View Baseline and Test viewports side-by-side with synchronized zooming.
* 🧅 **Onion Skin**: Layer the two captures on top of each other with adjustable opacity (0–100%).

---

## 4. Running Tests & Automated Reports

* **Run All Visual Tests**: Executes pixel comparison across all configured routes and viewports.
* **Run Test on Target**: Test a single viewport without executing the entire suite.
* **Export HTML Report**: Generates a self-contained, standalone HTML report with diff percentages and pass/fail badges.
