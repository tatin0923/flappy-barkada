# 🐦 Flappy Barkada - Custom Flappy Bird Game

Flappy Bird game na may **9 Custom Characters**, classic retro visuals, arcade sound effects, **Highest to Lowest Scoreboard**, at **Admin Dashboard** para baguhin ang pangalan at litrato ng mga character nang dynamic!

---

## 🚀 Paano Patakbuhin Locally

### Paraan 1: Gamit ang PHP Server (XAMPP o Built-in PHP)
Buksan ang PowerShell o Terminal sa folder na ito at i-type:
```bash
php -S localhost:8080
```
Pagkatapos, buksan sa browser:
👉 **http://localhost:8080/index.php**

### Paraan 2: Direktang Buksan sa Browser (No Server Needed)
I-double click lang ang **`index.html`** sa browser (Chrome, Edge, Firefox)!

---

## 👑 Paano Gamitin ang Admin Dashboard
1. Pumunta sa: **`admin.html`** (o i-click ang icon na **⚙️** sa kanang itaas ng laro).
2. Ilagay ang Admin Password:
   - **Default Password:** `admin123`
3. Sa loob ng dashboard, pwede mong:
   - 📷 **Palitan ang Litrato:** I-click ang "Baguhin ang Litrato" at pumili ng anumang larawan mula sa iyong cellphone o computer.
   - ✏️ **Palitan ang Pangalan:** I-type ang bagong pangalan ng character (hal. *Mark*, *Tatay*, *Bossing*).
   - 💾 I-click ang **"I-SAVE"** para mag-take effect agad sa laro!
   - 🔄 **I-Reset sa Default:** Ibalik ang orihinal na 9 mukha anumang oras.
   - 🗑️ **I-Clear ang Leaderboard:** Burahin ang mga dating score kung gusto mong magsimula ulit ng bagong tournament.

---

## ☁️ Paano I-upload sa Vercel

Dahil ang **Vercel** ay isang serverless platform:
1. **Static Files & Admin:** Direktang gagana ang buong laro, character selection, admin image uploads, at local scores kapag in-upload ang repository sa Vercel.
2. **Global Shared Leaderboard sa Vercel:**
   - Sa Vercel, ang serverless disk ay read-only kaya hindi pwedeng mag-save sa local `scores.json`.
   - Sa halip, madali itong ikonekta sa isang libreng cloud database tulad ng **Supabase**, **Firebase Firestore**, o **Upstash Redis (Vercel KV)** para iisang shared scoreboard ang makita ng lahat ng maglalaro online.
