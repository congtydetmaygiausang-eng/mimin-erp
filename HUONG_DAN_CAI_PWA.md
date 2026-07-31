# 📱 HƯỚNG DẪN CÀI PWA LÊN MOBILE

> MIMIN ERP v89.6.8 - Progressive Web App

## ✅ PWA đã được setup đầy đủ

| Thành phần | Trạng thái |
|---|---|
| `manifest.json` | ✅ Có - đầy đủ name, icons, shortcuts |
| Service Worker (`sw.js`) | ✅ Có - cache + offline + push |
| Icons (192, 512, maskable) | ✅ Có - 12+ icons |
| Apple Touch Icons | ✅ Có - 120, 152, 167 |
| Favicon (16, 32) | ✅ Có |
| Badge icon (96) | ✅ Có - cho notification |
| PWA Install Prompt | ✅ Tự động hiện trong app |
| ServiceWorkerRegister | ✅ Auto register trong layout |

---

## 📱 HƯỚNG DẪN CÀI ĐẶT

### 🍎 iPhone / iPad (iOS 16.4+)

**Bước 1**: Mở Safari (PHẢI là Safari, không phải Chrome)
- Truy cập: `http://192.168.1.10:3000` (IP máy anh Sang) hoặc `http://localhost:3000` nếu cùng mạng

**Bước 2**: Bấm nút **Share** (📤 - ô vuông có mũi tên chỉ lên)
- Thường ở giữa phía dưới màn hình

**Bước 3**: Cuộn xuống, chọn **"Add to Home Screen"** (Thêm vào Màn hình chính)

**Bước 4**: Đặt tên app (mặc định: "MIMIN ERP") → Bấm **"Add"**

**Bước 5**: Icon MIMIN ERP xuất hiện trên màn hình chính → Bấm mở

✅ **App chạy fullscreen, không có thanh Safari!**

> **Lưu ý iOS**: Phải dùng Safari (Chrome iOS không hỗ trợ PWA install). Cũng cần HTTPS cho production (localhost OK cho dev).

---

### 🤖 Android (Chrome / Edge / Samsung Internet)

**Bước 1**: Mở Chrome (khuyến nghị) hoặc Edge

**Bước 2**: Truy cập `http://192.168.1.10:3000`

**Bước 3**: 
- **Chrome 108+**: Tự động hiện banner "Install app" ở dưới
- Hoặc bấm **⋮ (3 chấm dọc)** → **"Install app"** / **"Add to Home screen"**
- Hoặc **"Add to Home screen"** trong menu

**Bước 4**: Xác nhận cài đặt → Icon xuất hiện trên màn hình

✅ **App chạy fullscreen, push notification hoạt động!**

---

## 🧪 KIỂM TRA PWA ĐÃ CÀI THÀNH CÔNG

### Cách 1: Trong Chrome DevTools
1. Mở `http://localhost:3000`
2. Bấm F12 → tab **Application**
3. Mục **Manifest** → check thông tin app
4. Mục **Service Workers** → check `sw.js` đang active
5. Mục **Storage** → check Cache Storage có data

### Cách 2: Test trên mobile
1. Cài app lên home screen
2. Mở app → kiểm tra:
   - ✅ Không có thanh URL bar (fullscreen)
   - ✅ Icon app đúng (MIMIN ERP logo)
   - ✅ Mở app khi offline → vẫn vào được (cache)
3. Tắt WiFi/data → mở app → nếu load được = PWA work

---

## 🔔 Push Notification (tùy chọn)

PWA đã có sẵn code push notification. Để dùng cần:
1. Tạo VAPID key (đã có sẵn `BLc4xRzKlKORKG0LZ4W3c-...` trong `sw.js`)
2. Subscribe user khi họ cài app
3. Backend gửi push qua VAPID

Hiện tại: **chưa enable** push (cần backend riêng).

---

## 🌐 CÀI TRÊN NHIỀU MÁY (cùng mạng LAN)

Sau khi start production server (`npx serve out -l 3000 -s`), anh Sang có thể truy cập từ **điện thoại/máy khác** trong cùng mạng WiFi:

1. Xem IP máy chủ (Windows): `ipconfig` → IPv4 Address (vd: `192.168.1.10`)
2. Trên mobile: mở browser → vào `http://192.168.1.10:3000`
3. Cài PWA như hướng dẫn trên

**Lưu ý**: 
- Mobile và PC phải cùng mạng WiFi
- Windows Firewall có thể chặn → cho phép khi popup

---

## 🛠️ LỆNH HỮU ÍCH

### Start production server
```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
npx serve@latest out -l 3000 -s
```

### Build lại sau khi sửa code
```powershell
npm run build
# Sau đó serve lại
```

### Xem IP máy
```powershell
ipconfig | Select-String "IPv4"
```

### Check server còn chạy
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. HTTPS cho production
PWA **chỉ hoạt động** trên HTTPS (hoặc localhost).
- ✅ `http://localhost:3000` → OK (dev)
- ✅ `http://192.168.x.x:3000` → OK (LAN test)
- ❌ `http://tenmien.com:3000` → KHÔNG cài được PWA
- ✅ `https://tenmien.com` → OK (production)

→ Cần HTTPS khi deploy thật (Cloudflare, Vercel, Netlify đều có HTTPS free).

### 2. Storage localStorage
PWA cache assets + localStorage lưu data → app vẫn dùng được offline (giới hạn).

### 3. Background sync
Hiện tại **chưa có** background sync. Khi offline, mọi thay đổi localStorage sẽ sync khi online lại (do service worker).

### 4. Update PWA
Khi deploy version mới:
- Service worker tự update khi user mở app
- User cần đóng mở app 1 lần để áp dụng

---

## 📞 XỬ LÝ LỖI

### Lỗi: "App không hiện banner Install"
→ Chrome/Edge đã hiện banner 1 lần. Xóa cache hoặc dùng:
- Bấm **⋮** → **Install MIMIN ERP** (hoặc Cast, save, share → Install)
- Hoặc: DevTools → Application → Manifest → "Add to home screen"

### Lỗi: "Service Worker không register"
- Check console (F12)
- Đảm bảo `https://` hoặc `localhost`
- Clear cache: DevTools → Application → Clear storage

### Lỗi: "App offline không load"
- Service Worker cần cache assets khi online lần đầu
- Sau lần đầu online → offline OK

---

**Build date:** 2026-07-30
**PWA Version:** v89.6.8
**Status:** ✅ Production-ready
