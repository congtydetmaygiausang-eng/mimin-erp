# AGENTS.md - Hướng dẫn AI Agent cho MIMIN ERP

> File này **bắt buộc** Antigravity AI đọc khi khởi động session.
> Mục đích: AI hiểu context dự án, coding style, conventions, để ra code đúng chuẩn MIMIN.

---

## 🎯 Project Overview

**Tên dự án**: MIMIN ERP - Hệ thống quản lý sản xuất may mặc (Polomimin)

**Mô tả**: Web ERP cho nhà máy may, quản lý:
- Lệnh cắt (cutting orders) với bảng giá vốn Excel-style
- Khách hàng, nhà cung cấp, nhân sự
- Kho vải, kho phụ liệu (bo cổ, cúc, chỉ, dây kéo)
- Công nợ công đoạn (cắt, thêu, in, may áo, may quần, ủi)
- Bảng lương, chấm công
- Gia công ngoài (35 đối tác)
- Kế hoạch sản xuất theo tuần/tháng

**User chính**: A Cường - Chủ nhà máy, tiếng Việt, a-e style casual

---

## 🛠️ Tech Stack (KHÔNG thay đổi)

```json
{
  "framework": "Next.js 15.5.4 (App Router)",
  "runtime": "React 19",
  "language": "TypeScript 5.x (strict mode)",
  "styling": "Tailwind CSS 3.4 (utility-first)",
  "icons": "lucide-react (KHÔNG dùng heroicons/react-icons)",
  "theme": "next-themes (light/dark mode)",
  "toast": "sonner",
  "auth": "Supabase (mock trong dev, real khi deploy)",
  "data": "Static TypeScript files (real-data.ts, cong-no.ts)",
  "deployment": "Static export (output: 'export')",
  "domain": "Quản lý sản xuất may mặc Việt Nam"
}
```

---

## 📁 Project Structure

```
apps/web/src/
├── app/
│   ├── (auth)/login/           # Trang đăng nhập
│   └── (main)/                 # Tất cả 20 modules cần auth
│       ├── dashboard/
│       ├── lenh-cat/           # Module chính - cutting orders
│       ├── khach-hang/
│       ├── ke-hoach-san-xuat/
│       ├── nhan-su/
│       ├── kho-vai/
│       ├── kho-phu-lieu/
│       ├── nha-cung-cap/
│       ├── gia-cong-ngoai/
│       ├── bang-luong/
│       ├── cong-no/            # Công nợ công đoạn
│       └── ... (10 modules khác)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   └── ui/
│       ├── CrudModal.tsx
│       └── ImageUploader.tsx
├── lib/
│   ├── data/
│   │   ├── real-data.ts        # 17 NV, 35 NCC, 16 ĐTGC, 29 vải, 58 bo
│   │   └── cong-no.ts          # 9 phân công
│   └── supabase/client.ts
└── app/globals.css             # CSS variables + module-bg classes
```

---

## 🎨 Coding Conventions (BẮT BUỘC)

### **1. TypeScript**
- ✅ Luôn dùng `interface` hoặc `type` cho props
- ✅ KHÔNG dùng `any` - dùng `unknown` hoặc type cụ thể
- ✅ Export types từ file `lib/data/*` để dùng chung
- ✅ Dùng `as const` cho object literals quan trọng

### **2. React Components**
- ✅ Function components only (KHÔNG class components)
- ✅ Dùng `"use client"` directive khi cần hooks/state
- ✅ Tên file: `kebab-case.tsx` (vd: `lenh-cat/page.tsx`)
- ✅ Tên component: `PascalCase` (vd: `LenhCatPage`)
- ✅ Default export cho page components
- ✅ Named export cho reusable components

### **3. Tailwind CSS**
- ✅ Utility-first, KHÔNG viết CSS module riêng
- ✅ Dùng CSS variables: `bg-white/40`, `dark:bg-white/5`
- ✅ Spacing: 4px grid (p-4, m-2, gap-3)
- ✅ Colors: brand-*, slate-*, emerald-*, red-*, amber-*
- ✅ Mobile-first: mặc định mobile, dùng `md:`, `lg:` cho desktop

