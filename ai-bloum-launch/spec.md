# AI Bloum Launch — Landing Page Spec

## Project Context

**Brand:** MIMIN × AI Bloum (by GIAU SANG TEXTILE / POLOMIMIN)
**Page purpose:** Marketing announcement ("tổng tin") introducing AI Bloum — the AI agent built into MIMIN ERP that helps garment factory owners find suppliers, place orders, and manage production with one tap.
**Story arc:** Open with the raw, relatable pain of running a garment workshop (overpriced fabric, piled-up stock, no money, no experience, no idea where to find a good factory) → pivot to the MIMIN solution → land on AI Bloum as the hero product with two flagship flows (Chọn sợi + Đặt lệnh nhuộm) → close with a confident CTA.
**Mood:** Editorial, cinematic, Awwwards-tier. Not a "generic SaaS blue" page. Earthy, warm, premium.
**Target audience:** Chủ xưởng may, chủ cửa hàng thời trang, người khởi nghiệp ngành dệt may tại Việt Nam.

## Color Palette (No Blue, No Purple)

- **Primary dark / forest:** `#1B3A2F` (deep forest green — used for hero, footers, dark sections)
- **Primary accent / sage:** `#52796F` (sage green — for buttons, links, highlights)
- **Soft moss / surface:** `#CAD2C5` (very light sage — for cards, separators)
- **Cream background:** `#F5F1E8` (warm off-white — main canvas)
- **Warm terracotta / pain red:** `#C85A3F` (used ONLY in the pain section to flag the negative emotions)
- **Charcoal text:** `#1A1A1A`
- **Muted text:** `#6B7280`
- **Pure white:** `#FFFFFF` (used sparingly for contrast)

## Typography

- **Display (headlines):** `Fraunces` from Google Fonts — serif, editorial, slightly soft, weights 500–900. Used for all section H1/H2 and the hero headline.
- **Body (paragraph, UI labels):** `Inter` from Google Fonts — clean modern sans, weights 400–700.
- **Accent mono (data, numbers):** `JetBrains Mono` for stats and pricing.
- **Scale (desktop):** hero 120px / h2 72px / h3 40px / body-lg 20px / body 16px / caption 13px.
- **Vietnamese diacritics:** Fraunces and Inter both support full Vietnamese glyphs.

## Layout

- **Grid:** 12 columns desktop, 4 columns mobile, max content width 1280px, generous gutters (32px desktop).
- **Rhythm:** Sections are 100vh (hero) or 100–140vh (content sections), with 120px desktop / 80px mobile vertical padding.
- **Whitespace:** Uncluttered. Each section has ONE big idea. Cards float with soft shadows (`0 30px 60px rgba(27,58,47,0.08)`).

## Hero Section — Video-First

- **Pattern:** Video-Led Hero. Background autoplays a 6-second cinematic loop (muted) of a Vietnamese garment workshop — threads, fabric rolls, hands working — slightly desaturated. Massive serif headline overlays the video with a soft vignette.
- **Headline (VN):** "KHI CHỦ XƯỞNG MAY / MẤT NGỦ VÌ HÀNG TỒN"
- **Subhead (VN):** "70% chủ xưởng đang gồng gánh 7 nỗi lo cùng lúc. MIMIN thấu hiểu — và giải quyết."
- **CTA primary:** "Xem AI Bloum giải quyết" → scroll to solution
- **CTA secondary:** "Đặt lịch demo 1-1" → mailto or anchor
- **Bottom strip:** Tiny ticker "POLOMIMIN × MIMIN ERP × AI BLOUM"
- **Fallback:** If video fails, background color `#1B3A2F` shows through (no placeholder image over the video).

## Section 2 — Pain Points ("7 Nỗi Lo")

- **Layout:** 7 floating cards in a 4-3 staggered grid (desktop) / 2-col (mobile).
- **Style:** Cards use cream background + thin terracotta left border + handwritten marker accent (use `Caveat` font) for the pain title.
- **Cards:**
  1. "Giá cả" — Hàng giá cao quá, bán không được
  2. "Bán không được" — Cao quá nên hàng ế
  3. "Hàng ế" — Kho chất đầy, không biết xoay
  4. "Không có tiền" — Nợ lời, không trả được
  5. "Không biết tìm xưởng" — Đặt hàng thì tìm ở đâu?
  6. "Không có kinh nghiệm" — Mới vào nghề, chới với
  7. "Sản phẩm không đẹp" — Mẫu mã không cạnh tranh
- **Background:** Subtle grain texture on `#F5F1E8`.

## Section 3 — Solution Pivot

- **Layout:** Full-width centered block. One sentence. Big.
- **Headline:** "MIMIN RA MẮT AI BLOUM — TRỢ LÝ SẢN XUẤT 24/7"
- **Subhead:** "Một AI biết ngành dệt may, giúp bạn chọn sợi, đặt nhuộm, cắt may — chỉ với vài cú chạm."
- **Visual:** A small green badge "MỚI — BETA 2026" with sage glow.

## Section 4 — AI Bloum Feature 1: "Chọn Sợi Thông Minh"

