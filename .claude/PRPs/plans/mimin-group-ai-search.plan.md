# Plan: MIMIN GROUP AI Search Overhaul

## Summary
Đập đi xây lại module tìm kiếm AI (Sourcing) của MIMIN GROUP. Loại bỏ sự cồng kềnh từ các layer audit (DR0-DR9, API0-API8), tập trung vào một luồng tìm kiếm web đơn giản, sau đó đưa qua LLM với JSON Schema nghiêm ngặt để bóc tách 100% chính xác Tên công ty, SĐT, Email, MST và Địa chỉ của các xưởng B2B (loại bỏ bán lẻ).

## User Story
As a Mimin Group Planner, I want AI tìm kiếm trả về chính xác nhà máy/nhà cung cấp B2B cùng đầy đủ thông tin liên hệ, so that tôi có thể dễ dàng liên hệ sản xuất mà không phải lọc bỏ các cửa hàng bán lẻ rác.

## Problem → Solution
- **Current state**: Hệ thống nặng 200KB chỉ cho 1 file (`search-engine.ts`), chạy qua hàng chục luồng audit thừa thãi. LLM prompt không ép kiểu dữ liệu dẫn đến rơi rớt SĐT, MST. Trả về nhiều shop bán lẻ (Shopee, Facebook).
- **Desired state**: Hệ thống nhẹ gọn (~15KB). Gọi Google/Brave API -> Gọi LLM với `response_format: { type: "json_schema" }` để ép buộc trả về đúng format. Chặn mọi domain bán lẻ/tuyển dụng.

## Metadata
- **Complexity**: Large (Ảnh hưởng đến toàn bộ tính năng tìm AI).
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: ~50 files bị xóa, 2 files bị chỉnh sửa (`search-engine.ts`, `route.ts`).

---

## UX Design

### Before
```
[User Chat] -> AI Proxy -> Tools Route -> Search Engine -> (DR0-DR9, API0-API8) -> Web Search -> LLM Extract (Prompt mờ nhạt) -> Trả về kết quả thiếu SĐT, dính bán lẻ
```

### After
```
[User Chat] -> AI Proxy -> Tools Route -> Search Engine (Clean) -> Web Search -> LLM Extract (JSON Schema: Phone, TaxCode, B2B_Only) -> Trả về kết quả chuẩn B2B
```

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `apps/web/src/lib/sourcing/search-engine.ts` | All | Nơi chứa logic hiện tại cần đập bỏ và viết lại |
| P1 (important) | `apps/web/src/app/api/v1/mimin-group/agent/tools/route.ts` | All | Định nghĩa Tool gọi AI |
| P2 (reference) | `apps/web/src/app/api/v1/mimin-group/agent/chat/route.ts` | All | AI Chat Interface |

## Patterns to Mirror

### ERROR_HANDLING
```typescript
// SOURCE: apps/web/src/lib/sourcing/search-engine.ts
export class SourcingSearchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SourcingSearchError";
    this.status = status;
  }
}
// Throw error: throw new SourcingSearchError("Lỗi kết nối", 500);
```

### LOGGING_PATTERN
```typescript
// SOURCE: apps/web/src/app/api/v1/mimin-group/agent/tools/route.ts
console.error(`[mimin-group-agent-tools] search_partners role=${role} failed:`, error);
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `apps/web/src/lib/sourcing/dr*` | DELETE | Bloat code (10+ files) không có tác dụng thực tế |
| `apps/web/src/lib/sourcing/api*` | DELETE | Bloat code (9+ files) không có tác dụng thực tế |
| `apps/web/src/lib/sourcing/search-engine.ts` | UPDATE | Viết lại `runSourcingSearch` tối giản |
| `apps/web/src/app/api/v1/mimin-group/agent/chat/route.ts` | UPDATE | Bổ sung description cho tool để loại trừ Bán lẻ |

## NOT Building
- Không xây dựng UI/UX mới cho trang Frontend.
- Không can thiệp vào các API khác ngoài phạm vi Agent Chat của MIMIN GROUP.

---

## Step-by-Step Tasks

### Task 1: Gỡ bỏ mã nguồn cồng kềnh (Clean Bloat)
- **ACTION**: Xóa toàn bộ file `dr0` -> `dr9` và `api0` -> `api8` trong `apps/web/src/lib/sourcing`.
- **VALIDATE**: Thư mục sạch sẽ, chỉ còn lại các file config lõi.

### Task 2: Cập nhật Tool Description chặn Bán lẻ
- **ACTION**: Sửa `TOOLS` object trong `api/v1/mimin-group/agent/chat/route.ts`.
- **IMPLEMENT**: Trong tool `search_partners`, thêm hướng dẫn bắt buộc: `"YÊU CẦU: Chỉ tìm nhà máy, xưởng gia công, nhà cung cấp sỉ (B2B). TUYỆT ĐỐI BỎ QUA các kết quả bán lẻ, thương mại điện tử, việc làm."`

### Task 3: Viết lại luồng `runSourcingSearch`
- **ACTION**: Đập đi xây lại `apps/web/src/lib/sourcing/search-engine.ts`.
- **IMPLEMENT**: 
  - Khôi phục hàm `runSourcingSearch`.
  - Thay vì gọi 20 layer audit, chỉ gọi hàm `searchBraveWeb` để lấy data.
  - Sau khi có data, gọi DeepSeek/MiniMax bằng **Structured Output** để bóc tách json `{ "legalName": string, "phone": string, "taxCode": string, "email": string, "address": string, "isB2B": boolean }`. Nếu `isB2B` = false thì loại.
- **VALIDATE**: Biên dịch không lỗi (`npm run build`).

---

## Acceptance Criteria
- [ ] Xóa bỏ thành công các file `dr` và `api` bloat.
- [ ] Code compile thành công.
- [ ] Luồng tìm kiếm mới trích xuất được `phone`, `taxCode`, `email`.
- [ ] Tự động loại bỏ kết quả bán lẻ.

## Verification Commands
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors
