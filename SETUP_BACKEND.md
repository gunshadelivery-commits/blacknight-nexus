# คู่มือตั้งค่า Backend ร้าน (Siam Cannabis อ่อนนุช)

ทำตามขั้นตอนนี้ครั้งเดียว แล้ว **หน้า admin จะเพิ่ม/แก้ไข/ลบสินค้าได้จริง** และหน้าร้านจะแสดงสินค้าของคุณเอง

> ทำไมต้องทำ: ตอนนี้หน้าร้านดึงสินค้าจากชีตสาธารณะของ Gunsha (อ่านได้อย่างเดียว เขียนไม่ได้)
> เมื่อตั้งชีต + Apps Script ของคุณเองเสร็จ ทั้งหน้าร้านและ admin จะชี้มาที่ชีตเดียวกันของคุณ → จัดการได้เต็มที่

---

## ขั้นที่ 1 — สร้าง Google Sheet ของร้าน

1. ไปที่ https://sheets.new สร้างไฟล์ใหม่ ตั้งชื่อไฟล์ว่า `Siam Cannabis อ่อนนุช - Data`
2. สร้าง **แท็บ (tab ด้านล่าง)** ให้ครบ 4 แท็บ โดยตั้งชื่อให้ตรงเป๊ะ:
   - `Products`
   - `Orders`
   - `BankAccounts`
   - `Users`
