# 🤖 WORKFLOW-2AI - Quy trình làm việc giữa 2 AI

> **Mavis (MiniMax)** + **Antigravity** cùng code dự án MIMIN ERP

---

## 🎯 Mục tiêu

Hai AI (Mavis + Antigravity) làm chung dự án MIMIN ERP **KHÔNG trùng code, KHÔNG conflict, KHÔNG mất dữ liệu**.

## 👥 Phân vai

| AI | Vai trò | Module phụ trách |
|---|---|---|
| **Mavis** (Mavis) | MiniMax - Backend/Frontend chính | ERP core: Cắt, May, Kho, Kế toán, Đối soát, PWA |
| **Antigravity** | Antigravity AI - Module riêng | Sợi-Dệt-Nhuộm, AI Agents, Landing page |

## 📂 Quy tắc phân vùng (KHÔNG code overlap)

### Mavis KHÔNG đụng vào
- `apps/web/src/app/(main)/so-det-nhuom/` (module Sợi-Dệt-Nhuộm cũ)
- `apps/web/src/app/(main)/det-nhuom-flow/`
- `apps/web/src/app/(main)/soi-det-nhuom-erp/`
- `apps/web/src/app/(main)/mini-soi-det/`
- `apps/web/src/app/(main)/kho-soi-day-chuyen/` (module riêng)
- `apps/web/src/app/(main)/agents/` (AI agents của Antigravity)
- `apps/web/src/app/(main)/ai-assistant/`

### Antigravity KHÔNG đụng vào
- `apps/web/src/lib/data/doi-soat-store.tsx` (Đợt 5)
- `apps/web/src/lib/data/hoan-thien-store.tsx` (Đợt 6)
- `apps/web/src/lib/data/kho-mobile-store.tsx` (Đợt 7)
- `apps/web/src/lib/data/qc-store.tsx` (Đợt 8)
- `apps/web/src/lib/role-menu.ts` (Mavis sở hữu)
- `apps/web/src/lib/permission-matrix.ts` (Mavis sở hữu)
- `apps/web/src/app/(main)/doi-soat/`, `/doi-soat-tien-cong/`, `/trang-chu-hoan-thien/`, `/trang-chu-kho/`, `/kiem-tra-cl/` (Đợt 5+6+7+8)
- `apps/web/public/manifest.json`, `sw.js` (Mavis sở hữu)
- `HUONG_DAN_CAI_PWA.md`, `HUONG_DAN_CHAY_APP.md`

### File CHUNG (cả 2 có thể sửa, phải review)
- `apps/web/src/lib/data/real-data.ts` (data thật)
- `apps/web/src/lib/workflow-data.ts`, `real-workflow-data.ts` (workflow)
- `apps/web/src/components/providers.tsx` (cẩn thận - 11 providers)
- `apps/web/src/components/ui/*` (components dùng chung)
- `AGENTS.md`, `WORKFLOW-2AI.md` (file quy tắc)

## 🌿 Quy tắc Git Branch

```
main                              <- Production (cẩn thận, chỉ merge OK)
├── feature/soi-det-nhuom         <- Antigravity làm Sợi/Dệt/Nhuộm
├── feature/ai-agents              <- Antigravity làm AI agents
├── feature/landing                <- Antigravity làm landing page
├── feature/mavis-phan-quyen       <- Mavis làm phân quyền (Đợt 5-8)
├── feature/mavis-pwa              <- Mavis làm PWA
├── fix/xxx                        <- Fix bug (ai cũng được)
└── hotfix/xxx                     <- Khẩn cấp
```

## 📋 Quy trình commit

### Format
```
[ai-name] module: mô tả ngắn (max 72 chars)

- Chi tiết thay đổi 1
- Chi tiết thay đổi 2
- Refs: #issue (nếu có)
```

### Ví dụ
```
[mavis] doi-soat: thêm 7 trạng thái workflow tiền công

- Thêm store doi-soat-store.tsx (9.4KB)
- Thêm helper doi-soat-helper.ts
- Thêm 2 page: doi-soat, doi-soat-tien-cong
- Cập nhật role-menu.ts: thêm 2 menu items
- Cập nhật providers.tsx: wrap DoiSoatProvider
```