### **4. Data Format**
- ✅ Tiền Việt Nam: VND không có decimal, dùng `formatVND()` từ `real-data.ts`
- ✅ Ngày: ISO 8601 string (YYYY-MM-DD)
- ✅ ID: prefix theo loại (LC-M758, PC-M758-01, GS002, GC-TRU-001)
- ✅ Trạng thái: tiếng Việt ("Chờ giao", "Đang làm", "Hoàn thành")

### **5. Comments & Strings**
- ✅ UI text: **tiếng Việt** (không dấu cũng OK, nhưng có dấu chuẩn hơn)
- ✅ Code comments: tiếng Việt OK, tiếng Anh nếu technical
- ✅ User communication: a-e style casual

---

## 📊 Data thật (KHÔNG tự tạo, dùng data có sẵn)

```typescript
// Nhân sự (17 người)
import { NHAN_SU } from "@/lib/data/real-data";

// Đối tác gia công (35)
import { DOI_TAC } from "@/lib/data/real-data";

// Kho vải (29 mã)
import { KHO_VAI } from "@/lib/data/real-data";

// Kho phụ liệu (58 mã bo cổ, cúc, chỉ)
import { KHO_VAT_TU } from "@/lib/data/real-data";

// Phân công công đoạn (9 records cho M758 + M873)
import { PHAN_CONG, tinhCongNo, congNoTheoNguoi } from "@/lib/data/cong-no";
```

---

## 🚫 KHÔNG ĐƯỢC LÀM

1. ❌ **KHÔNG thay đổi** `next.config.ts` (đã config `output: 'export'`)
2. ❌ **KHÔNG thêm** middleware (`middleware.ts` đã tắt - conflict với static export)
3. ❌ **KHÔNG dùng** `any` type
4. ❌ **KHÔNG tạo** file data mới - thêm vào `real-data.ts` hoặc `cong-no.ts`
5. ❌ **KHÔNG đổi** icon library (đang dùng lucide-react)
6. ❌ **KHÔNG xóa** background images trong `public/bg/`
7. ❌ **KHÔNG dùng** default Tailwind colors (`bg-blue-500`) - dùng brand color

---

## ✅ NÊN LÀM

1. ✅ **Tái sử dụng** `<CrudModal>` cho mọi form CRUD
2. ✅ **Tái sử dụng** `<ImageUploader>` cho upload
3. ✅ **Module-specific backgrounds**:
   - Login: teal-cyan
   - Dashboard: sky-clouds
   - Lệnh cắt: teal-cyan
   - Khách hàng: sage-deep
   - Kế hoạch: moody-dark
   - Nhân sự: dandelion
   - Kho: sky-soft
   - Default: sky-soft
4. ✅ **Mobile responsive** với hamburger menu
5. ✅ **Format số tiền** dùng `formatVND()` và `formatVNDShort()`
6. ✅ **Add từ khóa "polomimin"** hoặc "mimin" vào comments khi cần

---

## 🗣️ Communication Style

- **User**: A Cường (anh Cường) - chủ nhà máy
- **AI Agent**: em (Mavis/Mavis)
- **Style**: a-e casual, thân thiện, tiếng Việt
- **Emoji**: dùng vừa phải, không lạm dụng
- **Format**: bảng, code block, danh sách có cấu trúc
- **Không dùng**: "rest assured", "great question", "hope this helps"

---

## 🔑 Demo Users (Supabase Auth)

