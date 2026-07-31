# 🚀 HƯỚNG DẪN DEPLOY MIMIN ERP LÊN VERCEL (Hỗ trợ API Routes)

> Tác giả: Trợ lý sếp Sang  
> Ngày: 2026-07-30

---

## 🎯 TẠI SAO CHỌN VERCEL?

| Tiêu chí | Vercel | Netlify | Express | Lark Client |
|---|:---:|:---:|:---:|:---:|
| Hỗ trợ Next.js API routes | ✅ | ✅ | ⚠️ Cần convert | ❌ |
| Setup thời gian | 5 phút | 10 phút | 4-6 giờ | 0 phút |
| An toàn credentials | ✅ Server | ✅ Server | ✅ Server | ❌ Lộ Secret |
| Auto-deploy từ Git | ✅ | ✅ | ⚠️ | ❌ |
| Free tier | ✅ 100GB | ✅ 100GB | ❌ | ✅ |
| Edge Functions | ✅ | ⚠️ | ❌ | ❌ |
| Realtime/Streaming | ✅ | ⚠️ | ✅ | ⚠️ |

**KHUYẾN NGHỊ: Vercel** - setup 5 phút, miễn phí, đầy đủ tính năng.

---

## 🚀 SETUP TRONG 5 PHÚT

### Bước 1: Tạo GitHub repo
```powershell
cd D:\MIMIN-ERP-app-moi
git init
git add .
git commit -m "Initial commit MIMIN ERP v89.6.8"
git remote add origin https://github.com/[your-username]/mimin-erp.git
git push -u origin main
```

### Bước 2: Đăng ký Vercel
1. Vào https://vercel.com → **Sign Up** với GitHub
2. Click **"Add New Project"**
3. **Import** repo `mimin-erp` từ GitHub
4. Vercel tự detect Next.js → auto-config

### Bước 3: Cấu hình Project
Vercel sẽ hỏi:
- **Root Directory**: `./` (để trống)
- **Build Command**: `cd apps/web && npm run build`
- **Output Directory**: `apps/web/.next` (nếu SSR) hoặc `apps/web/out` (nếu static)

**QUAN TRỌNG**: Sửa `next.config.ts`:
- Xóa `output: "export"` → để dùng SSR mode (cần cho API routes)
- Hoặc giữ nguyên → chỉ deploy static pages (KHÔNG có API)

### Bước 4: Set Environment Variables
Trong Vercel Dashboard → Settings → Environment Variables, thêm:

```bash
# Supabase (PUBLIC - an toàn)
NEXT_PUBLIC_SUPABASE_URL=https://nftlwdcsmlpeiazhuoho.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...xxxxx
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx

# Lark App (BÍ MẬT - chỉ server-side)
LARK_APP_ID=cli_xxxxx
LARK_APP_SECRET=xxxxx

# DeepSeek + MiniMax (BÍ MẬT)
DEEPSEEK_API_KEY=sk-xxxxx
MINIMAX_API_KEY=eyJxxxxx

# Optional
NEXT_PUBLIC_APP_NAME=MIMIN ERP
NEXT_PUBLIC_APP_VERSION=89.6.8
```

### Bước 5: Click **Deploy** 🚀
- Vercel sẽ build + deploy trong 1-2 phút
- Sau khi xong, sếp có URL: `https://mimin-erp-username.vercel.app`

### Bước 6: Custom Domain (optional)
- Vào Settings → Domains
- Thêm `mimin.vn` hoặc domain sếp
- Cấu hình DNS theo hướng dẫn

---

## 🛠 CHUYỂN TỪ STATIC → SSR (CẦN THIẾT CHO API ROUTES)

### Vấn đề hiện tại
Project đang dùng `output: "export"` → chỉ build static pages, **KHÔNG có API routes**.

### Fix trong 3 bước:

**Bước 1: Sửa `apps/web/next.config.ts`**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ❌ BỎ DÒNG NÀY:
  // output: "export",
  
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
```

**Bước 2: Move API routes vào lại `src/app/api/`**
```powershell
# Trong project (sau khi sếp nhận về local):
cd D:\MIMIN-ERP-app-moi\apps\web

# Move từ docs/ sang src/app/api/
mkdir src\app\api\v1\lark\oauth\start
mkdir src\app\api\v1\lark\oauth\callback
mkdir src\app\api\v1\lark\oauth\refresh
mkdir src\app\api\v1\lark\bot\run
mkdir src\app\api\v1\lark\webhook

