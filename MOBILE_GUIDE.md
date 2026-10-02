# Telenotes: Android Mobile Development & APK Generation Guide

Yeh guide un sabhi developers ke liye hai jo pura development **apne Android phone** par kar rahe hain aur bina kisi PC/laptop ke Telenotes app ka Android APK banana aur test karna chahte hain.

---

## 📱 Part 1: Android Phone se 1-Click me APK kaise banayein (Cloud Build)

Aapki repository me `.github/workflows/build-apk.yml` workflow ready hai. Yeh GitHub ke cloud servers par free me APK compile karta hai.

### Steps:
1. **GitHub kholiye**: Apne phone ke Chrome browser me apni GitHub repository open karein.
2. **Actions Tab me jayein**: Upar menu me **Actions** par tap karein.
3. **Workflow chunein**: Left side ya list me **"Build Android APK (Telenotes)"** par tap karein.
4. **Run workflow dabayein**:
   - Right side me **"Run workflow"** button par tap karein.
   - Default choice `debug` rahegi, phir green **"Run workflow"** button daba dein.
5. **2 se 3 minute wait karein**:
   - Workflow run hona shuru hoga aur 2-3 minute me green checkmark (✔) dikhayega.
6. **APK Download karein**:
   - Finished run par tap karein.
   - Neeche scroll karein jahan **Artifacts** likha hoga.
   - **`telenotes-debug-apk`** par tap karein. Ek zip file download hogi.
   - Us zip ko phone ke File Manager me extract karein aur `app-debug.apk` par tap karke **Install** kar lein!

> 💡 **Note**: Android par pehli baar install karte waqt agar *"Install unknown apps"* ka popup aaye, toh Chrome ya File Manager ke liye permission **Allow** kar dein.

---

## 🛠️ Part 2: Android Phone se Code Modify karke New Features kaise Add ya Remove karein

Aapko code badalne ke liye laptop ki zaroorat nahi hai:

### Tareeqa A: AI Studio me mujhe bata kar (Sabse Fast & Error-Free)
- Aap seedhe AI Studio chat me Hindi ya English me likhein:
  - *"Diary me audio note ka player bada karo"*
  - *"Settings se Google Drive ka button hta do"*
  - *"Naya dark violet theme add karo"*
- Main code update kar dunga, aur aap GitHub par sync karke naya APK build kar sakte hain.

### Tareeqa B: GitHub Mobile Browser se Direct Edit karna
1. Apne phone browser me GitHub repo open karein.
2. Kisi bhi file par jayein (jaise `src/components/home/TelegramFeed.tsx`).
3. Upar **✏️ Pencil (Edit)** icon par tap karein.
4. Code me jo badlaav karna chahein karein.
5. Neeche **Commit changes** par tap kar dein.
6. Commit hote hi GitHub automatically naya APK build shuru kar dega!

### Tareeqa C: GitHub Web VS Code (Mobile Browser me)
- Apne GitHub repo page par browser me keyboard se `.` (dot) press karein ya URL me `github.com` ko `github.dev` se replace karein. Pura VS Code aapke mobile screen par khul jayega!

---

## 🔐 Part 3: Keystores aur Secret Keys kaise set karein

Telenotes me do alag-alag tarah ki keys hoti hain:

### 1. Test / Debug APK ke liye (Immediate Testing on Phone)
- **Koi keystore ya secret key nahi chahiye!**
- GitHub Actions automatically self-signed debug key se APK build karta hai jo kisi bhi Android phone par bina kisi setup ke install ho jata hai.

### 2. Production Release ke liye (Signed APK / Play Store)
Agar aap Play Store ya doston ko formal production version bhejna chahte hain:

#### Step 1: Keystore File generate karein (Command Line ya Online)
Kisi bhi Android terminal (jaise Termux app) ya computer me ye standard command chalayein:
```bash
keytool -genkey -v -keystore telenotes-release.keystore -alias telenotes -keyalg RSA -keysize 2048 -validity 10000
```
*(Yeh aapse password aur details puchega, jaise password: `MyPassword123`)*

#### Step 2: Keystore ko Base64 me convert karein
```bash
base64 telenotes-release.keystore > keystore_base64.txt
```
Is file ke text ko copy kar lein.

#### Step 3: GitHub Secrets me add karein
1. Apne GitHub repo par jayein -> **Settings** -> **Secrets and variables** -> **Actions**.
2. **New repository secret** par tap karein aur ye 4 secrets add karein:
   - `KEYSTORE_BASE64`: (Text jo aapne `keystore_base64.txt` se copy kiya)
   - `KEYSTORE_PASSWORD`: (Aapka keystore password)
   - `KEY_ALIAS`: `telenotes`
   - `KEY_PASSWORD`: (Aapka key password)
3. Ab jab bhi aap **Actions** me jakar **build_type: release** choose karenge, GitHub Actions automatically ek officially signed `telenotes-release-signed.apk` tayyar kar dega!

---

## 🛡️ Part 4: App ka Internal Vault Master Secret Key (Diaries Encrypt karne ke liye)

App ke andar jo notes aur diaries likhi jaati hain, unka Android Keystore se alag security layer hota hai:
1. Jab aap pehli baar Telenotes open karte hain, app automatically WebCrypto (AES-GCM-256 + PBKDF2) ke zariye ek **256-bit Master Secret Key** create karti hai.
2. Aap **Settings -> Security** me jakar apna Master Key dekh aur copy kar sakte hain.
3. Agar aap 4-digit Passcode set karte hain, toh yeh key aapke PIN aur salt se mathematically lock ho jaati hai.
4. Backup restore karte waqt sirf yahi Master Key required hoti hai, jisse zero-knowledge privacy milti hai.
