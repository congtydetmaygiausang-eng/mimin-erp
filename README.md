# MIMIN ERP - Hệ thống quản lý sản xuất may mặc

> Next.js 15.5 + React 19 + TypeScript + Tailwind CSS 3.4
> Module: Lệnh cắt, Khách hàng, Kho vải/Phụ liệu, Công nợ công đoạn, Nhân sự, Nhà cung cấp, Gia công ngoài, Bảng lương...

---

## 🚀 Setup nhanh (5 phút)

### Yêu cầu
- **Node.js 18+** (LTS) — https://nodejs.org
- **VSCode** (khuyến nghị) — https://code.visualstudio.com
- **Git** (tuỳ chọn) — https://git-scm.com

### Bước 1: Cài Node.js
Tải Node.js LTS từ https://nodejs.org và cài đặt. Verify:
```bash
node -v    # cần v18.x trở lên
npm -v
```

### Bước 2: Mở project
```bash
# Giải nén MIMIN-ERP-files.zip (đã tải về từ Mavis)
unzip MIMIN-ERP-files.zip
cd mimin-erp/apps/web
code .   # mở VSCode
```

### Bước 3: Cài dependencies
```bash
npm install
# Lần đầu mất 2-3 phút (tải về ~500MB packages)
```

### Bước 4: Chạy dev mode
```bash
npm run dev
```
Mở trình duyệt: **http://localhost:3000**

### Bước 5: Login
```
Email:    admin@mimin.vn
Password: admin123
```

---

## 📁 Cấu trúc project

```
mimin-erp/
├── apps/web/                          ← Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css            ← Tailwind + CSS variables
│   │   │   ├── layout.tsx             ← Root layout
│   │   │   ├── page.tsx               ← Redirect → /dashboard
│   │   │   ├── (auth)/login/          ← Trang đăng nhập
│   │   │   └── (main)/                ← 20 modules (cần auth)
│   │   │       ├── dashboard/         ← Tổng quan
│   │   │       ├── lenh-cat/          ← Lệnh cắt (chi tiết nhất)
│   │   │       ├── khach-hang/        ← Khách hàng
│   │   │       ├── ke-hoach-san-xuat/ ← Kế hoạch SX
│   │   │       ├── nhan-su/           ← Nhân sự
│   │   │       ├── kho-vai/           ← Kho vải
│   │   │       ├── kho-phu-lieu/      ← Kho phụ liệu
│   │   │       ├── nha-cung-cap/      ← Nhà cung cấp
│   │   │       ├── gia-cong-ngoai/    ← Gia công ngoài
│   │   │       ├── bang-luong/        ← Bảng lương
│   │   │       ├── cong-no/           ← Công nợ công đoạn
│   │   │       └── ... (10 modules khác)
│   │   ├── components/
│   │   │   ├── providers.tsx          ← Theme + Toaster + QueryClient
│   │   │   ├── session-provider.tsx   ← Supabase Auth + 7 demo users
│   │   │   ├── DemoBanner.tsx
│   │   │   ├── PlaceholderPage.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx       ← Main shell + mobile state
│   │   │   │   ├── Sidebar.tsx        ← Desktop + Mobile drawer
│   │   │   │   └── TopBar.tsx         ← Hamburger menu (mobile)
│   │   │   └── ui/
│   │   │       ├── CrudModal.tsx      ← Generic form modal
│   │   │       └── ImageUploader.tsx  ← Drag & drop upload
│   │   └── lib/
│   │       ├── data/
│   │       │   ├── real-data.ts       ← 17 NV, 35 NCC, 16 ĐTGC, 29 vải, 58 bo
│   │       │   └── cong-no.ts         ← Phân công + công nợ
│   │       └── supabase/client.ts
│   ├── public/bg/                     ← 11 background JPGs
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.ts                 ← output: 'export' (static)
│   └── out/                           ← Build output (auto-generated)
├── DANH_SACH_TONG_HOP.xlsx            ← File Excel gốc
└── qa-test-module-nvl-v2.md           ← File QA test
```

---

## 📜 Các lệnh thường dùng

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev mode (hot-reload) tại localhost:3000 |
| `npm run build` | Build production tạo folder `out/` |
| `npm start` | Serve production build (cần `out/` đã build) |
| `npm run lint` | Check code style với ESLint |

---

## 🌍 Deploy lên server riêng

Sau khi `npm run build`, em có folder `out/` chứa static files. A có thể:

### **Cách 1: Vercel (miễn phí, nhanh nhất)**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### **Cách 2: Netlify (miễn phí)**
- Kéo thả folder `out/` lên https://app.netlify.com/drop

### **Cách 3: Nginx/VPS riêng**
```bash
# Copy folder out/ lên server
scp -r out/ user@server:/var/www/mimin-erp/

# Nginx config
server {
    listen 80;
    server_name erp.mimin.vn;
    root /var/www/mimin-erp;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

### **Cách 4: Cloudflare Pages**
- Push code lên GitHub → connect với Cloudflare Pages → auto deploy

---

## 🔑 7 demo users (Supabase Auth)

| Email | Password | Role |
|-------|----------|------|
| `admin@mimin.vn` | `admin123` | Quản trị viên |
| `kehoach@mimin.vn` | `kehoach123` | Kế hoạch |
| `sanxuat@mimin.vn` | `sanxuat123` | Sản xuất |
| `kho@mimin.vn` | `kho123` | Thủ kho |
| `qc@mimin.vn` | `qc123` | Kiểm tra chất lượng |
| `giao@mimin.vn` | `giao123` | Giao hàng |
| `viewer@mimin.vn` | `viewer123` | Xem (read-only) |

---

## 📊 Data thật đã nạp

- **17 nhân viên** (NHAN_SU) - có CCCD, SĐT, email, BHXH
- **35 đối tác gia công** (DOI_TAC) - 16 NCC vải + 19 xưởng may
- **29 mã vải** (KHO_VAI) - cotton, polyester, denim...
- **58 mã phụ liệu** (KHO_VAT_TU) - bo cổ, cúc, chỉ, dây kéo
- **9 phân công công đoạn** (PHAN_CONG) - mapping M758 + M873

---

## 🎨 Tech stack

- **Framework**: Next.js 15.5.4 (App Router) + Static Export
- **UI**: React 19, Tailwind CSS 3.4
- **Icons**: lucide-react
- **Theme**: next-themes (light/dark)
- **Toast**: sonner
- **Auth**: Supabase (mock mode trong dev, real API khi deploy)
- **Type safety**: TypeScript 5.x

---

## 🐛 Troubleshooting

### Lỗi `Module not found`
```bash
rm -rf node_modules .next out
npm install
npm run dev
```

### Lỗi port 3000 đã dùng
```bash
PORT=3001 npm run dev
```

### Build lỗi TypeScript
```bash
npm run build 2>&1 | tail -30
# Xem dòng lỗi cuối
```

### Reset toàn bộ
```bash
cd apps/web
rm -rf node_modules .next out
npm install
npm run dev
```

---

## 📞 Liên hệ support

- **Mavis Agent**: https://2pm5qun69lqz0.space.minimax.io (live preview)
- **Source code**: Tải từ conversation với Mavis
- **Background images**: Đã tối ưu JPG, mỗi file < 800KB

---

**MIMIN ERP v44** · 2026-07-26 · Built by Mavis (Mavis) for POLOMIMIN