3. ในแท็บ **`Products`** ใส่หัวคอลัมน์แถวแรก (A1 ถึง J1) ตามลำดับนี้:

   | name | size | price | note | image | tags | status | stock | sold_count | category |
   |------|------|-------|------|-------|------|--------|-------|------------|----------|

   แล้วเพิ่มสินค้าทีละแถว เช่น:

   | White Truffle | 1G | 65 | กลิ่นหอมแรง เนื้อแน่น | https://... | Hybrid | มีของ | 100 | 0 | Hybrid |

   - `tags` / `category` ใส่คำว่า `Sativa` / `Indica` / `Hybrid` / `Pre-roll` / `อุปกรณ์` เพื่อให้เข้าหมวดในหน้าร้าน
   - `image` วางลิงก์รูป (อัปโหลดที่ https://imgbb.com แล้วก็อปลิงก์ direct)
   - อยากได้สินค้าเริ่มต้นเร็วๆ: เปิดชีต Gunsha (อ่านได้) คัดลอกแถวที่ต้องการมาวางได้เลย

---

## ขั้นที่ 2 — วางสคริปต์ Apps Script

1. ในไฟล์ Google Sheet ของคุณ ไปเมนู **Extensions → Apps Script**
2. ลบโค้ดเดิมทั้งหมด แล้ววางเนื้อหาจากไฟล์ [`GoogleAppsScript.js`](GoogleAppsScript.js) ในโปรเจกต์นี้ลงไป
3. แก้ค่าด้านบนสุดของสคริปต์:
   ```js
   const SPREADSHEET_ID = "วาง ID ชีตของคุณ";   // เอาจาก URL ชีต docs.google.com/spreadsheets/d/<<ID>>/edit
   const SHEET_PRODUCTS = "Products";            // ให้ตรงกับชื่อแท็บ
   const NOTIFY_EMAIL   = "อีเมลรับแจ้งออเดอร์";  // ปัจจุบันตั้งไว้ ped.siraphob@gmail.com
   const SHOP_NAME      = "Siam Cannabis อ่อนนุช";
   ```
4. กด **Save** (ไอคอนแผ่นดิสก์)

---

## ขั้นที่ 3 — Deploy เป็น Web App

1. กดปุ่ม **Deploy → New deployment**
2. เลือกชนิด (เฟือง ⚙️) → **Web app**
3. ตั้งค่า:
   - **Execute as:** `Me` (บัญชีคุณ)
   - **Who has access:** `Anyone`
4. กด **Deploy** → อนุญาตสิทธิ์ (กด Authorize / เลือกบัญชี / Allow)
5. คัดลอก **Web app URL** ที่ลงท้ายด้วย `/exec` เก็บไว้

> ทุกครั้งที่แก้โค้ด Apps Script ต้อง **Deploy → Manage deployments → แก้ deployment เดิม → Version: New version** เพื่อให้ URL เดิมอัปเดต

---

## ขั้นที่ 4 — เอา URL ชีตสินค้า (CSV)

1. **สินค้า (Products):** เปิดแท็บ Products → คัดลอก URL แบบนี้ (แทน `<ID>`):
   ```
   https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Products
   ```
2. ต้องเปิดสิทธิ์ให้อ่านได้: **Share → General access → Anyone with the link → Viewer**

> ออเดอร์**ไม่**อ่านผ่าน CSV แล้ว (เป็นข้อมูลลูกค้า) หน้า admin ดึงผ่าน Apps Script `getOrders` หลังล็อกอิน — ดูหัวข้อ PRIVATE_SHEET_ID ด้านล่าง

---

## ขั้นที่ 5 — ใส่ค่าลงไฟล์ `.env`

เปิดไฟล์ [`.env`](.env) แล้วแก้ 3 บรรทัดนี้ให้เป็นของคุณ:

```env
VITE_SHEET_CSV_URL=<< URL Products CSV จากขั้น 4 >>
VITE_GAS_URL=<< Web app /exec URL จากขั้น 3 >>
VITE_LINE_OA_ID=@your-line-id      # เปลี่ยนเป็น LINE OA จริงของร้าน
```

จากนั้น build ใหม่:
```bash
npm run build
```

> สำคัญ: Vite ฝังค่า `.env` ตอน build ถ้าแก้แล้วไม่อัปเดต ให้ลบ cache ก่อน: `rm -rf node_modules/.vite dist` แล้ว `npm run build`

---

## เสร็จแล้วตรวจสอบ

- หน้าร้าน (`index.html`) → เห็นสินค้าของคุณเอง จัดหมวดถูก
- หน้า admin (`admin.html`, รหัสผ่าน = `ADMIN_KEY` ใน Script Properties ของ Apps Script) → **เพิ่ม/แก้/ลบสินค้าได้จริง** และมีผลกับหน้าร้าน
- สั่งซื้อทดสอบ 1 ออเดอร์ → เข้ามาที่แท็บ Orders และมีอีเมลแจ้งเตือน

ติดตรงไหนบอกได้เลย เดี๋ยวช่วยไล่ทีละขั้น 🌿

---

## ตั้งรหัสแอดมิน (ADMIN_KEY) — จำเป็น

ตั้งแต่เวอร์ชันนี้ คำสั่งที่เขียนข้อมูล (`addProduct`, `updateProduct`, `deleteProduct`, `updateStatus`, `saveSettings`, `saveBank`, `clearProducts`) **ต้องมีรหัสแอดมิน** ไม่งั้น Apps Script จะตอบ `UNAUTHORIZED`

ส่วนคำสั่งของลูกค้า (`getProducts`, `getBank`, `register`, `login`, `log`) ยังเปิดตามปกติ ร้านขายได้เหมือนเดิม

### วิธีตั้ง
1. เปิด Apps Script ของร้าน → **Project Settings** (ไอคอนเฟือง)
2. เลื่อนลงหา **Script Properties** → **Add script property**
3. Property = `ADMIN_KEY` · Value = รหัสที่สุ่มมา ยาว 20 ตัวขึ้นไป
4. **Deploy → Manage deployments → แก้ไข → Version: New version → Deploy**

> ถ้ายังไม่ตั้ง `ADMIN_KEY` ระบบจะปฏิเสธคำสั่งแอดมินทั้งหมดไว้ก่อน (ปลอดภัยกว่าเปิดทิ้งไว้) — หน้าร้านยังขายได้ปกติ

### เข้าหน้า admin
ใช้รหัสเดียวกับ `ADMIN_KEY` — หน้าเว็บจะส่งไปให้ Apps Script ตรวจ ไม่ได้เทียบในเบราว์เซอร์อีกแล้ว
รหัสเก็บใน `sessionStorage` ปิดแท็บแล้วหลุดเอง

**ลบ `VITE_ADMIN_PASSWORD` ออกจาก `.env` ได้เลยหลังตั้ง `ADMIN_KEY` เสร็จ** (ค่าเดิมถูก build ฝังลงไฟล์ JS ที่ใครก็เปิดดูได้)

---

## แยกข้อมูลลูกค้าออกจากไฟล์สาธารณะ (PRIVATE_SHEET_ID)

ไฟล์ชีตหลักต้องแชร์แบบ "ทุกคนที่มีลิงก์" เพื่อให้หน้าร้านดึง CSV สินค้าได้ — แปลว่า**ทุกแท็บในไฟล์นั้นอ่านได้สาธารณะ** จึงย้ายแท็บ `Orders` (ข้อมูลลูกค้า) และ `Users` (อีเมล + รหัสแฮช) ไปไว้สเปรดชีตส่วนตัวที่ไม่แชร์ใคร

1. สร้างสเปรดชีตใหม่ (บัญชีเดียวกับ Apps Script) → **ไม่ต้องแชร์**
2. คัดลอกแท็บ `Orders` และ `Users` จากไฟล์หลักไปไฟล์ใหม่ แล้วเปลี่ยนชื่อให้ตรงเป๊ะ
3. แถวแรกของ `Orders` ต้องเป็นหัวตาราง:
   `วันที่-เวลา | ชื่อลูกค้า | เบอร์โทร | ที่อยู่ | ลิงก์แผนที่ | รายการสินค้า | ยอดรวม | ลิงก์สลิป | วิธีชำระ | สถานะ`
   และของ `Users`: `Timestamp | Name | Email | PasswordHash | Status`
4. Script Properties → เพิ่ม `PRIVATE_SHEET_ID` = รหัสไฟล์ใหม่ (จาก URL) → Deploy เวอร์ชันใหม่
5. ทดสอบครบแล้วค่อย**ลบแท็บ Orders/Users ออกจากไฟล์หลัก** และลบ secret `VITE_ORDERS_CSV_URL` ใน GitHub (ไม่ใช้แล้ว)

> ยังไม่ตั้ง `PRIVATE_SHEET_ID` ระบบจะใช้ไฟล์หลักตามเดิม — deploy ก่อนย้ายแท็บได้อย่างปลอดภัย
> หน้า admin อ่านออเดอร์ผ่าน `getOrders` (ต้องมี `ADMIN_KEY`) แทนการอ่าน CSV สาธารณะแล้ว
