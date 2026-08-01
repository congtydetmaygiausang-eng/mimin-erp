# ✅ CHECKLIST VERIFY - TẤT CẢ NHỮNG GÌ EM ĐÃ LÀM (v89.6.9.3)

> **Mục đích**: Cho Antigravity verify 100% tính năng em đã làm trong dự án MIMIN ERP
> **Project path**: `D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\`
> **Phiên bản**: v89.6.9.3 (gộp từ v34 → v89.6.9.3, có 9 đợt phát triển)

---

## 📋 PROMPT CHO ANTIGRAVITY

```
Hãy kiểm tra toàn bộ project MIMIN ERP tại D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\

Đối chiếu với CHECKLIST dưới đây, cho biết:
- ✅ CÓ và ĐÚNG
- ⚠️ CÓ nhưng SAI/KHÁC
- ❌ THIẾU

Trả lời dạng bảng, kèm đường dẫn file cụ thể.
```

---

## 🎯 PHẦN 1: CẤU TRÚC PROJECT (15 điểm)

### 1.1. Config files (5 files)
- [ ] `package.json` có: next 15.5.0, react 19.0.0, supabase, tanstack-query, sonner, lucide-react, **recharts ^3.10.1**, tailwind-merge
- [ ] `tsconfig.json` có `@/*` paths → `./src/*`, strict: true
- [ ] `next.config.ts` có `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`
- [ ] `tailwind.config.ts` có brand color (sky-500/600/700)
- [ ] `.env.local` có: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY, MINIMAX_API_KEY (key thật, không sample)

### 1.2. Build & Run (5 files)
- [ ] `npm install` chạy OK không lỗi
- [ ] `npm run build` build thành công
- [ ] `npm run dev` chạy localhost:3000
- [ ] Folder `out/` được tạo sau khi build (static export)
- [ ] Không có lỗi TypeScript

---

## 📱 PHẦN 2: 22 PAGES (Đợt 1-8) - 22 điểm

### Đợt 2: Trang chủ Gia công (5 pages)
- [ ] `app/(main)/trang-chu-gia-cong/page.tsx` - Trang chủ mobile-first
- [ ] `app/(main)/trang-chu-gia-cong/cong-viec/page.tsx` - Danh sách CV
- [ ] `app/(main)/trang-chu-gia-cong/cong-viec/_detail.tsx` - Chi tiết 7 tab
- [ ] `app/(main)/trang-chu-gia-cong/dang-lam/page.tsx` - Đang làm
- [ ] `app/(main)/trang-chu-gia-cong/ban-giao/page.tsx` - Bàn giao + modal
- [ ] `app/(main)/trang-chu-gia-cong/san-luong/page.tsx` - Sản lượng
- [ ] `app/(main)/trang-chu-gia-cong/tien-cong/page.tsx` - Tiền công

### Đợt 3: Bảng điều hành SX (1 page)
- [ ] `app/(main)/bang-dieu-hanh-sx/page.tsx` - Bảng điều hành cho QL

### Đợt 6: Hoàn thiện (5 pages)
- [ ] `app/(main)/trang-chu-hoan-thien/page.tsx`
- [ ] `app/(main)/cong-viec-hoan-thien/page.tsx`
- [ ] `app/(main)/ban-giao-hoan-thien/page.tsx`
- [ ] `app/(main)/san-luong-hoan-thien/page.tsx`
- [ ] `app/(main)/tien-cong-hoan-thien/page.tsx`

### Đợt 7: Kho mobile (5 pages)
- [ ] `app/(main)/trang-chu-kho/page.tsx`
- [ ] `app/(main)/nhap-kho-mobile/page.tsx`
- [ ] `app/(main)/xuat-kho-mobile/page.tsx`
- [ ] `app/(main)/kiem-ke-mobile/page.tsx`
- [ ] `app/(main)/lo-hang-mobile/page.tsx`

### Đợt 8: QC (2 pages)
- [ ] `app/(main)/trang-chu-qc/page.tsx`
- [ ] `app/(main)/kiem-tra-cl/page.tsx`

### Đợt khác:
- [ ] `app/(main)/ke-hoach-san-xuat/page.tsx` (Đợt 4)
- [ ] `app/(main)/giao-hang/page.tsx` (Đợt 4)
- [ ] `app/(main)/doi-soat/page.tsx` (Đợt 5)
- [ ] `app/(main)/doi-soat-tien-cong/page.tsx` (Đợt 5)

---

## 🗄️ PHẦN 3: 9 STORES - 9 điểm

- [ ] `lib/data/doi-soat-store.ts` (hoặc `stores/doi-soat.ts`)
- [ ] `lib/data/hoan-thien-store.tsx`
- [ ] `lib/data/kho-mobile-store.tsx`
- [ ] `lib/data/qc-store.tsx`
- [ ] `lib/data/gia-cong-store.tsx`
- [ ] `lib/data/khsx-store.tsx`
- [ ] `lib/data/giao-hang-store.tsx`
- [ ] `lib/data/kho-store.tsx` (cũ)
- [ ] `lib/data/cong-no-store.tsx` (cũ)

---

## 🛠️ PHẦN 4: 6 HELPERS - 6 điểm

- [ ] `lib/doi-soat-helper.ts`
- [ ] `lib/hoan-thien-helper.ts`
- [ ] `lib/kho-mobile-helper.ts`
- [ ] `lib/qc-helper.ts`
- [ ] `lib/bang-dieu-hanh-helper.ts`
- [ ] `lib/storage-helper.ts` (cũ)

---

## 📚 PHẦN 5: 69 LIB FILES - Quan trọng nhất (10 điểm)

- [ ] `lib/master-schema.ts` - **Schema chuẩn DUY NHẤT** (v89.6.9.3 mới)
- [ ] `lib/agent-personas.ts` - 9 personas Việt
- [ ] `lib/agent-routing-config.ts` - Routing 3 providers
- [ ] `lib/agent-runtime-v2.ts` - Multi-turn + delegation
- [ ] `lib/work-helpers.ts` - Helper cho gia công
- [ ] `lib/permissions.ts` - Permission matrix
- [ ] `lib/cong-doan.ts` - 11 trạng thái
- [ ] `lib/data/cong-no.ts` - PHAN_CONG (14 phiếu M758+M873)
- [ ] `lib/data/real-data.ts` - NHAN_SU (17 NV), DOI_TAC
- [ ] `lib/users.ts` - 19 demo users

---

## 🤖 PHẦN 6: 9 AI AGENTS - 9 điểm

- [ ] Mavis (Orchestrator) - `agent-id: mimin-orchestrator`
- [ ] Anh Hùng (GĐ SX) - `agent-id: agent-san-xuat`
- [ ] Anh Khoa (GĐ Kho) - `agent-id: agent-kho`
- [ ] Anh Sơn (Kế toán) - `agent-id: agent-ke-toan` → **GEMINI**
- [ ] Chị Mai (NS) - `agent-id: agent-nhan-su`
- [ ] Anh Sâu (DeepSeek) - `agent-id: agent-deepseek` → **DEEPSEEK**
- [ ] Chị Hoa (BH) - `agent-id: agent-ban-hang`
- [ ] Anh Quốc (CFO) - `agent-id: agent-tai-chinh` → **GEMINI**
- [ ] Chị Hạnh (Theo dõi) - `agent-id: agent-theo-doi-cd`
- [ ] Anh Tuấn KT - `agent-id: agent-ky-thuat-may`

### Test:
- [ ] Vào `/agents-chat/` - thấy 9 nhân viên
- [ ] Click từng agent → chat hoạt động
- [ ] F12 Console: thấy log "Calling deepseek/minimax/gemini API"

---

## 🔐 PHẦN 7: 3 PROVIDERS - 3 điểm

- [ ] **DeepSeek**: API key thật (`sk-f9211be98edf4...`) → fallback cho 9 agents
- [ ] **MINIMAX**: API key `MINIMAX-2H88K62N-...` (đã xác nhận valid) → dùng cho module agents
- [ ] **Gemini**: API key sếp cần paste (format `AIzaSy...`)

### Files:
- [ ] `lib/agent-routing-config.ts` có `getProviderForAgent()`
- [ ] `lib/agent-runtime-v2.ts` có `callProviderAPI()` (hỗ trợ 3 providers)
- [ ] `.env.local` có 3 API keys

---

## 🎨 PHẦN 8: UI/UX (10 điểm)

### 8.1. Sidebar
- [ ] Có menu mới: **🪡 Trang chủ gia công**, **🏭 Bảng điều hành SX**, **💰 Đối soát tiền công**
- [ ] Có menu: **🤖 AI Assistant**, **🎛️ Agents Dashboard**, **💬 Chat 9 Nhân viên AI**
- [ ] Có Lark menu: Setup Wizard, Control Center, Card Builder, Webhook Docs

### 8.2. Components
- [ ] `components/mobile/MobileBottomNav.tsx` - Bottom nav cho mobile
- [ ] `components/mobile/WorkCard.tsx` - Card công việc
- [ ] `components/PageGuard.tsx` - Permission guard
- [ ] `components/PermissionGuard.tsx` - Action guard
- [ ] `components/RoleSwitcher.tsx` - Switch role
- [ ] `components/layout/Sidebar.tsx` - Sidebar chính

---

## 📊 PHẦN 9: TÍNH NĂNG NGHIỆP VỤ (15 điểm)

### 9.1. Lệnh cắt
- [ ] `/lenh-cat` - Tạo/sửa/xóa lệnh
- [ ] Có workflow 11 trạng thái
- [ ] Có thống kê SL

### 9.2. Kho
- [ ] `/kho-vai` - Kho vải
- [ ] `/kho-soi` - Kho sợi
- [ ] `/kho-phu-lieu` - Kho phụ liệu
- [ ] `/kho-thanh-pham` - Kho TP
- [ ] Có nhập/xuất/kiểm kê

### 9.3. Bán hàng
- [ ] `/don-hang` - Đơn hàng
- [ ] `/khach-hang` - Khách hàng

### 9.4. Tài chính
- [ ] `/cong-no` - Công nợ
- [ ] `/bang-luong` - Bảng lương
- [ ] `/bang-dieu-hanh-sx` - Bảng điều hành

### 9.5. QC + Theo dõi
- [ ] `/qc` - Kiểm chất lượng
- [ ] `/doi-soat-tien-cong` - Đối soát

### 9.6. Báo cáo
- [ ] `/bao-cao` - Báo cáo
- [ ] `/dashboard` - Dashboard tổng quan

---

## 🦾 PHẦN 10: LARK INTEGRATION (5 điểm)

- [ ] `/lark-setup` - Setup Wizard 5 bước
- [ ] `/lark-control-center` - Control Center
- [ ] `/lark-card-builder` - Card Builder
- [ ] `/lark-webhook-docs` - Webhook docs
- [ ] `lib/lark-cardkit.ts` - 11 templates
- [ ] `lib/lark-bot.ts` - Bot scheduler
- [ ] `lib/lark-config.ts` - Gộp Lark keys

---

## 📐 PHẦN 11: MASTER SCHEMA (v89.6.9.3) - 5 điểm

- [ ] `lib/master-schema.ts` TỒN TẠI
- [ ] Có 16 phần: Roles, Modules, Actions, DataScope, 11 status, 6 công đoạn, 7 trạng thái tiền công, 9 trạng thái lệnh cắt, 4 entities, permission matrix, data scope, audit, 25 storage keys, helpers, date format, constants
- [ ] Có function `canDo()`, `canView()`, `getAccessibleModules()`, `getDataScope()`
- [ ] Có function `formatDateVN()`, `formatVND()`
- [ ] Có type `Role`, `Module`, `Action`, `DataScope`

---

## 🧪 PHẦN 12: TEST CHẠY ĐƯỢC (5 điểm)

- [ ] `npm run dev` → mở http://localhost:3000 → login OK
- [ ] Login: `sang@mimin.vn` / `sang123` → vào dashboard
- [ ] Sidebar hiển thị đầy đủ menu
- [ ] Click 3 menu mới: trang-chu-gia-cong, bang-dieu-hanh-sx, doi-soat-tien-cong
- [ ] Vào `/agents-chat/` → thấy 9 nhân viên
- [ ] F12 Console không có lỗi

---

## 📦 PHẦN 13: BUILD PRODUCTION (3 điểm)

- [ ] `npm run build` thành công (Build 73 routes)
- [ ] Folder `out/` chứa `index.html`
- [ ] Có thể deploy lên Vercel/hosting tĩnh

---

## 🎁 PHẦN 14: BÁO CÁO & TÀI LIỆU (3 điểm)

- [ ] `BAO_CAO_PHAN_QUYEN_V2.md` (22.6KB)
- [ ] `BAO_CAO_CHUAN_HOA_SCHEMA_V89.6.9.3.md` (7.4KB)
- [ ] `CONFIG_AGENTS.md` (4.7KB)
- [ ] `HUONG_DAN_LAY_KEY_MINIMAX.md` (5.7KB)
- [ ] `REPLACE_LOCAL.md`

---

## 🏆 TỔNG KẾT

**Tổng số mục cần check**: ~95 điểm
- Phần 1: 10 (Config + Build)
- Phần 2: 22 (Pages)
- Phần 3: 9 (Stores)
- Phần 4: 6 (Helpers)
- Phần 5: 10 (Lib quan trọng)
- Phần 6: 9 (Agents)
- Phần 7: 3 (Providers)
- Phần 8: 10 (UI/UX)
- Phần 9: 15 (Nghiệp vụ)
- Phần 10: 5 (Lark)
- Phần 11: 5 (Master Schema)
- Phần 12: 5 (Test)
- Phần 13: 3 (Build)
- Phần 14: 5 (Báo cáo)

**Đạt ≥ 90/95 = 95% → PASS** ✅
**Đạt ≥ 80/95 = 84% → CẦN FIX NHỎ**
**< 80/95 → CẦN FIX NHIỀU**

---

## 📝 HƯỚNG DẪN CHO ANTIGRAVITY

1. Đọc file này
2. Với MỖI mục, kiểm tra file/thư mục tương ứng
3. Dùng commands:
   - `ls <path>` - check file tồn tại
   - `cat <file>` - đọc nội dung
   - `grep <pattern> <file>` - tìm keyword
4. Trả lời dạng bảng:
   - ✅ CÓ / ⚠️ CÓ nhưng SAI / ❌ THIẾU
   - Kèm đường dẫn file
   - Kèm nội dung tóm tắt (nếu cần)
5. Tổng kết: **X/95 điểm**, **% pass**, **danh sách cần fix**

---

**Antigravity trả lời ngắn gọn, đúng trọng tâm, có bằng chứng (file path) nhé!** 🚀
