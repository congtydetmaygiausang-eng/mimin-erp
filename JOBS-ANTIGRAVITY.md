# 👤 JOBS-ANTIGRAVITY - Công việc cụ thể của Antigravity

> **AI Antigravity** - Phụ trách AI Agents, Workflow Sợi-Dệt-Nhuộm, Landing page

---

## 🎯 Vai trò

| | |
|---|---|
| **AI** | Antigravity |
| **Branch chính** | `feature/ai-agents`, `feature/soi-det-nhuom`, `feature/landing` |
| **Tên hiển thị** | Antigravity |

## 📂 Module phụ trách (ĐỘC QUYỀN)

```
✅ apps/web/src/lib/ai-tools.ts                    (function calling - 86 dòng)
✅ apps/web/src/components/FloatingAI.tsx          (chat panel - 91 dòng)
✅ apps/web/src/app/api/v1/orchestrator/query/route.ts  (API orchestrator)
✅ apps/web/src/app/(main)/agents/                 (AI agents page)
✅ apps/web/src/app/(main)/ai-assistant/           (AI assistant)
✅ apps/web/src/app/(main)/so-det-nhuom/           (Sợi-Dệt-Nhuộm cũ)
✅ apps/web/src/app/(main)/det-nhuom-flow/
✅ apps/web/src/app/(main)/soi-det-nhuom-erp/
✅ apps/web/src/app/(main)/mini-soi-det/
✅ apps/web/src/app/(main)/kho-soi-day-chuyen/
✅ apps/web/src/app/(main)/lenh-tong/              (Lệnh tổng)
✅ apps/web/src/app/(main)/flow-tong-quan/          (Flow tổng quan)
✅ CHECKLIST_VERIFY_V89.6.9.3.md                  (Antigravity tạo)
✅ D:\UX.UI\polomimin-erp-antigravity\             (Project HTML_APP riêng)
```

## 📊 CV đã hoàn thành

### Tích hợp Gemini AI (commit 33b613e1 - 2026-08-01)
- ✅ Tích hợp **Gemini AI** qua **Vercel AI SDK**
- ✅ Tạo `ai-tools.ts` (function calling cho AI agents - 86 dòng)
- ✅ Cập nhật `FloatingAI.tsx` (chat panel UI - 91 dòng)
- ✅ Tạo API route `/api/v1/orchestrator/query` (138 dòng)
- ✅ Cập nhật `package.json` (thêm @ai-sdk/google)
- ✅ Tạo `CHECKLIST_VERIFY_V89.6.9.3.md` (296 dòng - test checklist)
- ✅ Tạo `CHANGELOG-2AI.md` (mini version, 113 bytes - đã được Mavis update thành comprehensive)

### UI/UX Redesign (các commit cũ trước khi Mavis)
- ✅ `c205a427` - Add FloatingAI bubble (AI icon trên all pages)
- ✅ `467e9731` - Standardize modals bottom-sheet style
- ✅ `995ff2dd` - Apply bottom-sheet style to DTGC
- ✅ `78c558eb` - Responsive font-size 17px mobile / 16px desktop
- ✅ `603c12a6` - Add gradient hero banners
- ✅ `8f683a58` - Increase NVForm card height 97vh mobile
- ✅ `24c3c00d` - Fix modal scroll lock + ChiTietNhanSuModal
- ✅ `2588ae9b` - Redesign big Card Entry Modal with avatar uploader

### Build & Deploy
- ✅ Vercel Speed Insights + Analytics
- ✅ Next.js 15.5.4 + TypeScript 5.x
- ✅ GitHub Actions CI/CD 100% green

### Project cũ HTML_APP (D:\UX.UI\polomimin-erp-antigravity\)
- ✅ 186 files HTML/JS/Firebase
- ✅ Module Sợi-Dệt-Nhuộm
- ✅ `MASTER_BLUEPRINT_V2.md`
- ✅ `DATABASE_SCHEMA.md`

## 🎯 CV đang làm (WIP)

| Ngày bắt đầu | Module | Mô tả | Branch | Status |
|---|---|---|---|---|
| 2026-08-01 | Gemini integration | Tích hợp AI assistant toàn site | feature/ai-agents | 🟡 WIP |

## 🎯 CV sẽ làm (pending)

| Priority | Module | Mô tả | Branch đề xuất |
|---|---|---|---|
| 🔴 HIGH | workflow-sxn | Workflow Sợi-Dệt-Nhuộm module mới (từ MASTER_BLUEPRINT_V2) | `feature/soi-det-nhuom` |
| 🟡 MED | ai-agents-config | 9 agents config (ban-hang, ke-toan, kho, ky-thuat-may, nhan-su, san-xuat, soi-det, tai-chinh, theo-doi-cd) | `feature/ai-agents` |
| 🟡 MED | landing-page | Marketing landing page | `feature/landing` |
| 🟢 LOW | ai-tool-router | Route AI requests to right tool (tool calling) | `feature/ai-tools` |
| 🟢 LOW | prompt-library | Thư viện prompts cho từng role | `feature/prompt-lib` |

## 🚫 KHÔNG đụng vào (của Mavis)

- ❌ `apps/web/src/lib/data/doi-soat-store.tsx` (Đợt 5)
- ❌ `apps/web/src/lib/data/hoan-thien-store.tsx` (Đợt 6)
- ❌ `apps/web/src/lib/data/kho-mobile-store.tsx` (Đợt 7)
- ❌ `apps/web/src/lib/data/qc-store.tsx` (Đợt 8)
- ❌ `apps/web/src/lib/role-menu.ts` (Mavis sở hữu)
- ❌ `apps/web/src/lib/permission-matrix.ts` (Mavis sở hữu)
- ❌ `apps/web/src/lib/audit-log.ts` (Mavis sở hữu)
- ❌ Tất cả 22 routes Mavis (Đợt 5+6+7+8)
- ❌ `apps/web/public/manifest.json`, `sw.js` (PWA)
- ❌ `apps/web/public/icons/*` (PWA icons)
- ❌ `HUONG_DAN_*.md`, `start-dev.ps1` (Mavis docs)

## 📊 Thống kê

| Metric | Giá trị |
|---|---|
| **AI SDK** | Vercel AI SDK + Gemini |
| **Function tools** | 86 dòng (ai-tools.ts) |
| **API routes** | 1 (/api/v1/orchestrator/query) |
| **UI components** | 1 (FloatingAI.tsx) |
| **Test checklist** | 296 dòng (CHECKLIST_VERIFY_V89.6.9.3.md) |
| **HTML_APP project** | 186 files (HTML/JS/Firebase) |
| **Latest commit** | 33b613e1 (Gemini integration) |

## 🔗 Commits gần nhất

```
33b613e1 Integrate Gemini AI via Vercel AI SDK and connect to real data tools
c205a427 Add FloatingAI bubble - AI icon on all pages with chat panel, quick prompts, expand mode
467e9731 Standardize all modals to bottom-sheet card style matching nhan-su
995ff2dd Apply bottom-sheet card style to DTGC form and detail modals
78c558eb Responsive font-size (17px mobile/16px desktop), add bg-module
```

## 🤝 Tương tác với Mavis

- **Cùng dùng**: `real-data.ts`, `workflow-data.ts`, `components/ui/*`
- **Gửi PR**: Antigravity push branch → báo Mavis review
- **Conflict**: Báo user (anh Sang) quyết
- **File chung**: Update có review, không override

---

**Maintained by**: Antigravity
**Last updated**: 2026-08-01
**Approved by**: Anh Sang (POLOMIMIN)
