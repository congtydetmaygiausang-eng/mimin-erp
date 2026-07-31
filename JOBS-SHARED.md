# 👥 JOBS-SHARED - Công việc chung giữa 2 AI

> **Mavis + Antigravity** cùng sử dụng - cần review khi sửa

---

## 🎯 Mục đích

File này liệt kê **các module/file CHUNG** mà cả 2 AI đều có thể cần đụng vào. Bất kỳ thay đổi nào đều phải:
1. Thông báo cho AI kia
2. Review kỹ trước khi merge
3. Ghi log vào `CHANGELOG-2AI.md`

---

## 📂 File CHUNG (cả 2 có thể sửa)

### Data layer
```
📁 apps/web/src/lib/data/
├── real-data.ts            (NHAN_SU, DOI_TAC, KHO_VAI, KHO_VAT_TU...)
├── workflow-data.ts        (PHIEU workflow 6 khâu)
├── real-workflow-data.ts    (ALL_REAL_PHIEU 12+ phiếu)
├── cong-no.ts              (PHAN_CONG, tinhCongNo...)
├── gia-cong-store.tsx      (Bộ 5 - Mavis sở hữu NHƯNG dùng chung)
├── khsx-store.tsx          (Đợt 4 - Mavis sở hữu NHƯNG dùng chung)
├── giao-hang-store.tsx     (Đợt 4 - Mavis sở hữu NHƯNG dùng chung)
├── kho-store.tsx           (Kho provider - dùng chung)
└── doi-soat-store.tsx      (Mavis sở hữu, Antigravity KHÔNG đụng)
```

### UI Components (cả 2 dùng)
```
📁 apps/web/src/components/
├── ui/
│   ├── ConfirmDialog.tsx
│   ├── PromptModal.tsx
│   ├── EmptyState.tsx
│   ├── Skeleton.tsx
│   ├── MobileCardView.tsx
│   ├── DateDisplay.tsx
│   ├── RoleBadge.tsx
│   ├── ScopeBadge.tsx
│   ├── ErrorBoundary.tsx
│   ├── CrudModal.tsx
│   ├── ImageUploader.tsx
│   └── index.ts (barrel)
├── layout/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   └── TopBar.tsx
└── providers.tsx           (11 providers - CẨN THẬN khi sửa)
```

### Helpers
```
📁 apps/web/src/lib/
├── bang-dieu-hanh-helper.ts  (Mavis - nhưng có thể dùng cho SX workflow)
├── workflow-filter.ts        (Mavis - dùng cho mọi workflow)
├── inventory-engine.ts       (Dùng cho kho - cả 2)
├── field-permission.ts       (Dùng cho form - cả 2)
├── personal-tasks.ts          (Cả 2)
└── formatVND (trong real-data.ts) - CẢ 2 dùng
```

### Config
```
📁 apps/web/next.config.ts
📁 apps/web/tailwind.config.ts
📁 apps/web/tsconfig.json
📁 apps/web/package.json (deps - cẩn thận khi thêm)
📁 apps/web/postcss.config.mjs
```

### Root files (docs)
```
📁 (root)
├── AGENTS.md             (conventions - cả 2 đọc)
├── WORKFLOW-2AI.md      (workflow 2 AI)
├── CHANGELOG-2AI.md     (master changelog)
├── CHANGELOG-Antigravity.md  (mirror cho Antigravity)
├── JOBS-MAVIS.md
├── JOBS-ANTIGRAVITY.md
├── JOBS-SHARED.md (file này)
├── sync-2ai.ps1         (script check trước khi code)
├── start-dev.ps1        (script chạy local)
├── HUONG_DAN_CHAY_APP.md
├── HUONG_DAN_CAI_PWA.md
├── KIEM_TRA_TRUOC_KHI_CHAY.md
```

## ⚠️ Quy tắc khi sửa file CHUNG

### Bước 1: Đọc file liên quan
- Đọc file hiện tại (không sửa lung tung)
- Check git log: `git log --oneline -- <file>`

### Bước 2: Báo AI kia
- Ghi vào `CHANGELOG-2AI.md`: "Mavis sắp sửa X để làm Y"
- Hoặc dùng user làm cầu nối (anh Sang)

