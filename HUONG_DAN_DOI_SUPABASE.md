# Hướng dẫn chuyển sang Supabase mới (gói Pro)

> **Lý do**: Sếp Sang lỡ đăng ký gói Pro $25/tháng trên project Supabase mới.
> **Cũ**: `nftlwdcsmlpeiazhuoho.supabase.co` (Free tier)
> **Mới**: `ejcuqyaiwabfygyesvxj.supabase.co` (Pro $25/tháng)
> **Ngày tạo**: 2026-08-03

---

## 🎯 Tổng quan (5 bước)

| # | Bước | Thời gian | Cần làm gì |
|---|---|---|---|
| 1 | Lấy credentials mới từ project Pro | 2 phút | Sếp Sang |
| 2 | Update `.env.local` | 1 phút | Sếp Sang |
| 3 | Update Vercel env vars | 2 phút | Sếp Sang |
| 4 | Apply schema trên project mới | 5 phút | Sếp Sang |
| 5 | Redeploy Vercel | 2 phút | Sếp Sang |

**Tổng**: ~12 phút

---

## Bước 1: Lấy credentials từ project MỚI

### Truy cập Project Settings → API

**URL**: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/settings/api

### Copy 3 giá trị:

#### 1️⃣ Project URL
```
https://ejcuqyaiwabfygyesvxj.supabase.co
```

#### 2️⃣ anon public key (dùng cho client)
- Mục "Project API keys" → `anon` `public`
- Click "Copy" bên cạnh

#### 3️⃣ service_role key (dùng cho server-side)
- Mục "Project API keys" → `service_role` (phải click "Reveal" trước)
- **CHÚ Ý**: Copy ngay vì Supabase chỉ hiện 1 lần!

---

## Bước 2: Update `.env.local`

Mở file `D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\.env.local`

Tìm 3 dòng:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nftlwdcsmlpeiazhuoho.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...OLD...
SUPABASE_SERVICE_ROLE_KEY=eyJ...OLD...
```

Thay bằng:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ejcuqyaiwabfygyesvxj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...NEW...
SUPABASE_SERVICE_ROLE_KEY=eyJ...NEW...
```

Save file.

---

## Bước 3: Update Vercel Environment Variables

1. Vào https://vercel.com/dashboard
2. Chọn project **mimin-erp**
3. Tab **Settings** → **Environment Variables**
4. Sửa 3 biến:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://ejcuqyaiwabfygyesvxj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → key mới
   - `SUPABASE_SERVICE_ROLE_KEY` → key mới
5. Click **Save**

**Áp dụng cho cả 3 môi trường**: Production, Preview, Development

---

## Bước 4: Apply schema trên project MỚI

### 4.1 Mở SQL Editor
**URL**: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new

### 4.2 Apply Schema 1 (18 bảng + 20 NCC + 18 NV)
1. Mở file `D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\APPLY-SUPABASE-MANUAL.sql`
2. Ctrl+A → Ctrl+C (copy toàn bộ)
3. Paste vào SQL Editor
4. Bấm **"Run and enable RLS"** (nút xanh ở giữa)
5. Đợi 30-60s

### 4.3 Apply Schema 2 (8 bảng bổ sung)
1. Mở file `D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\APPLY-SUPABASE-EXTRA.sql`
2. Ctrl+A → Ctrl+C
3. Paste vào SQL Editor (file mới)
4. Bấm **"Run and enable RLS"**
5. Đợi 30-60s

### 4.4 Verify
- Vào https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/database/tables
- Phải thấy **26 bảng**:
  - 14 bảng gốc: don_hang, phan_cong, giao_dich_kho, ncc, khach_hang, nhan_su, bang_luong, ...
  - 4 bảng riêng: nha_cung_cap, lenh_cat, mau_cong_doan, mau_chi_phi
  - 8 bảng bổ sung: cong_no, khsx, qc_records, hoan_thien, giao_hang, gia_cong, doi_soat, kho_mobile
- 20 đối tác trong `nha_cung_cap`
- 18 nhân sự trong `nhan_su`

---

## Bước 5: Redeploy Vercel

1. Vào https://vercel.com/dashboard
2. Project **mimin-erp** → tab **Deployments**
3. Click **"..."** ở deployment mới nhất → **"Redeploy"**
4. Đợi 2-3 phút

### Verify
- Mở https://mimin-erp.vercel.app/
- Mở DevTools (F12) → tab **Console**
- Vào trang `/lenh-cat` → tạo 1 lệnh cắt thử
- Vào Supabase Table Editor → `lenh_cat` → phải thấy record vừa tạo

---

## 🗑️ Xử lý project CŨ (sau khi chuyển xong)

### Option A: Xoá (nếu không cần)
1. Vào https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/general
2. Cuộn xuống **"Danger Zone"** → **"Pause project"** hoặc **"Delete project"**
3. Confirm

### Option B: Giữ làm backup
- Free tier không tốn tiền
- Không ảnh hưởng gì

### Option C: Downgrade về Free
- Project cũ sẽ về Free tier (đã vậy rồi)
- Có thể giữ lại cho backup hoặc xoá sau

---

## ❓ Troubleshooting

### Lỗi "Invalid API key"
- Kiểm tra `NEXT_PUBLIC_SUPABASE_ANON_KEY` đã copy đúng
- Không có space, line break ở đầu/cuối

### Lỗi "permission denied for table"
- Schema chưa apply
- Hoặc RLS policy chưa enable
- Chạy lại 2 file SQL

### Lỗi "fetch failed"
- `NEXT_PUBLIC_SUPABASE_URL` sai
- Phải có dạng `https://[project-id].supabase.co`
- Project ID mới: `ejcuqyaiwabfygyesvxj`

### App vẫn dùng project cũ sau khi redeploy
- Clear cache: Ctrl+Shift+R
- Hoặc Vercel → Deployments → Redeploy with **"Use existing Build Cache" = OFF**

---

## 📞 Liên hệ

Nếu gặp vấn đề, sếp Sang báo em (Mavis) ngay nhé!

**Bước tiếp theo sau khi chuyển xong**:
- Test trên Vercel: tạo lệnh cắt → check Supabase
- Khi sếp Sang nhập workflow → bảng lương tự động tính
- 11 store sync giữa browser ↔ Supabase real-time

---

**Version**: 1.0
**Created**: 2026-08-03 by Mavis
**For**: Sếp Sang (Hồ Minh Sang)
