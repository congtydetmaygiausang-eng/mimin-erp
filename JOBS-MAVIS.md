# 👤 JOBS-MAVIS - Công việc cụ thể của Mavis (Mavis)

> **AI Mavis (MiniMax)** - Phụ trách ERP core, PWA, Deploy, Documentation

---

## 🎯 Vai trò

| | |
|---|---|
| **AI** | Mavis (Mavis) |
| **Engine** | MiniMax |
| **Branch chính** | `main`, `feature/mavis-*` |
| **Tên hiển thị** | Mavis |

## 📂 Module phụ trách (ĐỘC QUYỀN)

```
✅ apps/web/src/lib/data/doi-soat-store.tsx          (Đợt 5)
✅ apps/web/src/lib/data/hoan-thien-store.tsx        (Đợt 6)
✅ apps/web/src/lib/data/kho-mobile-store.tsx        (Đợt 7)
✅ apps/web/src/lib/data/qc-store.tsx                (Đợt 8)
✅ apps/web/src/lib/role-menu.ts                     (phân quyền 19 role)
✅ apps/web/src/lib/permission-matrix.ts             (15 action × 5 scope)
✅ apps/web/src/lib/audit-log.ts                     (15 action types)
✅ apps/web/src/lib/doi-soat-helper.ts
✅ apps/web/src/lib/hoan-thien-helper.ts
✅ apps/web/src/lib/kho-mobile-helper.ts
✅ apps/web/src/lib/qc-helper.ts
✅ apps/web/src/lib/bang-dieu-hanh-helper.ts        (Đợt 3)
✅ apps/web/src/lib/workflow-filter.ts               (Đợt 2)
✅ apps/web/src/app/(main)/doi-soat/                (Đợt 5)
✅ apps/web/src/app/(main)/doi-soat-tien-cong/      (Đợt 5)
✅ apps/web/src/app/(main)/trang-chu-hoan-thien/     (Đợt 6)
✅ apps/web/src/app/(main)/cong-viec-hoan-thien/     (Đợt 6)
✅ apps/web/src/app/(main)/ban-giao-hoan-thien/     (Đợt 6)
✅ apps/web/src/app/(main)/san-luong-hoan-thien/     (Đợt 6)
✅ apps/web/src/app/(main)/tien-cong-hoan-thien/     (Đợt 6)
✅ apps/web/src/app/(main)/trang-chu-kho/            (Đợt 7)
✅ apps/web/src/app/(main)/nhap-kho-mobile/          (Đợt 7)
✅ apps/web/src/app/(main)/xuat-kho-mobile/          (Đợt 7)
✅ apps/web/src/app/(main)/kiem-ke-mobile/           (Đợt 7)
✅ apps/web/src/app/(main)/lo-hang-mobile/           (Đợt 7)
✅ apps/web/src/app/(main)/trang-chu-qc/             (Đợt 8)
✅ apps/web/src/app/(main)/kiem-tra-cl/              (Đợt 8)
✅ apps/web/public/manifest.json                     (PWA)
✅ apps/web/public/sw.js                             (Service Worker)
✅ apps/web/public/icons/*                           (PWA icons 12+ files)
```

## 📊 CV đã hoàn thành (8 đợt phân quyền)

### Đợt 1: Nền tảng (2026-07-30)
- ✅ 8 components dùng chung: ConfirmDialog, PromptModal, EmptyState, Skeleton, MobileCard, DateDisplay, RoleBadge, ScopeBadge, ErrorBoundary
- ✅ Audit log mở rộng: 9 actions mới (receive, start, report_progress, handover, confirm, rework, lock, report_issue, request_support)
- ✅ Permission matrix: 15 action × 5 scope × 19 role
- ✅ Role menu: 30+ items filter theo role
- ✅ Sidebar refactor

### Đợt 2: Bộ 5 - NV Gia công (mobile-first)
- ✅ 5 pages: trang-chu-gia-cong, cong-viec, ban-giao, san-luong, tien-cong
- ✅ 1 store: gia-cong-store (mobile-first workflow)
- ✅ 1 helper: workflow-filter
- ✅ CongViecDetailModal (7 tab)

### Đợt 3: Bộ 2 - Bảng điều hành SX
- ✅ 1 page: bang-dieu-hanh-sx (8 KPI + 2 view LSX/Phieu)
- ✅ BangDieuHanhActions (6 modal: Assign/Extend/Revoke/Rework/Transfer/Approve)

### Đợt 4: KHSX + Giao hàng
- ✅ 2 pages: ke-hoach-san-xuat, giao-hang (refactor full CRUD)
- ✅ 2 stores: khsx-store, giao-hang-store

### Đợt 5: Bộ 3 - Kế toán & Đối soát
- ✅ 2 pages: doi-soat, doi-soat-tien-cong
- ✅ 1 store: doi-soat-store (7 trạng thái workflow tiền công)
- ✅ 1 helper: doi-soat-helper
- ✅ 4 modal: Payment, Khiếu nại, Detail, Confirm

