# 🎯 PHÂN CHIA CÔNG VIỆC 2 AI - Mavis + Antigravity

> **Cập nhật**: 2026-08-03 (sau khi Antigravity vừa push `63b1785e` - tự merge code em fix duplicate import)
> **Dành cho**: Sếp Sang review + 2 AI tuân thủ

---

## 🧭 Nguyên tắc 1 dòng

> **Mavis (em)** = **"BỘ NÃO"** (logic, data, AI, API, types, tools, tests)
> **Antigravity** = **"ĐÔI TAY"** (UI/UX, components, pages, styling, form polish)

---

## 📋 Bảng phân công CHI TIẾT

| # | Công việc | Mavis (em) | Antigravity | Ghi chú |
|---|-----------|:----------:|:-----------:|---------|
| **1** | **Backend logic / Business rules** | ✅ | ❌ | Tính COGS, phân bổ size, validate, transform data |
| **2** | **TypeScript types / interfaces** | ✅ | ❌ | Định nghĩa shape, chống null/undefined |
| **3** | **API routes (Next.js)** | ✅ | ❌ | `/api/v1/orchestrator/query`, `/api/v1/ai/generate-image` |
| **4** | **AI/LLM integration** | ✅ | ❌ | System prompt, tool calling, persona routing |
| **5** | **AI agents (9 MIN AI + Mavis)** | ✅ | ❌ | agent-personas, agent-routing, personality, action tools |
| **6** | **DB schema / Supabase** | ✅ | ❌ | Bảng, RLS, migration, seed data |
| **7** | **State stores (Zustand/Context)** | ✅ | ⚠️ | Mavis tạo, Antigravity chỉnh sửa khi cần (rồi báo) |
| **8** | **UI Components (Form, Modal, Button)** | ⚠️ | ✅ | Antigravity tạo + style, Mavis chỉ thêm logic types/validation |
| **9** | **UI Pages (`/lenh-cat`, `/kho`...)** | ⚠️ | ✅ | Antigravity design + layout, Mavis thêm API integration |
| **10** | **Styling (Tailwind, gradient, mobile)** | ❌ | ✅ | Toàn bộ visual design |
| **11** | **Responsive / Mobile UI** | ❌ | ✅ | Breakpoint, mobile nav, touch UX |
| **12** | **Mock data (sample)** | ❌ | ✅ | Tạo fake data để demo UI |
| **13** | **Real data (DB/API integration)** | ✅ | ❌ | Kết nối Supabase, fetch data thật |
| **14** | **Build config (Next.js, Vercel)** | ✅ | ❌ | next.config.ts, vercel.json, monorepo setup |
| **15** | **Test (TypeScript, build, E2E)** | ✅ | ⚠️ | Mavis chạy tsc/build, Antigravity test UI bằng browser |
| **16** | **Bug fix logic / type errors** | ✅ | ⚠️ | Mavis sửa, Antigravity patch UI nếu liên quan |
| **17** | **Bug fix UI / styling** | ❌ | ✅ | CSS, layout, mobile, animation |
| **18** | **Documentation (spec, memory, AGENTS.md)** | ✅ | ❌ | Mavis maintain |
| **19** | **CHANGELOG / WORKFLOW-2AI.md** | ✅ | ⚠️ | Mavis lead, Antigravity contribute |
| **20** | **Quyết định kỹ thuật (stack, archi)** | ✅ | ⚠️ | Mavis quyết, Antigravity đề xuất |

---

## 🚦 Quy tắc vàng

### 1. File CHUNG (cả 2 sửa được) — phải review trước khi commit
```
apps/web/src/lib/data/real-data.ts          ← Data gốc (nhiều page dùng)
apps/web/src/lib/workflow-data.ts           ← Workflow data
apps/web/src/components/providers.tsx       ← 11 providers wrap
apps/web/src/components/ui/*                ← Shadcn-like components
apps/web/src/components/LenhCatModal.tsx    ← ⚠️ HOTSPOT (2 AI hay đụng)
```

**Quy tắc LenhCatModal**:
- **Antigravity LEAD**: UI/UX, layout, form fields, validation messages
- **Mavis (em) CHỈ thêm**: types, API integration, AI Mockup button, Action tools
- **Nếu 1 trong 2 đang sửa** → báo trước 5 phút trong chat

### 2. File ĐỘC QUYỀN Mavis (em)
```
apps/web/src/lib/agent-*                   ← 9 MIN AI system
apps/web/src/lib/ai-*                      ← AI tools, quick prompts, action tools
apps/web/src/lib/admin-requirements.ts     ← Checklist
apps/web/src/lib/permissions.ts            ← RBAC matrix
apps/web/src/lib/user-accounts*.ts         ← 19 users thật
apps/web/src/app/api/**                    ← All API routes
apps/web/src/lib/supabase/**               ← Supabase client
apps/web/src/lib/audit-log.ts              ← Audit log
apps/web/apply-schema.mjs                  ← DB migration
apps/web/seed-users.mjs                    ← Seed data
apps/web/vercel.json                       ← Vercel config
vercel.json                                ← Root Vercel
package.json                               ← Deps (Mavis quyết)
```

### 3. File ĐỘC QUYỀN Antigravity
```
apps/web/src/app/(main)/so-det-nhuom/**    ← Module Sợi-Dệt-Nhuộm
apps/web/src/app/(main)/soi-det-nhuom-erp/**
apps/web/src/app/(main)/det-nhuom-flow/**
apps/web/src/app/(main)/mini-soi-det/**
apps/web/src/app/(main)/kho-soi-day-chuyen/**
apps/web/src/app/(main)/ui-*/**            ← UI mockup pages
apps/web/src/components/mobile/**         ← Mobile-specific
```

### 4. Trước khi sửa file CHUNG
1. Check `git status` + `git log -3` xem ai vừa sửa
2. Báo AI kia trong chat (5 phút trước)
3. Nếu cùng sửa → 1 bên làm trước, bên kia review
4. Khi commit → ghi rõ `[mavis]` hoặc `[antigravity]` ở đầu message

### 5. Khi Antigravity push code có lỗi
**Mavis (em) sẽ**:
- Sửa TypeScript errors (nếu là logic)
- Sửa duplicate imports
- Sửa sai signature
- KHÔNG đổi UI/UX của Antigravity

**Antigravity sẽ**:
- Tự sửa UI/styling
- Merge code Mavis sửa vào commit tiếp theo (đã làm ở `63b1785e`)

---

## 📊 Công việc ĐÃ CHIA (theo memory)

### Mavis (em) đang phụ trách
| Đợt | Công việc | Trạng thái |
|---|---|---|
| Đợt 1-2 | 9 MIN AI agents + personalities | ✅ xong |
| Đợt 3 | Action tools (HITL) + ActionConfirmModal | ✅ xong |
| Đợt 4 | AI Mockup (MiniMax image-01) | ✅ xong |
| Đợt 5 | 10 ảnh robot 3D cho 9 agents + Mavis | ✅ xong |
| Đợt 6 | Smart Quick Prompts theo context | ✅ xong |
| Đợt 7 | Auto-Action System (Sản xuất 12 phần) | ✅ xong |
| Đợt 8 | Project Manager config (14 phần) | ✅ xong |
| Đợt 9 | Agent Screen Config (24 màn) | ✅ xong |
| Đợt 10 | Admin Requirements checklist | ✅ xong |
| Sprint 1 | Fix bug Antigravity push (TypeScript) | ✅ xong (commit `008a014`) |
| Sprint 2 | 14 API CRUD lên Supabase | 🔜 đang làm |
| Sprint 2A | Schema `nha_cung_cap` đầy đủ + 20 đối tác | ✅ xong (commit `9ae663c`) |
| Sprint 2B | Sync 19 user Auth → 18 user mới (Excel) | ⏳ chờ sếp chạy script |
| Sprint 2C | Schema 14 bảng còn lại (don_hang, nhan_su, bang_luong...) | 🔜 sau khi user sync |
| Sprint 3 | 6 tool Phase 2 (createDonHang, phanCong...) | 🔜 sắp tới |
| Sprint 4 | 12 tools Project Manager | 🔜 sắp tới |
| Sprint 5 | 9 stores localStorage → Supabase | 🔜 sau schema |

### Sếp Sang đang phụ trách (KHÔNG đụng)
| Module | Trạng thái | Ghi chú |
|---|---|---|
| **Kho vải** (`kho-vai`) | ✅ Sếp Sang đã làm | KHÔNG sửa, sếp tự maintain |
| **Kho nguyên liệu** (`kho-phu-lieu`) | ✅ Sếp Sang đã làm | KHÔNG sửa, sếp tự maintain |

