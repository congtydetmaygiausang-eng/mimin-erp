# ✅ CHECKLIST TEST TRƯỚC KHI CHẠY APP THẬT

> File này giúp anh Sang kiểm tra từng bước trước khi deploy/production.

---

## 1️⃣ CHECKLIST MÔI TRƯỜNG

- [ ] Node.js >= 18 (`node --version`)
- [ ] npm >= 9 (`npm --version`)
- [ ] Git (optional, để backup)
- [ ] Browser: Chrome/Edge (recommended) hoặc Firefox
- [ ] Editor: VS Code (để xem code nếu cần)
- [ ] Disk: ~2GB trống (cho `node_modules`)

## 2️⃣ CHECKLIST DEPENDENCIES

- [ ] `cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"`
- [ ] `npm install` (chỉ lần đầu, ~2-3 phút)
- [ ] Kiểm tra `node_modules` đã tạo
- [ ] Không có error trong output

## 3️⃣ CHECKLIST BUILD (TypeScript)

- [ ] `npx tsc --noEmit` → **0 errors**
- [ ] Nếu có lỗi, xem file:line:col và fix
- [ ] Không có warning về unused import

## 4️⃣ CHECKLIST BUILD (Next.js)

- [ ] `npm run build` → **PASS**
- [ ] First Load JS shared: 102 KB
- [ ] Số routes build: **62+**
- [ ] Không có error trong build log
- [ ] Output `.next/` đã tạo

## 5️⃣ CHECKLIST CHẠY DEV

- [ ] `npm run dev` khởi động
- [ ] Output hiển thị: `http://localhost:3000`
- [ ] Mở browser → load được trang
- [ ] Redirect đến `/login`

## 6️⃣ CHECKLIST ĐĂNG NHẬP

- [ ] Form login hiển thị
- [ ] Đăng nhập với 1 user demo thành công
- [ ] Redirect về `/dashboard` hoặc `/trang-chu-gia-cong`
- [ ] TopBar hiển thị tên + role user
- [ ] Logout hoạt động

## 7️⃣ CHECKLIST PHÂN QUYỀN (test 3 role khác nhau)

### Role 1: `QUAN_TRI_HE_THONG` (admin)
- [ ] Thấy TẤT CẢ menu (40+ items)
- [ ] Truy cập được mọi route
- [ ] Audit log hiển thị

### Role 2: `KE_TOAN` (kế toán)
- [ ] Thấy: Đối soát sản lượng, Đối soát tiền công, Báo cáo
- [ ] KHÔNG thấy: Bảng điều hành SX, Kho mobile, QC, Hoàn thiện
- [ ] Truy cập `/doi-soat` thành công
- [ ] Filter 7 trạng thái hoạt động
- [ ] Tạo đối soát → thấy trong danh sách

### Role 3: `THU_KHO_VAI` (thủ kho)
- [ ] Thấy: Trang chủ Kho, Nhập/Xuất/Kiểm kê/Lô hàng
- [ ] KHÔNG thấy: Kế toán, QC, Hoàn thiện
- [ ] Truy cập `/trang-chu-kho` thành công
- [ ] Tạo phiếu nhập kho thành công
- [ ] Tồn kho hiển thị từ `KHO_VAI` (29 mặt hàng)

### Role 4: `PHU_TRACH_QC` (QC)
- [ ] Thấy: Trang chủ QC, Kiểm tra CL
- [ ] Truy cập `/kiem-tra-cl` thành công
- [ ] Filter 4 tab hoạt động
- [ ] Đánh dấu "Đạt" / "Lỗi" cập nhật localStorage

### Role 5: `NHAN_VIEN_KHUY_NUT` (NV)
- [ ] Thấy: Trang chủ Hoàn thiện, Công việc, Bàn giao, Sản lượng, Tiền công
- [ ] Mobile-first UX (KPI cards to, filter chip ngang)
- [ ] Nhận việc → Bắt đầu → Hoàn thành workflow OK

## 8️⃣ CHECKLIST WORKFLOW (test 1 flow hoàn chỉnh)

### Test E2E: Hoàn thiện → Kho → Đối soát
1. [ ] Login NV Hoàn thiện → nhận việc
2. [ ] Hoàn thành → bàn giao kho TP
3. [ ] Login Thủ kho → nhập kho thành phẩm
4. [ ] Login Kế toán → thấy bản ghi đối soát mới (status "Chưa đối soát")
5. [ ] Duyệt → thanh toán
6. [ ] Audit log ghi đầy đủ 4 actions

## 9️⃣ CHECKLIST RESPONSIVE

- [ ] Desktop (≥1024px): hiển thị bảng, sidebar đầy đủ
- [ ] Tablet (640-1024px): responsive grid
- [ ] Mobile (<640px):
  - [ ] Mobile card view thay bảng
  - [ ] Filter chip ngang scroll được
  - [ ] KPI card 2 cột
  - [ ] Modal full screen
  - [ ] Bottom nav (nếu có)

## 🔟 CHECKLIST DỮ LIỆU

- [ ] `ALL_REAL_PHIEU` có 12+ phiếu (M758, M873, ...)
- [ ] `KHO_VAI` có 29 mặt hàng
- [ ] `KHO_VAT_TU` có 58 mặt hàng
- [ ] `USERS` có 19+ tài khoản
- [ ] `VAI_TRO_CHUAN` có 17 roles
- [ ] localStorage khởi tạo khi truy cập lần đầu

## 1️⃣1️⃣ CHECKLIST PWA

- [ ] Service Worker đã register
- [ ] Manifest có icon
- [ ] "Add to Home Screen" hoạt động
- [ ] Offline: vẫn load được (vì localStorage)

## 1️⃣2️⃣ CHECKLIST PERFORMANCE

- [ ] First load < 3s
- [ ] Navigation giữa các page < 1s
- [ ] Không có lag khi scroll/filter
- [ ] Memory: < 200MB (DevTools)

## 1️⃣3️⃣ CHECKLIST CONSOLE

- [ ] Mở DevTools → Console
- [ ] Không có error đỏ
- [ ] Warning chỉ là dev warning (không critical)
- [ ] Network: không có 404

---

## 🚨 NẾU CÓ LỖI

| Lỗi | Cách fix |
|---|---|
| Port 3000 in use | Đổi port: `$env:PORT=3001; npm run dev` |
| Module not found | `rm -rf .next; npm run dev` |
| localStorage lỗi | DevTools → Application → Clear storage |
| TypeScript error | `npx tsc --noEmit` xem chi tiết |
| Build fail | `rm -rf .next node_modules; npm install; npm run build` |
| Menu không đúng role | Check `lib/role-menu.ts` allowedRoles |
| Data không hiển thị | Check localStorage có key `mimin_*` |

---

## 📞 BÁO CÁO LỖI

Khi gặp lỗi, gửi cho em kèm:
1. **Role đang đăng nhập**
2. **URL page**
3. **Steps để tái hiện** (click gì → thấy gì → expected gì)
4. **Screenshot** (nếu có)
5. **Console error** (nếu có)

---

**Status:** ✅ Sẵn sàng chạy thật sau khi pass tất cả checklist
**Maintainer:** Mavis (mavis AI)
**Last update:** 2026-07-30