```
[antigravity] soi-det-nhuom: thêm module Sợi-Dệt-Nhuộm mới

- Tạo blueprint MASTER_BLUEPRINT_V2.md
- Thêm 3 collections Firestore
- Thêm 5 page Sợi/Dệt/Nhuộm
- Logic Anti-Negative Stock
```

## 🔄 Workflow code chung

### Khi Mavis cần sửa file Antigravity
1. ❌ **KHÔNG sửa trực tiếp**
2. Tạo file mới với prefix hoặc refactor sang module chung
3. Báo user → user chuyển cho Antigravity

### Khi Antigravity cần sửa file Mavis
1. ❌ **KHÔNG sửa trực tiếp**
2. Tạo issue/note
3. Báo user → user chuyển cho Mavis

### Khi cả 2 cùng cần sửa 1 file
1. Dừng lại
2. Báo user ngay
3. User quyết:
   - Option A: AI A sửa, AI B review
   - Option B: Chia nhỏ phần, mỗi AI sửa phần riêng
   - Option C: Hoãn lại

## 🚫 KHÔNG BAO GIỜ

1. ❌ Tự ý sửa code của AI khác
2. ❌ Push thẳng lên `main` (luôn qua branch)
3. ❌ Force push (`git push -f`) - mất lịch sử
4. ❌ Tạo file trùng tên với file của AI khác
5. ❌ Import trực tiếp từ file độc quyền của AI khác
6. ❌ Xóa code của AI khác (kể cả khi "không dùng")
7. ❌ Đổi package.json deps mà không thông báo

## ✅ NÊN LÀM

1. ✅ Commit thường xuyên (mỗi feature nhỏ = 1 commit)
2. ✅ Pull trước khi push (tránh conflict)
3. ✅ Test build sau khi code
4. ✅ Comment rõ ràng: `// @mavis` hoặc `// @antigravity` ở đầu file
5. ✅ Update AGENTS.md khi có quy tắc mới
6. ✅ Tạo branch riêng cho mỗi feature
7. ✅ Build OK trước khi báo user
8. ✅ Ghi log vào `CHANGELOG-2AI.md` sau mỗi thay đổi

## 🔍 Review checklist (khi review code AI khác)

Khi Mavis review code Antigravity (hoặc ngược lại):
- [ ] TypeScript không có lỗi
- [ ] Build OK
- [ ] Không trùng module
- [ ] Đúng convention (xem AGENTS.md)
- [ ] Không phá vỡ module hiện có
- [ ] Test trên browser
- [ ] Có audit log cho action quan trọng
- [ ] Có responsive mobile
- [ ] Đã ghi log vào CHANGELOG-2AI.md

## 📞 Quy trình báo cáo

### Khi xong task
```
✅ [antigravity] XONG: module X
- File mới: 5
- File update: 2
- Build: OK
- Test: OK
- Branch: feature/x
- Sẵn sàng review
- Đã ghi CHANGELOG-2AI.md
```

### Khi gặp lỗi
```
❌ [antigravity] LỖI: module X
- Lỗi: mô tả ngắn
- File liên quan: path/to/file
- Đề xuất: cần Mavis review hoặc cần Antigravity fix tiếp
```

## 🔄 Quy trình đồng bộ (MỚI - 2026-08-01)

### Trước khi code
1. **Đọc `CHANGELOG-2AI.md`** - xem AI kia đang làm gì
2. **Đọc `WORKFLOW-2AI.md`** - nhớ quy tắc
3. **Chạy `sync-2ai.ps1`** - check branch status + pending changes
4. **Tạo branch riêng** trước khi code
5. **Pull latest main** trước khi code

### Trong khi code
1. **Comment rõ ràng** - `// @mavis` hoặc `// @antigravity` ở đầu file
2. **KHÔNG đụng file của AI khác**
3. **Build thường xuyên** - check lỗi
4. **Commit nhỏ** - mỗi feature = 1 commit