```typescript
const DEMO_USERS = [
  { email: "admin@mimin.vn", password: "admin123", role: "Quản trị viên" },
  { email: "kehoach@mimin.vn", password: "kehoach123", role: "Kế hoạch" },
  { email: "sanxuat@mimin.vn", password: "sanxuat123", role: "Sản xuất" },
  { email: "kho@mimin.vn", password: "kho123", role: "Thủ kho" },
  { email: "qc@mimin.vn", password: "qc123", role: "QC" },
  { email: "giao@mimin.vn", password: "giao123", role: "Giao hàng" },
  { email: "viewer@mimin.vn", password: "viewer123", role: "Viewer" }
];
```

---

## 📝 Test Account

```
URL: http://localhost:3000
Email: admin@mimin.vn
Password: admin123
```

---

## 🐛 Known Issues / Constraints

1. **Middleware conflict**: `output: 'export'` KHÔNG support middleware → đã tắt
   - File `middleware.ts.bak` chứa code cũ
   - Dev local OK (vì middleware disabled)
   - Build production cần bật lại (xem README)

2. **No real database**: Data đang trong TypeScript files (mock)
   - Cần convert sang Supabase khi deploy thật
   - Pattern: localStorage + Supabase sync (xem memory)

3. **Static export**: KHÔNG support API routes, server actions
   - Phải dùng client functions
   - Phải có `index.html` ở root
   - `images.unoptimized: true`

---

## 🎯 Khi AI agent nhận task

1. **Đọc file liên quan** trước khi sửa
2. **Check existing patterns** trong code xung quanh
3. **Tái sử dụng** components có sẵn
4. **Test bằng cách** build + chạy thử
5. **Không phá vỡ** các module đang hoạt động
6. **Update** README.md nếu thay đổi setup
7. **Báo cáo** kết quả bằng tiếng Việt a-e style

---

**Project version**: v44 (2026-07-26)
**Built by**: Mavis (Mavis Agent for POLOMIMIN)
**User**: A Cường - polomimin.vn

---

## 🤖 MULTI-AI WORKFLOW (Mavis + Antigravity)

> **2 AI cùng làm 1 dự án** - đã có quy tắc phối hợp

### Nguyên tắc vàng
1. **KHÔNG code cùng file cùng lúc** - mỗi AI làm module riêng
2. **LUÔN đọc AGENTS.md + WORKFLOW-2AI.md trước khi code**
3. **LUÔN tạo branch riêng** trước khi push
4. **LUÔN tạo PR/merge request** để review
5. **Một người merge, một người review** - không tự merge code của mình

### Phân vùng trách nhiệm

| Module | Primary AI | Branch |
|---|---|---|
| ERP core (Cắt, May, Kho, Kế toán) | **Mavis** (MiniMax) | `main` |
| Module Sợi - Dệt - Nhuộm | **Antigravity** | `feature/soi-det-nhuom` |
| Mobile PWA / PUSH | **Mavis** | `main` |
| AI Agents integration | **Antigravity** | `feature/ai-agents` |
| Landing page / Marketing | **Antigravity** | `feature/landing` |

### Workflow code chung

```
1. Antigravity tạo branch: git checkout -b feature/ten-module
2. Antigravity code, commit, push branch
3. Antigravity báo Mavis review (qua chat hoặc note)
4. Mavis review code: check trùng, check convention
5. Nếu OK → Mavis merge vào main
6. Nếu conflict → 2 AI thảo luận trước khi merge
```

### Quy tắc commit

- **Format**: `[ai-name] module: mô tả ngắn`
- **VD**: `[mavis] doi-soat: thêm 7 trạng thái workflow tiền công`
- **KHÔNG push trực tiếp lên `main`** (phải qua branch + review)

### Conflict resolution

1. 2 AI báo cho anh Sang (user) biết conflict
2. Anh Sang quyết AI nào sửa, hoặc merge manual
3. KHÔNG tự ý sửa code của AI khác

### Liên lạc giữa 2 AI

- Qua user (anh Sang) - không tự nói chuyện
- User sẽ tổng hợp yêu cầu + push code cho cả 2
- Khi 1 AI xong → báo user → user chuyển cho AI kia review

**Last updated**: 2026-08-01 (Mavis append multi-AI section)

