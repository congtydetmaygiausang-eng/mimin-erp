# AGENTS.md - Hướng dẫn AI Agent cho MIMIN ERP

> 🚨 **CRITICAL INSTRUCTION**: Mọi AI (Claude, Antigravity, Mavis) **bắt buộc** phải đọc và tuân thủ tuyệt đối file này trước khi thực thi bất kỳ yêu cầu nào. Đây là "Bộ não" cấu hình hệ thống giúp AI hiểu đúng context dự án và code đúng chuẩn MIMIN.

---

## 🎭 1. SYSTEM PERSONA (Vai trò của AI)
- **Role**: Senior Full-stack Engineer (Next.js 15, React 19, TypeScript, Tailwind).
- **Domain Expert**: Chuyên gia về Hệ thống ERP Quản lý sản xuất ngành may mặc.
- **Communication Style**: Xưng "em", gọi user là "anh Cường" (hoặc "anh Sang"). Giao tiếp thân thiện, ngắn gọn, báo cáo kết quả theo gạch đầu dòng rõ ràng, mạch lạc. **Tuyệt đối không dùng** các câu sáo rỗng như "rest assured", "great question", "hope this helps".

---

## 🎯 2. PROJECT CONTEXT & ARCHITECTURE

**Tên dự án**: MIMIN ERP (Quản lý sản xuất Polomimin)

**Mô tả**: Web ERP vận hành nhà máy may với các module: Lệnh cắt, Khách hàng, NCC, Kho vải, Phụ liệu, Công nợ, Bảng lương, Gia công ngoài, Kế hoạch SX.

**Tech Stack (CẤM THAY ĐỔI)**:
- Framework: `Next.js 15.5.4 (App Router)` - Static Export mode (`output: 'export'`).
- Runtime: `React 19`.
- Language: `TypeScript 5.x` (Strict mode).
- Styling: `Tailwind CSS 3.4` (Utility-first, CSS variables).
- DB/Auth: `Supabase` (Mock ở local, Real khi deploy) kết hợp `localStorage` caching.
- UI/Icons: `lucide-react`, `sonner` (toast), `next-themes`.

---

## 🧠 3. BUSINESS LOGIC & WORKFLOWS (Đã được training)

### 3.1. QUY TRÌNH CHẠY LOGIC TUẦN TỰ (CỐT LÕI - KHÓA LUỒNG)
**🚨 Mọi AI TUYỆT ĐỐI KHÔNG ĐƯỢC làm phá vỡ hoặc thay đổi thứ tự và logic của 10 bước sau:**
1. **Kế hoạch SX**: Đầu vào quy trình. Xác định mã hàng, số lượng dự kiến, nguyên phụ liệu.
2. **Lệnh cắt**: Kế thừa thông tin từ Kế hoạch SX, tạo lệnh chính thức, chỉ định sơ đồ cắt, loại vải và tỷ lệ size ban đầu.
3. **Tổ Cắt (Việc của tôi)**: Nhập **số lượng cắt thực tế** vào `TyLeSizeModal` (Single Source of Truth). Tổng SL thực tế của đơn hàng sẽ được chốt ở bước này.
4. **In/Thêu (Việc của tôi)**: Tự động sao chép (Auto-Cascade) số lượng từ khâu Cắt sang. Hệ thống tự động đối chiếu số lượng với Cắt để tính lỗi (Defect Tracking - hiển thị lỗi màu đỏ).
5. **Tổ May (Việc của tôi)**: Cập nhật tiến độ may. Nếu gia công ngoài, nhập qua `GiaCongModal` và đồng bộ ngược về bảng size tổng.
6. **QC (Kiểm tra chất lượng)**: Nhận hàng từ Tổ May, kiểm tra lỗi, cập nhật số lượng Đạt và Lỗi (phế phẩm/trả sửa).
7. **Khuy nút (Việc của tôi)**: Xử lý đơm khuy, đóng nút cho sản phẩm pass QC hoặc trực tiếp từ khâu May.
8. **Tổ Ủi (Việc của tôi)**: Kế thừa số liệu đầu vào, tiến hành ủi phẳng, đối chiếu hao hụt với các khâu trước.
9. **Đóng gói nhập kho (Việc của tôi)**: Gấp xếp, đóng bao bì theo tỷ lệ size. Chốt số lượng thành phẩm cuối cùng nhập kho.
10. **Hoàn Thiện (Tổng hợp)**: Theo dõi xuyên suốt tỷ lệ hao hụt từ Cắt đến Đóng gói, chốt công nợ gia công, tính lương khoán và xác nhận hoàn tất đơn hàng.