### Bước 3: Tạo branch riêng
- `git checkout -b fix/<ten-file>` hoặc `feature/<ten-feature>`
- KHÔNG sửa thẳng trên main

### Bước 4: Sửa + commit + test
- Commit nhỏ, rõ ràng: `[mavis] data: update KHO_VAI them 5 mat hang`
- Test build: `npx tsc --noEmit && npm run build`
- Test trên browser (nếu là UI)

### Bước 5: Ghi log + báo user
- Update `CHANGELOG-2AI.md` với thay đổi
- Báo user → user review → merge

## 🔄 Đồng bộ dữ liệu (kiểm tra)

### Mục đích
Đảm bảo dữ liệu giữa 2 AI **KHÔNG xung đột**. Dữ liệu thật (`real-data.ts`, `workflow-data.ts`) là source of truth - cả 2 đều dùng chung.

### Cách verify
1. Chạy `check-sync.ps1` (sắp tạo) - script tự động:
   - Check `real-data.ts` không bị 2 AI sửa cùng lúc
   - Check `workflow-data.ts` tương thích
   - Check `package.json` không có version conflict
   - Báo cáo diff giữa 2 branch

2. Manual check:
   ```bash
   # So sánh file giữa 2 branch
   git diff main feature/ai-agents -- apps/web/src/lib/data/real-data.ts
   ```

### Quy tắc đồng bộ
- ✅ `real-data.ts` - Mavis sở hữu schema, Antigravity chỉ thêm data thuần
- ✅ `workflow-data.ts` - Mavis sở hữu structure, Antigravity thêm phiếu mới
- ✅ `KHO_VAI` - Antigravity thêm vải mới OK
- ✅ `KHACH_HANG_DATA` - Mavis thêm KH OK
- ❌ KHÔNG được rename key có sẵn
- ❌ KHÔNG được xóa data
- ❌ KHÔNG được đổi schema (TypeScript types)

## 📋 Bảng đồng bộ data (master)

| File | Owner | Schema | Data | Quy tắc |
|---|---|---|---|---|
| `real-data.ts` | Mavis | Mavis | Cả 2 | Schema Mavis, data cả 2 |
| `workflow-data.ts` | Mavis | Mavis | Cả 2 | Structure Mavis, phiếu cả 2 |
| `real-workflow-data.ts` | Mavis | Mavis | Cả 2 | Real-world data |
| `cong-no.ts` | Mavis | Mavis | Mavis | Mavis sở hữu hoàn toàn |
| `kho-store.tsx` | Shared | Shared | Cả 2 | Dùng chung |
| `inventory-engine.ts` | Mavis | Mavis | Cả 2 | Engine tính tồn kho |

## 🔧 Tích hợp (integration points)

### Antigravity AI tools cần data từ Mavis
```typescript
// Antigravity viết trong ai-tools.ts:
import { KHO_VAI, NHAN_SU } from "@/lib/data/real-data";
import { ALL_REAL_PHIEU } from "@/lib/data/real-workflow-data";

// → Mavis cần check: data structure có khớp không?
```

### Mavis UI cần AI agents từ Antigravity
```typescript
// Mavis có thể dùng AI agents từ Antigravity:
import { orchestrator } from "@/lib/ai-tools"; // Antigravity sở hữu
import { queryOrchestrator } from "@/app/api/v1/orchestrator/query/route"; // Antigravity sở hữu

// → Khi dùng, check API có tương thích không
```

## 🆘 Khi có xung đột thực sự

1. **DỪNG LẠI** cả 2
2. Báo **anh Sang (user)** quyết
3. KHÔNG tự resolve
4. Update `CHANGELOG-2AI.md` với conflict info

## 📞 Convention tên branch

| Tiền tố | Mục đích | VD |
|---|---|---|
| `feature/mavis-*` | Mavis feature mới | `feature/mavis-pwa` |
| `feature/antigravity-*` hoặc `feature/*` | Antigravity feature | `feature/ai-agents` |
| `fix/*` | Bug fix (ai cũng được) | `fix/login-error` |
| `hotfix/*` | Khẩn cấp | `hotfix/data-leak` |
| `chore/*` | Cleanup, docs | `chore/update-readme` |

---

**Maintained by**: Mavis + Antigravity
**Last updated**: 2026-08-01 (Mavis tạo file)
**Approved by**: Anh Sang (POLOMIMIN)