copy docs\lark-api-routes\lark-oauth-start.ts src\app\api\v1\lark\oauth\start\route.ts
copy docs\lark-api-routes\lark-oauth-callback.ts src\app\api\v1\lark\oauth\callback\route.ts
copy docs\lark-api-routes\lark-oauth-refresh.ts src\app\api\v1\lark\oauth\refresh\route.ts
copy docs\lark-api-routes\lark-bot-run.ts src\app\api\v1\lark\bot\run\route.ts
copy docs\lark-api-routes\lark-webhook.ts src\app\api\v1\lark\webhook\route.ts
```

**Bước 3: Commit + push lại**
```powershell
git add .
git commit -m "Enable API routes for Vercel SSR"
git push
```

Vercel tự động re-deploy! ✨

---

## 🔐 SETUP LARK OAUTH

Sau khi deploy lên Vercel, sếp cần:

### Bước 1: Cập nhật Lark App
1. Vào https://open.larksuite.com/app
2. Chọn App của sếp → **Security Settings**
3. Thêm **Redirect URL**:
   ```
   https://mimin-erp-username.vercel.app/lark-callback
   ```

### Bước 2: Thêm Webhook URL
1. Vào **Event Subscriptions**
2. Request URL: `https://mimin-erp-username.vercel.app/api/v1/lark/webhook`
3. Add events: `card.action.trigger`, `bitable.record.*`

### Bước 3: Test OAuth
Sếp vào Lark Setup Wizard trên production:
- `/lark-setup/`
- Click "Authorize" → Redirect về Lark → Allow
- Callback về `/lark-callback` → Token được lưu

---

## 💰 PRICING VERCEL

| Plan | Bandwidth | Build time | Serverless | Cost |
|---|---|---|---|---|
| **Hobby (Free)** | 100GB/tháng | 100h/tháng | 100GB-hrs | $0 |
| **Pro** | 1TB/tháng | 400h/tháng | 1000GB-hrs | $20/tháng |

**MIMIN ERP** ước tính dùng:
- Bandwidth: ~5GB/tháng (20 users × 50 lượt × 5MB)
- Build: ~5 phút/ngày (auto-deploy khi push git)
- Serverless: ~10GB-hrs/tháng (API routes)

→ **Free tier dư sức** cho MIMIN ERP!

---

## 🔄 WORKFLOW DEV vs PROD

### Local Dev (static export - hiện tại)
```powershell
cd D:\MIMIN-ERP-app-moi\apps\web
npm run dev
# Truy cập: http://localhost:3000
# Mock data, không cần Lark thật
```

### Production (Vercel - sau khi setup)
```powershell
git push origin main
# Vercel tự động deploy
# URL: https://mimin-erp.vercel.app
# Lark thật, Supabase thật, API routes hoạt động
```

### Hybrid (best of both)
- **Dev**: Static export (nhanh, mock data, không tốn tiền)
- **Prod**: Vercel SSR (full features, Lark thật)

---

## 🐛 TROUBLESHOOTING

### Build fail: "Module not found"
- Xóa `node_modules` + `package-lock.json`
- Chạy lại: `cd apps/web && npm install`

### API routes không hoạt động
- Check `next.config.ts` đã bỏ `output: "export"` chưa
- Check API routes đã có trong `src/app/api/` chưa
- Vercel Logs → xem runtime errors

### Lark OAuth fail
- Check Redirect URL đã add trên Lark App chưa
- Check App ID + Secret đúng trên Vercel env vars
- Browser DevTools → Network → xem response

### Webhook không nhận
- Lark chỉ gửi webhook cho events đã enable
- Check Vercel Logs có request tới `/api/v1/lark/webhook`
- URL phải là HTTPS (không HTTP)

---

## 📞 BƯỚC TIẾP THEO

**Sếp Sang chọn:**

**Option 1**: Em hướng dẫn từng bước deploy Vercel (sếp tự làm)
**Option 2**: Em tạo GitHub Actions CI/CD tự động (push code → tự deploy)
**Option 3**: Em convert project sang SSR mode + setup Vercel ready (sếp chỉ cần 1-click deploy)

Em recommend **Option 3** vì:
- Project sẵn sàng deploy
- Chỉ cần connect GitHub → click Deploy
- Auto-deploy mỗi lần push

**Sếp muốn em làm option nào?** 🚀

---

**Tác giả**: Trợ lý sếp Sang  
**Cập nhật**: 2026-07-30
