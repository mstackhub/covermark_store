# COVERMARK Store Locator Web App (Turso libSQL Edition)

ระบบค้นหาสาขา (Store Locator) สำหรับแบรนด์ **COVERMARK** โดยใช้ **Turso (libSQL)** เป็น Database หลัก (Single Source of Truth) เชื่อมต่อผ่าน **Server-side API Backend** และแสดงผลผ่าน **Frontend (HTML/CSS/Vanilla JS + Leaflet.js)**

---

## 1. System Architecture

```text
COVERMARK Store Locator (Browser)
      │
      │ GET /api/branches (Cached & Safe, No Database Secrets)
      ▼
Server-side API (Node.js / Express / Vercel Serverless)
      │
      │ Server-side Secret (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN)
      ▼
Turso Cloud Database (Tokyo Region: covermark-store)
      │
      ▼
Table `branches` (Indexed by status, store, province)
```

### 🔒 Security Guarantee
* **ห้ามเชื่อมต่อ Turso จาก Browser โดยตรง**: ไม่มี Database Token หรือ Database URL หลุดไปที่ Client / DevTools
* Token และ Database URL ถูกเก็บเป็น **Environment Variables (`.env`)** บน Server เท่านั้น
* Public API รองรับเฉพาะ **`GET /api/branches`** (Read-only) โดยมีระบบ In-Memory Caching 5 นาที เพื่อประสิทธิภาพความเร็วสูง (<100ms)

---

## 2. Database Schema (Turso / libSQL)

```sql
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  store TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  province TEXT NOT NULL,
  floor TEXT,
  phone TEXT,
  lat REAL,
  lng REAL,
  map_url TEXT,
  status TEXT NOT NULL DEFAULT 'Active'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
CREATE INDEX IF NOT EXISTS idx_branches_store ON branches(store);
CREATE INDEX IF NOT EXISTS idx_branches_province ON branches(province);
CREATE INDEX IF NOT EXISTS idx_branches_active_location ON branches(status, province, store);
```

---

## 3. Quick Start & Setup

### ขั้นตอนที่ 1: ติดตั้ง Dependencies
```bash
npm install
```

### ขั้นตอนที่ 2: ตั้งค่า Turso Database
1. ติดตั้ง [Turso CLI](https://docs.turso.tech/cli/installation) (หากยังไม่ได้ติดตั้ง):
   ```bash
   brew install tursodatabase/tap/turso # สำหรับ macOS
   ```
2. ล็อกอินเข้าสู่บัญชี Turso:
   ```bash
   turso auth login
   ```
3. สร้าง Database ใน Region **Tokyo (nrt)**:
   ```bash
   turso db create covermark-store --location nrt
   ```
4. ดู Database URL และสร้าง Auth Token:
   ```bash
   turso db show covermark-store --url
   turso db tokens create covermark-store
   ```
5. สร้างไฟล์ `.env` ใน root directory:
   ```bash
   cp .env.example .env
   ```
   แล้วนำค่า URL และ Token มาใส่ใน `.env`:
   ```env
   TURSO_DATABASE_URL=libsql://covermark-store-YOUR-SUBDOMAIN.turso.io
   TURSO_AUTH_TOKEN=your-token-here
   PORT=3000
   ```

### ขั้นตอนที่ 3: Run Database Migration & Seed
```bash
# สร้าง Table และ Indexes
npm run db:migrate

# นำเข้าข้อมูลสาขาเริ่มต้น (Upsert Mode)
npm run db:seed
```

หรือรันพร้อมกันในคำสั่งเดียว:
```bash
npm run db:setup
```

### ขั้นตอนที่ 4: Start Web Server
```bash
# Development Mode (Auto reload)
npm run dev

# หรือ Production Mode
npm start
```
เปิดบราวเซอร์ที่: **`http://localhost:3000`**

---

## 4. API Specification

### `GET /api/branches`
ดึงรายชื่อสาขาที่มีสถานะ `Status = 'Active'` ทั้งหมด เรียงตามกลุ่มห้าง (`store`) และชื่อสาขา (`branch_name`)

**Response ตัวอย่าง:**
```json
{
  "success": true,
  "count": 14,
  "data": [
    {
      "id": "C001",
      "store": "Central",
      "branchName": "ห้างเซ็นทรัล ชิดลม",
      "province": "กรุงเทพมหานคร",
      "floor": "1",
      "phone": "080-070-5220",
      "lat": 13.7443044841007,
      "lng": 100.544279322671,
      "mapUrl": "https://maps.app.goo.gl/Chidlom"
    }
  ]
}
```

---

## 5. Deployment Options

### ตัวเลือก A: Deploy บน Vercel (แนะนำ - Serverless & Free)
1. ติดตั้ง Vercel CLI หรือ Import โปรเจกต์ผ่าน Dashboard ของ Vercel
2. กำหนด **Environment Variables** ในหน้าตั้งค่าโปรเจกต์บน Vercel:
   * `TURSO_DATABASE_URL`
   * `TURSO_AUTH_TOKEN`
3. โปรเจกต์มี Handler [`api/branches.js`](file:///Users/raomark/Desktop/WebApp/covermark%20store/api/branches.js) พร้อมทำงานเป็น Serverless API อัตโนมัติ

### ตัวเลือก B: Deploy บน Node Server / Render / Railway / Docker
1. Push โค้ดขึ้น GitHub Repository
2. เชื่อมต่อกับบริการโฮสติ้ง (เช่น Render / Railway)
3. กำหนด Environment Variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `PORT`
4. ตั้งค่า Build Command: `npm install` และ Start Command: `npm start`