### Sau khi code xong
1. **Build + test** kỹ
2. **Ghi log vào `CHANGELOG-2AI.md`** - format chuẩn
3. **Push branch** lên GitHub
4. **Báo user** - review qua user
5. **Đợi user merge** vào main
6. **KHÔNG tự merge** code của mình

### Conflict resolution
1. **DỪNG LẠI** ngay khi phát hiện conflict
2. **Báo user** - kèm mô tả conflict
3. **Đợi user quyết** - KHÔNG tự resolve
4. **Sau khi user quyết** - apply đúng hướng

## 🎯 Memory notes (cho cả 2 AI)

Đã có memory note 2026-07-12:
> "Anh Sang xác nhận thứ tự review khi 3 AI (Claude/MiniMax/Antigravity) push code lên - áp dụng cho mọi dự án"

**Thứ tự review**:
1. Antigravity push code
2. Mavis (MiniMax) review
3. Merge nếu OK

**Khi conflict**:
1. User (anh Sang) quyết
2. KHÔNG tự ý resolve

---

**Version**: 1.2
**Last updated**: 2026-08-01 (Mavis thêm Pause State)
**Maintainer**: Mavis (MiniMax) + Antigravity
**Approver**: Anh Sang (POLOMIMIN)

---

## ⏸️ PAUSE STATE (2026-08-01)

**Trạng thái**: Antigravity **TẠM DỪNG** — Mavis làm một mình.

**Lý do**: User (anh Sang) yêu cầu: *"a muôn e check lại du án và fix những lỗi để tạm thời antigravity ngừng 1 mình e làm"*

**Phạm vi pause**:
- Antigravity KHÔNG push code mới lên bất kỳ branch nào
- Antigravity KHÔNG review/sửa code Mavis
- Antigravity KHÔNG tạo issue/note mới

**Mavis tự quản lý trong thời gian pause**:
- ✅ Mavis CÓ THỂ review + fix code Antigravity đã push (vd: Vercel AI SDK v7 compatibility)
- ✅ Mavis CÓ THỂ merge `feature/ai-agents` → `main` nếu an toàn
- ✅ Mavis CÓ THỂ tiếp tục các đợt tiếp theo (vd: Tier 1.5-1.10 từ memory)
- ❌ Mavis KHÔNG push code Antigravity ownership mà KHÔNG review kỹ (vd: agents/AI mới)

**Quy trình resume** (khi user gỡ pause):
1. Mavis báo cáo tổng state hiện tại cho Antigravity
2. Antigravity pull latest + đọc CHANGELOG-2AI.md
3. Antigravity review các commit Mavis đã push trong thời gian pause
4. Hai AI đồng bộ lại task list

**Commit gần nhất trong pause period** (tham khảo Antigravity khi resume):
- `dd2c11b6` [mavis] fix(ai-tools): Vercel AI SDK v7 API - parameters → inputSchema, bỏ _options parameter
- `aea8458f` [mavis] docs: them JOBS-MAVIS/ANTIGRAVITY/SHARED + check-sync.ps1
- `cafc1252` [mavis] docs: them CHANGELOG-2AI.md (master) + CHANGELOG-Antigravity.md (rieng)
- `a0d1c8f0` [mavis] docs: them CHANGELOG-2AI.md + rename Antigravity version
- `2f5078a2` [mavis] docs: them sync-2ai.ps1 + cap nhat WORKFLOW-2AI.md (multi-AI workflow)
- `595ecaf9` [mavis] docs: them WORKFLOW-2AI.md va cap nhat AGENTS.md (multi-AI workflow)
- `33b613e1` Antigravity: Integrate Gemini AI via Vercel AI SDK and connect to real data tools
- `c205a427` Antigravity: Add FloatingAI bubble - AI icon on all pages with chat panel, quick prompts, expand mode

**Resume trigger**: User nói "antigravity làm tiếp" / "gỡ pause" / tương tự.
