# Telenotes: Telegram-Style Encrypted Diary, Book Writing Studio & Notes

A modern Telegram-inspired diary, book authoring studio, personal organizer, and encrypted vault built with React 19, TypeScript, Tailwind CSS, and WebCrypto (AES-GCM-256).

---

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js (version 18 or higher)
- npm or bun

### 2. Installation
Extract the zip file, open your terminal in the extracted folder, and run:
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```

---

## 🐙 How to Push to GitHub

### Method A: Using Git Command Line (Recommended)

1. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Enter repository name: `telenotes`
   - Keep it Public or Private, and click **Create repository** (do not add README or license yet).

2. **Run these commands in your project folder**:
   ```bash
   # Initialize git
   git init

   # Add all project files
   git add .

   # Commit changes
   git commit -m "Initial commit - Telenotes App"

   # Rename default branch to main
   git branch -M main

   # Link your GitHub repository (replace with your repo URL)
   git remote add origin https://github.com/YOUR_USERNAME/telenotes.git

   # Push code to GitHub
   git push -u origin main
   ```

---

### Method B: Direct Upload on GitHub (No Terminal Needed)

1. Open your browser and go to [github.com/new](https://github.com/new).
2. Enter repo name (e.g. `telenotes`), check **Add a README file**, and click **Create repository**.
3. On the repository page, click the **Add file** dropdown -> **Upload files**.
4. Drag and drop all files and folders (except `node_modules`) into the box.
5. Click **Commit changes**.

---

## ✨ Features Included
- **Telegram Chat List Experience**: Diaries styled as chat conversations with custom avatars, titles, 2-line snippets, and pinned status.
- **Dedicated Dual Canvases**:
  - *Diary Canvas*: Title box, corner date/time indicator, rich formatting, animated draggable stickers, voice memos with waveform, photo editor, reminders.
  - *Book Studio Canvas*: Structured novel and story writing with chapters, table of contents, target word count, and character sheets.
- **Passcode & Military-Grade Encryption**: AES-GCM-256 local encrypted vault with PBKDF2 key derivation, biometrics simulation, and Master Secret Key recovery.
- **Multi-Format Export**: PDF, Markdown (.md), Plain text (.txt), HTML, and Encrypted (.telenotes) backup.
- **Folders Organization**: Custom folders (*All Notes*, *Personal*, *Story Ideas*, *Manuscripts*).