- **Layout:** 60/40 split — left text, right dashboard mockup.
- **Headline:** "Chọn sợi — AI so sánh 10+ nhà cung cấp trong 5 giây"
- **Body:** "AI Bloum thu thập giá, lead time, chất lượng từ 10+ NCC uy tín (Tân Thành, Phúc An, Việt Hưng…). Đề xuất nhà cung cấp tốt nhất theo tiêu chí của bạn — cotton 65/35, pique 2 chiều, 30s, 1.000 áo, deadline 3 tuần…"
- **Right side:** Dashboard mockup showing supplier comparison table (Tân Thành highlighted as recommended with checkmark).
- **Stats card under:** "Tiết kiệm 4-6 giờ mỗi đơn" / "Giảm 15% chi phí nguyên liệu"

## Section 5 — AI Bloum Feature 2: "Đặt Lệnh Nhuộm 1 Chạm"

- **Layout:** 40/60 split (mirror of feature 1) — left mockup, right text.
- **Headline:** "Đặt lệnh nhuộm — Xong trước khi pha trà xong"
- **Body:** "Upload ảnh mẫu màu hoặc chọn từ catalog. AI tự chọn xưởng nhuộm tối ưu (An Phát, Nhuộm Bình Dương…), báo giá tức thì, đặt cọc 30% tự động. Bạn chỉ cần xác nhận."
- **Right text** mirrors feature 1's left.
- **Mockup:** Dyeing order screen (3 màu, khối lượng, giá, tổng 11.358.000 VNĐ, đặt cọc 30%).
- **Stats:** "Đặt lệnh trong 90 giây" / "Thanh toán an toàn — ký quỹ 6 tháng"

## Section 6 — Big Stats Strip

- **Layout:** Full-bleed dark green band, 4 stat columns, large numbers.
- **Stats:**
  - 12+ năm kinh nghiệm dệt may
  - 100+ xưởng đã tin dùng
  - 30% giảm chi phí tìm NCC
  - 5-7 ngày rút ngắn mỗi đơn hàng
- **Style:** Numbers in Fraunces 800, white, with tiny sage underline.

## Section 7 — How It Works (3 steps)

- **Layout:** 3 horizontal steps with connecting line.
- **Steps:**
  1. **Nhập yêu cầu** — Mô tả nhu cầu (chất vải, số lượng, deadline) bằng tiếng Việt tự nhiên.
  2. **AI đề xuất** — AI Bloum tìm NCC tối ưu, báo giá, đề xuất lệnh.
  3. **Xác nhận & sản xuất** — Một chạm duyệt. MIMIN ERP theo dõi đến khi giao hàng.
- **Style:** Numbered circles (forest green with white number), step title in Fraunces, body in Inter.

## Section 8 — Final CTA

- **Layout:** Centered, 60vh, dark forest background.
- **Headline:** "Sẵn sàng để chủ xưởng của bạn / ngủ ngon hơn?"
- **CTAs:** "Dùng thử AI Bloum miễn phí" (primary, cream button) + "Liên hệ tư vấn" (ghost button)
- **Tagline:** "POLOMIMIN × MIMIN ERP × AI BLOUM — Đồng hành cùng chủ xưởng Việt."

## Motion & Interactions

- **Hero text:** Fade in + slight up (translateY 40px → 0) over 1.2s, ease-out, delayed 0.3s after video starts.
- **Scroll reveal:** Each section uses IntersectionObserver. On enter, children fade in sequentially with 80ms stagger.
- **Pain cards:** On hover, slight lift (translateY -8px) + soft terracotta glow.
- **Stats numbers:** CountUp from 0 to target value when scrolled into view (1.5s, ease-out).
- **Smooth scroll:** Anchor links use `scroll-behavior: smooth` globally.
- **No jarring transitions.** Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo).

## Tech Stack

- **HTML5** + **modern CSS** (Grid, Flexbox, custom properties, `@container` queries where useful).
- **Vanilla JS** (no framework, no jQuery).
- **Google Fonts:** Fraunces, Inter, Caveat, JetBrains Mono.
- **No external CSS framework** (Tailwind, Bootstrap) — fully custom.
- **No image placeholders** for video poster; background color matches video tone as fallback.
- **Assets folder:** `imgs/` for stills, `videos/` for hero loop.

## Asset Protocol

1. **Hero video** — `videos/hero_loop.mp4`, 1920×1080 minimum, 6s, cinematic, desaturated garment workshop footage.
2. **Pain mood image** — `imgs/pain_workshop.jpg`, 1920×1080, moody warehouse, supporting the pain section.
3. **Solution portrait** — `imgs/solution_owner.jpg`, square or 4:5, owner looking confident at laptop, soft natural light.
4. **Feature 1 mockup** — `imgs/feature_chonsoi.png`, 1600×1000, dashboard with supplier table.
5. **Feature 2 mockup** — `imgs/feature_nhuom.png`, 1600×1000, dyeing order screen with 3 colors.
6. **Pattern texture** — `imgs/grain.svg`, subtle 200×200 noise pattern for cream backgrounds.

## Strict Constraints (Recap)

- ❌ NO blue, indigo, purple, blurple, neon purple.
- ❌ NO generic SaaS look.
- ❌ NO static placeholder images over the hero video.
- ❌ NO low-res hero video (must be 1080p).
- ❌ NO missing `onerror` handlers on `<img>`.
- ❌ NO Tailwind, Bootstrap, or heavy frameworks.
- ✅ Vietnamese content throughout.
- ✅ MIMIN brand green as the hero color.
- ✅ Terracotta ONLY for the pain section (negative emotion signal).
- ✅ Editorial typography (Fraunces) as the visual signature.
