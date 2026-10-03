# Canva-Style Formatting Suite, Native Keyboard & Android APK Full-Screen Fix Plan

Address all text contrast issues across the 15 themes, provide an exhaustive Canva-style docked formatting toolbar that preserves selection and applies every single requested styling/alignment tool, restore natural keyboard and clipboard behavior, and optimize the GitHub Actions workflow (`build-apk.yml`) and Android native configuration to guarantee full-screen edge-to-edge rendering.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed with the user:
> - **Canva-Style Docked Bar**: Text editing tools will be organized in a horizontal scrollable dock directly above the keyboard with quick-tap category tabs opening compact popovers (Styles, Paragraph & Lists, Spacing, Typography & TTF Fonts, Media & Filters, Audio).
> - **Selection-Preserving Tool Execution**: Use `onMouseDown={(e) => e.preventDefault()}` and DOM selection range caching so that tapping any formatting button directly modifies the selected text in `contentEditable` without deselecting or dropping keyboard focus.
> - **GitHub Actions APK Workflow Optimization**: Fix `.github/workflows/build-apk.yml` so it does not destroy custom `MainActivity.java` or `styles.xml` with `rm -rf android`, and injects edge-to-edge window flags, transparent status bar, and Capacitor status-bar/keyboard settings into the APK build.
> - **Dynamic Accent Text Contrast**: Introduce `--theme-accent-contrast` across all 15 themes (e.g. in Minimalist Monochrome where accent is pure white `#ffffff`, button text will be stark `#000000` instead of invisible white).
> - **Natural Keyboard & Full Clipboard Operation**: Strip `select-none` from parent containers, ensure standard native clipboard text paste flows through unimpeded, and retain Gboard GIF extraction.

---

## 1. Problem Diagnosis & Root Causes

1. **Theme Button Text Invisibility**:
   - `TelegramFeed.tsx` and other buttons used hardcoded `text-white` with `backgroundColor: var(--theme-accent)`.
   - In `minimalist-monochrome`, `accent` is `#ffffff`. White text on white background made the text completely invisible.
2. **Text Formatting Tools Failing to Apply**:
   - Tapping buttons in HTML `contentEditable` steals focus and destroys the active `window.getSelection()` range before `document.execCommand` or DOM replacement executes.
   - The user also noticed missing tools from their initial comprehensive list (e.g. Strong vs Bold, Emphasis vs Italic, Overline, Small Text, Mark, H1-H20, Definition lists, Line height, Letter spacing, First-line & hanging indents, RTL/LTR).
3. **Keyboard & Clipboard Malfunction**:
   - Container elements had `select-none` (`user-select: none`), which in Android WebView disables the native text cursor, long-press magnifying glass, context menu, and clipboard paste actions.
   - `onPaste` had `e.preventDefault()` inside an incomplete check that blocked standard text paste from the Android clipboard.
4. **Full-Screen APK Not Working (GitHub Actions Issue)**:
   - In `.github/workflows/build-apk.yml`, line 128:
     `if [ ! -f "android/gradlew" ]; then rm -rf android && npx cap add android; fi`
     Because `gradlew` wasn't tracked, GitHub Actions was deleting the `/android` folder and generating a default Capacitor template on every build, wiping out all custom `WindowCompat.setDecorFitsSystemWindows(false)` and `styles.xml` translucent status bar settings!

---

## 2. Technical Architecture & Proposed Changes

### A. Theme Engine Contrast Fix (`AndroidContainer.tsx`)
Add `accentContrast` to `ThemeConfig` and register for all 15 themes:
- Minimalist Monochrome: `accent: '#ffffff'`, `accentContrast: '#000000'`
- Light Theme: `accent: '#0284c7'`, `accentContrast: '#ffffff'`
- Dark Theme: `accent: '#38bdf8'`, `accentContrast: '#0f172a'`
- Cyberpunk Neon: `accent: '#f43f5e'`, `accentContrast: '#ffffff'`
- Retro Vintage: `accent: '#b45309'`, `accentContrast: '#ffffff'`
Set `--theme-accent-contrast` in root CSS variables, and update all action buttons to use `color: var(--theme-accent-contrast)`.

