# Contributing to Bubble.io Dev Studio

Thank you for your interest in contributing to Bubble.io Dev Studio! We welcome contributions of all kinds, whether you are fixing a bug, improving documentation, or proposing new features.

---

## Code of Conduct

Please treat everyone in the community with respect, kindness, and constructive feedback. Open source thrives when developers collaborate positively.

---

## How to Contribute

### 1. Reporting Bugs & Requesting Features
- **Search existing issues** first to avoid duplicates.
- **For bugs:** Open an issue describing the bug, including steps to reproduce, expected vs. actual behavior, and environment details (Node.js 20+ LTS, browser, and package manager details (OS, Node version)).
- **For feature requests:** Describe the problem you are trying to solve and propose a solution or interface specification.

### 2. Pull Request Workflow

1. **Fork the repository** and clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bubble-io-dev-studio.git
   cd bubble-io-dev-studio
   ```

2. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or: git checkout -b fix/issue-description
   ```

3. **Follow commit conventions:** We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add live filter controls to table view`
   - `fix: handle edge case in session state hydration`
   - `docs: document local preview instructions in README`
   - `perf: memoize virtualized list item rendering`

4. **Ensure code quality:**
   - Keep code clean, readable, and strictly typed.
   - Verify that all existing and new unit tests pass before submitting.
   - Run the local linter/formatter if available.

5. **Push and open a Pull Request:**
   - Push your branch to your fork:
     ```bash
     git push origin feat/your-feature-name
     ```
   - Open a Pull Request against the `main` branch.
   - Provide a clear PR title and description outlining the changes made and referencing any related issues (e.g., `Closes #12`).

---

## Development Setup

Bubble.io Dev Studio requires **Node.js 20+ LTS** and npm.

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/alexandrmotologa/bubble-io-dev-studio.git
   cd bubble-io-dev-studio
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```

3. **Run tests and production build:**
   ```bash
   npm test
   npm run build
   ```

Refer to the **Quick Start** section in [README.md](README.md) for full configuration flags, architecture details, and usage examples.

---

## Questions & Discussions

If you have questions about architecture decisions or need guidance before submitting a large change, feel free to open a Discussion or an Issue with the `question` label.
