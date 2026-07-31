# 🚀 HƯỚNG DẪN CHẠY APP - MIMIN ERP v89.6.8

> **Phân quyền đầy đủ 8 đợt** — Sẵn sàng chạy thật

---

## ⚡ CHẠY NHANH (1 lệnh)

Mở **PowerShell** tại thư mục project và chạy:

```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
npm run dev
```

Sau đó mở browser: **http://localhost:3000**

---

## 📋 CHI TIẾT TỪNG BƯỚC

### Bước 1: Kiểm tra môi trường

```powershell
# Kiểm tra Node.js (cần >= 18)
node --version

# Kiểm tra npm (cần >= 9)
npm --version
```

Nếu chưa có, tải tại: https://nodejs.org/

### Bước 2: Cài đặt dependencies (chỉ lần đầu)

```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp"
# Hoặc chỉ apps/web nếu đã setup monorepo
cd apps\web
npm install
```

### Bước 3: Chạy dev server

```powershell
npm run dev
```

Output mẫu:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
  - Environments: .env.local
```

### Bước 4: Mở browser

Truy cập: **http://localhost:3000**

Bạn sẽ được redirect đến trang login.

---

## 👥 TÀI KHOẢN DEMO (đăng nhập thử)

Mật khẩu chung: **123456** (tùy user)

| Email | Role | Mô tả | Quyền |
|---|---|---|---|
| admin@mimin.vn | QUAN_TRI_HE_THONG | Admin hệ thống | Tất cả |
| giamdoc@mimin.vn | GIAM_DOC | Giám đốc | Xem tất cả + duyệt |
| ketoan@mimin.vn | KE_TOAN | Kế toán | Đối soát tiền công |
| dieuphoi@mimin.vn | DIEU_PHOI_SX | Điều phối SX | Bảng điều hành |
| thukho@mimin.vn | THU_KHO_VAI | Thủ kho vải | Kho mobile |
| qc@mimin.vn | PHU_TRACH_QC | QC | Kiểm tra CL |
| phutrachkn@mimin.vn | PHU_TRACH_KHUY_NUT | Phụ trách KN | Hoàn thiện |
| nhanvienkn@mimin.vn | NHAN_VIEN_KHUY_NUT | NV Khuy nút | Mobile-first |
| nvcat@mimin.vn | NHAN_VIEN_CAT | NV Cắt | Mobile-first |

*(Liên hệ anh Sang nếu chưa có tài khoản — em tạo thêm)*

---

## 🧭 MENU THEO TỪNG ROLE

### 👑 Admin / Giám đốc
Thấy **TẤT CẢ** menu bao gồm:
- Dashboard, Bảng điều hành SX
- Kho vải / Phụ liệu / Thành phẩm
- Lệnh cắt, KHSX, Đơn hàng, Giao hàng
- **Trang chủ Hoàn thiện / Công việc / Bàn giao / Sản lượng / Tiền công**
- **Trang chủ Kho / Nhập / Xuất / Kiểm kê / Lô hàng**
- **Trang chủ QC / Kiểm tra CL**
- **Đối soát sản lượng / Đối soát tiền công**
- Quản lý tài khoản, Phân quyền
- Audit log

### 💰 Kế toán
- Đối soát sản lượng
- Đối soát tiền công
- Báo cáo

### 🏭 Điều phối SX
- Bảng điều hành SX
- Lệnh cắt
- KHSX

### 📦 Thủ kho (Vải / TP)
- Trang chủ Kho
- Nhập kho / Xuất kho
- Kiểm kê / Lô hàng

### 🛡️ QC
- Trang chủ QC
- Kiểm tra CL

### 👷 NV Công đoạn (Cắt/May/KN/UI/DG)
**Mobile-first**:
- Trang chủ NV (Cắt/Hoàn thiện)
- Công việc của tôi
- Bàn giao
- Sản lượng
- Tiền công

---

## 🔍 TEST NHANH 5 PHÚT

Sau khi đăng nhập, thử theo thứ tự:

### Test 1: Workflow Hoàn thiện
1. Login với `nhanvienkn@mimin.vn` / 123456
2. Vào **Công việc Hoàn thiện**
3. Bấm **Nhận** trên 1 phiếu "Chờ nhận"
4. Bấm **Bắt đầu** → **Hoàn thành** → **Bàn giao kho TP**

### Test 2: Kho
1. Login với `thukho@mimin.vn` / 123456
2. Vào **Nhập kho** → **Tạo phiếu**
3. Chọn loại kho + mặt hàng → Lưu
4. Kiểm tra phiếu mới trong danh sách

### Test 3: QC
1. Login với `qc@mimin.vn` / 123456
2. Vào **Kiểm tra CL**
3. Chọn phiếu "Chờ kiểm" → **Nhận** → **Đạt** hoặc **Lỗi**

### Test 4: Đối soát (Kế toán)
1. Login với `ketoan@mimin.vn` / 123456
2. Vào **Đối soát sản lượng**
3. Chọn 1 bản ghi → **Gửi NV** → **Xác nhận** → **Thanh toán**
4. Vào **Đối soát tiền công** xem dashboard tổng hợp

### Test 5: Responsive
- Mở DevTools (F12) → Toggle device toolbar
- Thử iPhone, iPad, Desktop
- Verify mobile menu, KPI card, filter chip

---

## 📊 SỐ LIỆU TỔNG KẾT

| Metric | Giá trị |
|---|---|
| Tổng số routes build | **62 routes** |
| Routes mới (Đợt 6+7+8) | 12 |
| Providers (Context) | 11 |
| Components dùng chung | 8+ |
| Stores (localStorage) | 7 |
| Helpers | 12+ |
| Roles chuẩn | 17 |
| Data sources thật | 7 (ALL_REAL_PHIEU, KHO_VAI, KHO_VAT_TU, USERS, VAI_TRO_CHUAN, ...) |
| First Load JS shared | 102 KB |
| TypeScript errors | **0** |
| Build status | ✅ **PASS** |

---

## 🛠️ XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Module not found"
```powershell
# Chạy lại
rm -rf .next
npm run dev
```

### Lỗi: "Port 3000 already in use"
```powershell
# Đổi port
$env:PORT=3001
npm run dev
```

### Lỗi: localStorage bị lỗi
```powershell
# Mở DevTools → Application → LocalStorage → Xoá hết → Reload
```

### Lỗi: TypeScript error
```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
npx tsc --noEmit
```

### Reset toàn bộ data về mặc định
1. Mở DevTools → Application → LocalStorage
2. Xoá tất cả key bắt đầu bằng `mimin_`
3. Reload trang

---

## 📦 BUILD PRODUCTION

```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
npm run build
npm start
```

Output sẽ chạy trên port 3000 với mode production.

---

## 🌐 DEPLOY (tùy chọn)

Đã có sẵn:
- **polomimin-tong-kho-si**: https://fgo5whyr5da6.space.minimax.io
- **polomimin-erp**: https://minhsang1994.github.io/polomimin-website/

Build static:
```powershell
npm run build
# Output trong apps\web\.next\
```

---

## 📞 LIÊN HỆ

**Anh Sang (POLOMIMIN)** — chủ dự án
- SĐT: 0774480916
- Email: [liên hệ trực tiếp]
- Công ty: CÔNG TY TNHH DỆT MAY GIÀU SANG
- MST: 0318507560
- Địa chỉ: 12/39 Xuân Thới Thượng 58C, Bà Điểm, TP.HCM

---

**Version:** v89.6.8 (Build: 8 đợt hoàn chỉnh)
**Last update:** 2026-07-30
**Status:** ✅ Production-ready
