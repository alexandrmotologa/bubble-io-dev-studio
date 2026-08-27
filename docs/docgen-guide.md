# 📚 1-Click Developer Documentation Book (DocGen) Guide

The **DocGen Engine** compiles full-scale technical documentation books for clients, development agencies, and internal engineering teams with a single click.

---

## 1. Generated Technical Chapters

The engine aggregates data across all studio modules into 7 comprehensive chapters:

1. **Executive Summary & Overview**: App ID, active environment, domain mappings, and summary metrics.
2. **Database Schema & Data Dictionary**: Full table-by-table specifications with field names, types, nullability, and descriptions.
3. **Entity-Relationship Diagram (ERD)**: Auto-generated Mermaid ERD diagram showing database relational structures.
4. **Privacy Rules & RBAC Matrix**: Security permissions per role (*Admin*, *Authenticated User*, *Guest*).
5. **API & Backend Workflows Catalog**: Standard Data API endpoints and backend webhook endpoints.
6. **AI Localization & Language Matrix**: UI string volume, sample keys, and translation coverage.
7. **AST Code Health & Quality Scorecard**: Health grade, score %, and identified dead code items.

---

## 2. Export Formats & Distribution

| Format | File Extension | Use Case |
| :--- | :--- | :--- |
| **Markdown** | `.md` | Perfect for GitHub repositories, GitBook, Obsidian, or Notion wikis |
| **Standalone HTML Manual** | `.html` | Self-contained single-page document with embedded CSS, Mermaid rendering, and zero external dependencies |
| **Print to PDF** | `.pdf` | Formatted print layout for formal client handover and architecture proposals |

---

## 3. How to Generate a Book

1. Click **"DocGen Book"** in the sidebar or press `Ctrl+K` and select **"Go to 1-Click Developer Documentation Book"**.
2. Click **"Recompile Book"** to pull the latest schema, security audit, and translation state.
3. Select any chapter from the table of contents to read or search.
4. Click **"Export Markdown"** or **"Export HTML Manual"** to download the completed document.