### B. Canva-Style Docked Formatting Toolbar (`DiaryCanvas.tsx`)
Create a Canva-style horizontal docked toolbar directly above the keyboard with selection persistence:
1. **Inline / Character Styles Popover**:
   - Select All, Cut, Copy, Bold, Strong (`<strong>`), Italic, Emphasis (`<em>`), Underline, Strikethrough, Delete (`<del>`), Highlight / Mark (`<mark>` with color palette), Superscript, Subscript, Monospace / Inline Code (`<code>`), Small Text (`<small>`), Overline (`text-decoration: overline`).
   - ForeColor / Text Color picker, Background Color / Fill Color picker, WebLink creator (`createLink`).
   - Structural Styles: Title, Subtitle, Section Headings (interactive picker for **H1, H2, H3, H4, H5, H6 through H20**), Display Text, Hero Text, Caption, Label.
2. **Paragraph, Lists & Layout Popover**:
   - Lists: Unordered List (`<ul>`), Bulleted List, Ordered List (`<ol>`), Numbered List, Task / Checklist (`<ul class="task-list">`), Definition List (`<dl><dt><dd>`), Description List, Nested List.
   - Alignment: Align Left, Align Center, Align Right, Justify.
   - Spacing & Indentation: Line Height / Leading (1.0, 1.2, 1.5, 1.8, 2.0), Paragraph Spacing, Letter Spacing (Tracking), Word Spacing, First-line Indent, Hanging Indent.
   - Text Direction: Left-to-Right (LTR) and Right-to-Left (RTL) toggle.
3. **Selection Preservation Technique**:
   - Cache `range` on every `selectionchange` / `mouseup` / `touchend`.
   - All toolbar buttons use `onMouseDown={(e) => e.preventDefault()}` so focus remains in the editor.
   - If range is collapsed or detached, restore cached range before executing the styling command.

### C. Normal Keyboard & Clipboard Restoration
1. Remove `select-none` from `AndroidContainer`, `DiaryCanvas`, and editor containers; apply `select-text` explicitly to the editable area.
2. Update `onPaste`:
   - Inspect clipboard data: If item is image/GIF file blob, prevent default and add to media layer.
   - If item is text or HTML, **do NOT prevent default** — let the browser/WebView natively paste text from the system clipboard.
3. Keep `inputMode="text"`, `autoCapitalize="sentences"`, `spellCheck={true}`, and ensure Gboard opens standard Qwerty layout without forced numbers row.

### D. GitHub Actions Workflow (`build-apk.yml`) & Android Edge-to-Edge Fix
1. In `build-apk.yml`:
   - Remove destructive `rm -rf android`.
   - If `gradlew` wrapper is missing, run `gradle wrapper` or check wrapper files into git.
   - Add automated step in CI that guarantees `MainActivity.java` contains `WindowCompat.setDecorFitsSystemWindows(window, false)` and `styles.xml` has transparent status bar attributes.
   - Set Capacitor config with proper status bar overlays:
     `"StatusBar": { "overlays": true, "style": "DARK" }`.
2. Commit `android/gradle/wrapper/gradle-wrapper.jar` and `android/gradlew` if needed so the build is 100% reproducible.

---

## 3. Verification & Testing Strategy
1. **Button Contrast**: Check Minimalist Monochrome theme: Verify "+ Write New Diary" text is clearly visible and readable in black against white accent.
2. **Canva Toolbar**: Select text on canvas and tap Bold, Highlight, ForeColor, H1-H20, and Overline. Verify styling applies immediately to the selected characters.
3. **Paragraph & Spacing**: Test Lists, Alignments, Line Height, Letter Spacing, and LTR/RTL switching.
4. **Clipboard & Keyboard**: Copy text from outside, paste inside editor. Verify normal text pasting works. Test Gboard GIF insertion.
5. **Build & Lint**: Run `compile_applet` and `lint_applet` to verify 0 errors.