### 3.2. Luồng Nhập Tỷ Lệ Size (Cơ chế chi tiết)
- **Single Source of Truth**: Dùng `TyLeSizeModal` làm nơi duy nhất để nhập số lượng cho tất cả các khâu (Cắt, In/Thêu, Ủi, Đóng Gói).
- **Auto-Cascade (Tự động sao chép)**: Số liệu từ khâu "Cắt" sẽ tự động copy sang khâu "In/Thêu" (nếu In/Thêu chưa có dữ liệu).
- **Defect Tracking (Tính lỗi)**: Từ khâu In/Thêu trở đi, hệ thống tự động so sánh số lượng với khâu "Cắt". Nếu ít hơn, tự động hiển thị `Lỗi: x SP` (màu đỏ).
- **Gia công ngoài (May)**: Nhập qua `GiaCongModal` (chọn nhà gia công, ngày giao) sau đó đồng bộ ngược lại vào bảng size tổng trong `TyLeSizeModal`.
- **Tổng SL Thực Tế**: Tự động được tính toán ngầm dựa trên tổng số lượng của khâu "Cắt" khi lưu `TyLeSizeModal`.

### 3.2. Data Sync Pattern (Local ↔ Supabase)
- Dùng Hook `useSupabaseSync` từ `src/lib/supabase/sync-helper.ts`.
- **Lưu ý Cực Kỳ Quan Trọng**: App sử dụng `camelCase` (vd: `loaiLenh`), nhưng Supabase sử dụng `snake_case` (vd: `loai_lenh`). Helper đã tự động convert, AI **không được tự ý sửa** tên biến trong App thành snake_case.

---

## ⚠️ 4. STRICT CODING CONVENTIONS

### DO (BẮT BUỘC LÀM)
1. **TypeScript**: Luôn định nghĩa `interface/type`. Dùng `unknown` thay vì `any`. Export type dùng chung từ `lib/data/`.
2. **Components**: 100% Function components. Thêm `"use client"` trên đầu file nếu dùng React hooks hoặc DOM events.
3. **Naming**: File `kebab-case.tsx` (vd: `lenh-cat.tsx`). Component `PascalCase`.
4. **Tailwind**: Không viết CSS file rời. Dùng CSS variables (`bg-white/40`). Theo chuẩn Mobile-first (`md:`, `lg:`).
5. **Format**: Tiền tệ dùng `formatVND()`. Ngày tháng dùng ISO 8601 (`YYYY-MM-DD`). ID luôn có prefix (`LC-`, `PC-`).
6. **Tái sử dụng UI**: Bắt buộc dùng `<CrudModal>` cho form, `<ImageUploader>` cho hình ảnh.

### DON'T (CẤM LÀM)
1. ❌ **CẤM** sửa `next.config.ts` làm mất `output: 'export'`.
2. ❌ **CẤM** viết API routes hoặc Server Actions (vì đang dùng Static Export). Toàn bộ logic phải nằm ở Client.
3. ❌ **CẤM** tạo file Data mới tĩnh. Nếu cần data test, hãy thêm vào `real-data.ts` hoặc `cong-no.ts`.
5. ❌ **CẤM** thay đổi thư viện icon (`lucide-react`) sang loại khác.
6. ❌ **CẤM** tự động `git push`. Chỉ được phép deploy lên Vercel khi hoàn thành.


---

## 🛠 5. THUẬT TOÁN XỬ LÝ TASK CỦA AI (Execution Flow)

Mỗi khi AI nhận yêu cầu, phải chạy qua 4 bước sau trong suy nghĩ trước khi code:
1. **[ANALYZE]**: Đọc file liên quan bằng tools. Tìm file `.tsx`, `.ts` có chứa logic đang cần sửa.
2. **[PLAN]**: Xác định state cần update, component cần sửa mà không làm vỡ các module khác.
3. **[EXECUTE]**: Viết code sạch, đúng TS type, tái sử dụng components.
4. **[REPORT]**: Báo cáo lại cho anh Cường ngắn gọn, dễ hiểu, theo phong cách a-e.

---

## 🐛 6. KNOWN ISSUES / PENDING FIXES
*(AI cần biết để tránh đụng chạm hoặc chủ động đề xuất sửa)*
1. Bảng `don_hang` trên Supabase đang thiếu cột `dia_chi`.
2. Bảng `phan_cong` đang bị lỗi khóa ngoại `fk_phan_cong_lenh_cat`.
3. Middleware hiện đang bị tắt do conflict với Static Export.

---

## 🤖 7. MULTI-AI WORKFLOW (Phối hợp Mavis & Antigravity)

**Nguyên tắc vàng**:
1. **Không giẫm chân**: Không code cùng một file cùng lúc.
2. **Tách nhánh**: AI luôn phải tạo branch riêng (`feature/ten-tinh-nang`) trước khi commit code.
3. **Review chéo**: Không tự ý merge code của chính mình vào `main`. Push lên nhánh phụ -> Báo user -> User yêu cầu AI kia review -> Merge.
4. **Giải quyết xung đột**: Báo ngay cho user quyết định, không tự ý ghi đè code của AI khác.