### Đợt 6: Bộ 6 - Hoàn thiện
- ✅ 5 pages: trang-chu-hoan-thien, cong-viec-hoan-thien, ban-giao-hoan-thien, san-luong-hoan-thien, tien-cong-hoan-thien
- ✅ 1 store: hoan-thien-store (6 trạng thái KN/UI/DG)
- ✅ 1 helper: hoan-thien-helper

### Đợt 7: Bộ 7 - Kho (mobile-first)
- ✅ 5 pages: trang-chu-kho, nhap-kho-mobile, xuat-kho-mobile, kiem-ke-mobile, lo-hang-mobile
- ✅ 1 store: kho-mobile-store (phiếu nhập/xuất/kiểm kê)
- ✅ 1 helper: kho-mobile-helper

### Đợt 8: Bộ 8 - QC
- ✅ 2 pages: trang-chu-qc, kiem-tra-cl
- ✅ 1 store: qc-store (5 trạng thái + 6 loại lỗi)
- ✅ 1 helper: qc-helper

### Bonus: PWA + Deploy + Docs
- ✅ PWA setup: manifest.json (1.5KB) + sw.js (3.5KB) + 12+ icons
- ✅ Build production: 89 routes, 102KB First Load JS
- ✅ Deploy Vercel: https://mimin-erp.vercel.app/
- ✅ Hướng dẫn: HUONG_DAN_CHAY_APP.md, HUONG_DAN_CAI_PWA.md, KIEM_TRA_TRUOC_KHI_CHAY.md
- ✅ start-dev.ps1 (script PowerShell chạy nhanh)
- ✅ Multi-AI workflow: AGENTS.md, WORKFLOW-2AI.md, CHANGELOG-2AI.md, sync-2ai.ps1

## 🎯 CV đang làm (WIP)

| Ngày bắt đầu | Module | Mô tả | Branch | Status |
|---|---|---|---|---|
| (chưa có) | | | | |

## 🎯 CV sẽ làm (pending)

| Priority | Module | Mô tả | Branch đề xuất |
|---|---|---|---|
| 🔴 HIGH | api/supabase | Tạo API endpoints sync data | `feature/mavis-api-supabase` |
| 🟡 MED | dashboard-ceo | Dashboard tổng quan cho GĐ (9 role) | `feature/mavis-dashboard-ceo` |
| 🟡 MED | audit-log-polish | Filter + export + phân tích | `feature/mavis-audit-polish` |
| 🟢 LOW | supabase-enable | Bật sync Supabase thật | `feature/mavis-supabase-on` |
| 🟢 LOW | doc-api | Tài liệu API cho team | `feature/mavis-doc-api` |

## 🚫 KHÔNG đụng vào (của Antigravity)

- ❌ `apps/web/src/lib/ai-tools.ts` (Antigravity tạo)
- ❌ `apps/web/src/components/FloatingAI.tsx` (Antigravity maintain)
- ❌ `apps/web/src/app/api/v1/orchestrator/query/route.ts` (Antigravity)
- ❌ `apps/web/src/app/(main)/agents/` (AI agents của Antigravity)
- ❌ `apps/web/src/app/(main)/ai-assistant/` (AI assistant)
- ❌ `apps/web/src/app/(main)/so-det-nhuom/` (Sợi-Dệt-Nhuộm cũ)
- ❌ `apps/web/src/app/(main)/det-nhuom-flow/`
- ❌ `apps/web/src/app/(main)/soi-det-nhuom-erp/`
- ❌ `apps/web/src/app/(main)/mini-soi-det/`
- ❌ `apps/web/src/app/(main)/kho-soi-day-chuyen/`
- ❌ `D:\UX.UI\polomimin-erp-antigravity\` (project HTML_APP riêng)

## 📊 Thống kê

| Metric | Giá trị |
|---|---|
| **Routes mới** | 22 |
| **Stores mới** | 9 |
| **Helpers mới** | 9 |
| **Components mới** | 8 |
| **Providers** | 11 |
| **Pages total (build)** | 89+ |
| **Build size** | 102KB First Load |
| **TypeScript** | 0 errors |
| **Deploy** | ✅ Vercel live |
| **PWA** | ✅ 12+ icons + sw.js |

## 🔗 Commits gần nhất

```
cafc1252 [mavis] docs: them CHANGELOG-2AI.md (master) + CHANGELOG-Antigravity.md (rieng)
a0d1c8f0 [mavis] docs: them CHANGELOG-2AI.md + rename Antigravity version
2f5078a2 [mavis] docs: them sync-2ai.ps1 + cap nhat WORKFLOW-2AI.md (multi-AI workflow)
595ecaf9 [mavis] docs: them WORKFLOW-2AI.md va cap nhat AGENTS.md (multi-AI workflow)
```

---

**Maintained by**: Mavis (Mavis)
**Last updated**: 2026-08-01
**Approved by**: Anh Sang (POLOMIMIN)
