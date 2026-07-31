# 📡 BÁO CÁO TÍCH HỢP & ĐỒNG BỘ LARK PLATFORM (v89.6.9.3)

> **Mục đích**: Báo cáo cơ chế đồng bộ dữ liệu giữa MIMIN ERP và Lark Suite (Lark Base, Lark Bot, Webhook Cardkit).

---

## 📋 1. MÔ HÌNH VÀ CƠ CHẾ ĐỒNG BỘ LARK

| Hạng mục Tích hợp | Nguồn Dữ liệu Chính | Hướng Đồng bộ | Khóa Khớp (Mapping Key) | File Code Đảm Nhận | Trạng Thái Phân Loại |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **Đơn hàng Sỉ** | MIMIN ERP | 2 chiều (ERP ↔ Lark Base) | `ma_don_hang` | [lark-sync-engine.ts](file:///d:/APP%20ERP%20POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/lark-sync-engine.ts) | **LOGIC PASS** / **PARTIAL** |
| **Thông báo Tiến độ LSX** | MIMIN ERP | 1 chiều (ERP → Lark Bot) | `lsx_id` | [lark-bot.ts](file:///d:/APP%20ERP%20POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/lark-bot.ts) | **UI PASS** / **LOGIC PASS** |
| **Thẻ tương tác Cardkit** | MIMIN ERP | 1 chiều (ERP → Lark Chat) | `card_id` | [lark-cardkit.ts](file:///d:/APP%20ERP%20POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/lark-cardkit.ts) | **UI PASS** / **LOGIC PASS** |
| **Nhân sự & Chấm công** | MIMIN ERP | 1 chiều (ERP → Lark Sheet) | `ma_nv` | [lark-base-manager.ts](file:///d:/APP%20ERP%20POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/lark-base-manager.ts) | **LOGIC PASS** / **PARTIAL** |

---

## 🛡️ 2. QUY TẮC CHỐNG LỖI VÀ TRÙNG LẶP DỮ LIỆU

1. **Nguồn chuẩn (Source of Truth)**: MIMIN ERP là nguồn dữ liệu chuẩn cuối cùng. Khi xảy ra xung đột dữ liệu (Conflict), dữ liệu từ MIMIN ERP ghi đè Lark Base.
2. **Chống tạo bản ghi trùng (Deduplication)**: Sử dụng Unique Index theo `ma_don_hang` / `lsx_id`. Nếu đã tồn tại record ID trên Lark, thực hiện `UPSERT` (Update nếu có, Insert nếu chưa).
3. **Xử lý mất mạng (Offline & Retry)**: Tự động lưu queue đồng bộ vào LocalStorage khi mất kết nối mạng và tự động thử lại (Retry max 3 lần) khi có mạng trở lại.
