# 📦 MIMIN ERP v89.6.9.2 - TỔNG HỢP TẤT CẢ FILE CẦN TẢI

> **Ngày**: 2026-07-30  
> **Phiên bản**: v89.6.9.2 (Phân quyền V2)  
> **Tác giả**: Mavis (trợ lý sếp Sang)

---

## 📁 DANH SÁCH FILE TRONG ZIP NÀY

| # | File | Dung lượng | Mô tả |
|---|------|-----------|--------|
| 1 | `MIMIN-ERP-v89.6.9.2-PHAN-QUYEN-V2.zip` | 9.0MB | **Source code đầy đủ** (apps/web) |
| 2 | `MIMIN-AGENTS-9-NHANVIEN.zip` | 17KB | Config 9 agents (JSON + personas) |
| 3 | `BAO_CAO_PHAN_QUYEN_V2.md` | 22.6KB | Báo cáo phân quyền V2 chi tiết |
| 4 | `CONFIG_AGENTS.md` | 4.7KB | Bảng routing 9 agents - 3 providers |
| 5 | `HUONG_DAN_LAY_KEY_MINIMAX.md` | 5.7KB | Hướng dẫn lấy API key MINIMAX |
| 6 | `HUONG_DAN_LAY_KEY_MINIMAX.html` | 16KB | File HTML mở bằng browser |

---

## 🚀 CÁCH DÙNG

### Bước 1: Giải nén
```bash
unzip MIMIN-FINAL-FOR-DOWNLOAD.zip -d D:\MIMIN-FINAL
cd D:\MIMIN-FINAL
```

### Bước 2: Đọc báo cáo phân quyền trước
Mở `BAO_CAO_PHAN_QUYEN_V2.md` (hoặc .html) để hiểu cấu trúc phân quyền mới.

### Bước 3: Cài đặt code chính
```bash
unzip MIMIN-ERP-v89.6.9.2-PHAN-QUYEN-V2.zip -d D:\MIMIN-ERP-app-moi
cd D:\MIMIN-ERP-app-moi\apps\web
npm install
npm run dev  # → http://localhost:3000
```

### Bước 4: Test online (nhanh nhất)
Mở browser → **<https://fmba01ylr8bzf.space.minimax.io/>**
- Login: `sang@mimin.vn` / `sang123`
- Click menu mới:
  - 🪡 **Trang chủ gia công** (mobile-first)
  - 🏭 **Bảng điều hành SX**
  - 💰 **Đối soát tiền công**

### Bước 5: Nếu sếp muốn lấy key MINIMAX thật
Đọc `HUONG_DAN_LAY_KEY_MINIMAX.md` → làm theo 5 bước.

---

## 🔑 API KEY HIỆN TẠI

- ✅ **DeepSeek**: HOẠT ĐỘNG (key sếp paste)
- ⏳ **MINIMAX**: Key valid, chờ nạp tiền (~lỗi 1008)
- ❌ **Gemini**: Chưa có key đúng (key sếp paste là OAuth token, không dùng được)

**Trong lúc chờ**: 9 agents tự dùng DeepSeek fallback.

---

## 📊 TỔNG KẾT TÍNH NĂNG v89.6.9.2

### ✅ Tính năng đã làm
- 9 agents AI tổng hợp (Mavis + 8 chuyên gia)
- 3 providers: MINIMAX + Gemini + DeepSeek (auto fallback)
- Trang chủ gia công mobile-first (7 trang + 1 modal chi tiết 7 tab)
- Bảng điều hành SX (cho quản lý)
- Bảng đối soát tiền công (cho kế toán)
- Hệ thống permission từ dữ liệu hiện tại
- Lark Card Builder + Webhook + Bot
- AI Assistant 9 nhân viên

### ⏳ Đang chờ sếp
- Nạp tiền MINIMAX (để dùng M2 model)
- Lấy key Gemini mới (format AIzaSy...)

### 🎯 Sếp có thể làm tiếp
- Tạo thêm schema `work_order_step` cho data thật
- Connect Supabase cho đa user
- Mobile PWA cho người gia công
- Lark webhook auto-send khi có lệnh mới

---

**🚀 Deploy mới nhất**: <https://fmba01ylr8bzf.space.minimax.io/>  
**📞 Liên hệ**: Mavis (trợ lý sếp Sang)