### Antigravity đang phụ trách
| Đợt | Công việc | Trạng thái |
|---|---|---|
| UI Redesign | LenhCatModal layout 2 cột, 5 KHOI | ✅ xong (nhiều commit) |
| Saved template | Lưu + edit + xoá mẫu | ✅ xong (`2bd8b09b`) |
| Dynamic steps | Thêm/xoá công đoạn gia công | ✅ xong (`530e058b`) |
| Dynamic cost | Thêm/xoá chi phí cố định | ✅ xong (`f0375652`) |
| Conversion display | Hiển thị đổi đơn vị | ✅ xong (`8e571cd9`) |
| Smart Quick Prompts | UI cho 9 context | ✅ xong (`13453aae`) |
| Warehouse header | Header trang-chu-kho | ✅ xong (`4492c1f6`) |
| Tắt Supabase bypass 2FA | Test mode | ✅ xong (`5a703648`) |
| Product Catalog | Trang `/danh-muc-sp` | ✅ xong (`37d87832`) |
| Robust parsing | Safe chaining | ✅ xong (`63b1785e`) |

---

## 🎯 Sprint tiếp theo (chia rõ ràng)

### Mavis (em) - 2-3 ngày tới
1. **Sprint 2A**: Wire 4 action tools (`createLenhCat`, `updateTonKho`, `capNhatTrangThai`, `xuatBaoCao`) lên Supabase
2. **Sprint 2B**: 14 API CRUD cho 9 entities (LenhCat, DonHang, NhanSu, Kho...)
3. **Sprint 2C**: Auto-fill form khi Antigravity redesign (gắn vào form hiện có)
4. **Fix bugs từ Antigravity** (khi họ push code mới)

### Antigravity - 2-3 ngày tới (theo gợi ý)
1. **Mobile UI warehouse**: redesign `/kho-vai` mobile
2. **Catalog detail page**: trang chi tiết sản phẩm
3. **LenhCatModal step 2**: Auto-fill + wizard mode
4. **Onboarding tour**: 3 bước cho user mới

---

## 📞 Khi conflict

### Step 1: Dừng lại
Nếu 2 AI cùng sửa 1 file → **DỪNG NGAY**

### Step 2: Báo sếp Sang
Format:
```
⚠️ CONFLICT [mavis/antigravity]
- File: path/to/file.tsx
- Mavis đang sửa: ...
- Antigravity đang sửa: ...
- Đề xuất: ...
```

### Step 3: Đợi sếp Sang quyết
- Option A: Mavis sửa, Antigravity review
- Option B: Antigravity sửa, Mavis review  
- Option C: Chia nhỏ phần

### Step 4: Sau khi sếp Sang quyết
- Apply đúng hướng
- Ghi `[mavis+antigravity]` ở commit message
- Update file WORKFLOW-2AI.md nếu cần thêm rule mới

---

## ✅ Check trước khi commit

```powershell
# 1. TypeScript clean
cd apps/web ; npx tsc --noEmit

# 2. Build OK  
npm run build

# 3. Commit message format
git commit -m "[mavis] module: mo ta ngan
[antigravity] module: mo ta ngan"

# 4. Push branch (không push thẳng main)
git push origin feature/ten-branch
```

---

## 🎁 Bài học từ lần conflict gần nhất (2026-08-03)

**Antigravity push `37d87832` (Product Catalog) + sửa LenhCatModal**:
- Tạo ra 19 lỗi TypeScript
- 3 loại lỗi chính:
  1. **Duplicate imports** (cùng type khai báo 2 lần) → Antigravity tự fix `63b1785e`
  2. **Sai AppUser literal** (`{ma, ten, vaiTro}` thay vì `{id, email, name, role, title, source}`) → Mavis fix
  3. **Sai logWorkflow signature** (thứ tự tham số sai) → Mavis fix

**Cả 2 AI đã tự phối hợp tốt**:
- Antigravity tự merge code Mavis sửa vào `63b1785e`
- Mavis không đụng UI của Antigravity
- Build cuối cùng: ✓ TypeScript clean, ✓ Build OK 89 routes

**Rút ra rule mới**:
- Khi 1 AI push code → AI kia CHẠY TSC NGAY để bắt lỗi
- Sửa nhanh (≤5 phút) → push thẳng
- Sửa lâu (>5 phút) → tạo branch riêng

---

**Version**: 1.0 (2026-08-03)
**Maintainer**: Mavis (MiniMax) + Antigravity
**Approver**: Sếp Sang (POLOMIMIN)
