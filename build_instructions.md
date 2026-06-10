# AeroCards Build & Execution Instructions

AeroCards is a client-side static web application with no compile-time dependencies, package managers, or bundlers. Running or deploying the project is straightforward.

## 1. Running Locally
You can run the application locally using one of the following methods:

### Method A: Static File Opening
Simply open [index.html](file:///Users/chuck/gitrepositories/FlashCards-AG/index.html) directly in any modern web browser (Double-click the file or drag it into a browser tab).

### Method B: Local HTTP Server (Recommended)
Running through an HTTP server ensures full compatibility with browser caches and local storage.
- **Node.js (serve)**:
  ```bash
  npx serve
  ```
- **Python 3**:
  ```bash
  python3 -m http.server 8000
  ```
  Then open [http://localhost:8000](http://localhost:8000) in your web browser.
- **VS Code Extension**:
  Use the "Live Server" extension to launch a dev server with automatic reloading.

## 2. Dependencies & Assets
- **Fonts**: Pre-fetched from Google Fonts (`Inter` and `Outfit`) online.
- **Icons**: Pre-rendered using inline SVG paths (no external icon libraries needed).
- **Libraries**: Pure vanilla JavaScript (no npm modules, React, or jQuery required).

## 3. Production Deployment
To publish the application online:
1. Push the repository to GitHub.
2. Navigate to repository **Settings** -> **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Set the branch to `main` (or your default branch) and directory to `/ (root)`.
5. Save, and GitHub will build and host the app at your GitHub Pages URL (e.g. `https://<username>.github.io/<repository-name>/`).
