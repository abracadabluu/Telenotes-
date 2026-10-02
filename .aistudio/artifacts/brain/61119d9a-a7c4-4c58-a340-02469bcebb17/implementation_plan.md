# Revised Implementation Plan: Dual-Branch & Zero-Reinstall Dev Lifecycle

Clarifying the exact operational workflow between `main` branch, `dev` branch, and the Zero-Reinstall Dev APK.

---

## 1. Zero-Reinstall Dev APK Lifecycle
- **Does it require re-installation after every code update?**
  **NO. Re-installation is NOT required.**
- **How it works:**
  1. The **Dev APK** acts as a live Capacitor WebView pointing to your repository's GitHub Pages URL (`https://<username>.github.io/<repo>/`).
  2. When code is changed on the `dev` branch, GitHub Actions builds and updates the GitHub Pages site within 30–45 seconds.
  3. When you open or refresh the Dev APK on your Android phone, it fetches the newest UI, buttons, and features immediately over-the-air.
  4. You only install the Dev APK **once**.

---

## 2. Branch Responsibilities & User Workflow

### `main` Branch (Production - Untouched)
- **Role**: Holds the pristine, stable, production-ready codebase.
- **Your actions on `main`**:
  - **Initially**: Nothing. Do not touch or modify code directly on `main`.
  - **During development**: Keep it untouched while experimenting on `dev`.
  - **Final Stage**: Once all modifications, added features, and removed features are verified on your phone via the Dev APK, you open a Pull Request on GitHub and click **"Merge"** to bring the changes from `dev` into `main`.
  - **Outcome**: A standalone, 100% offline Production APK (`com.telenotes.app`) is built from `main` with all bundled assets and zero server dependency.

### `dev` Branch (Active Development & Instant Preview)
- **Role**: Playground for adding, testing, and deleting features.
- **Your actions on `dev`**:
  - Whenever you want a change (e.g. "change theme", "remove export button", "add audio equalizer"), you tell AI Studio or edit the code on `dev`.
  - The changes are pushed to `dev`.
  - GitHub Actions immediately updates GitHub Pages.
  - You open your phone's Dev APK and test the changes in real time.

---

## 3. What You Need To Do After Syncing GitHub

### Step 1: Initial Sync & Setup (One-time)
1. Connect your GitHub repository to AI Studio.
2. Ensure two branches exist: `main` and `dev`.
3. In GitHub repo **Settings -> Pages -> Source**, select **"GitHub Actions"**.

### Step 2: Install Dev APK Once (One-time)
1. Go to GitHub repo **Actions -> Build & Preview Workflow -> Run on `dev` branch**.
2. Download the generated **`telenotes-dev-apk`** onto your Android phone and install it once.

### Step 3: Fast Iteration Loop (Repeated as needed)
1. Tell AI Studio: *"Mujhe feature X add karna hai aur feature Y hatana hai"* on `dev`.
2. AI Studio updates the code on `dev`.
3. Wait ~45 seconds for GitHub Pages deployment.
4. Reopen the Dev APK on your Android phone to test the new changes immediately!

### Step 4: Final Production Release (When ready)
1. In GitHub, merge `dev` into `main`.
2. GitHub Actions automatically builds the final offline **Production APK** (`com.telenotes.app`).
