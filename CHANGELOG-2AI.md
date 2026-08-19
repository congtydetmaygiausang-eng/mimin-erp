# 📝 CHANGELOG-2AI - Lịch sử thay đổi của 2 AI

> **File chung** - cả Mavis và Antigravity đều phải ghi khi sửa code

---

## 🎯 Mục đích

- 2 AI biết AI nào đang sửa gì, tránh trùng
- User (anh Sang) theo dõi tiến độ
- Khi có conflict, tra lại lịch sử để giải quyết

---

## 📋 Quy tắc ghi

1. **Mỗi lần sửa code** → thêm 1 dòng vào bảng dưới
2. **Format**: `| Ngày | AI | Module | Mô tả | Branch | Status |`
3. **Ngày**: YYYY-MM-DD HH:MM
4. **AI**: `Mavis` hoặc `Antigravity`
5. **Module**: tên module (doi-soat, kho-mobile, soi-det-nhuom, etc.)
6. **Mô tả**: 1 dòng ngắn gọn
7. **Branch**: tên branch (vd: feature/phan-quyen, fix/bug-kho)
8. **Status**: `🟡 WIP` | `🟢 DONE` | `🔴 CONFLICT` | `⏸️ PENDING`

---

## 📊 Lịch sử thay đổi (chronological - mới nhất trên cùng)

| Ngày | AI | Module | Mô tả | Branch | Status |
|---|---|---|---|---|---|
| 2026-08-19 17:10 | Codex | mang-luoi-san-xuat | Rà soát tìm công ty: chuẩn hóa số Việt Nam, loại MST/số ngắn khỏi điện thoại, chỉ nhận số có ngữ cảnh liên hệ, thu gọn cảnh báo xung đột và lọc tên bài viết chung chung | codex/audit-company-search-phone-conflicts | 🟢 DONE |
| 2026-08-19 14:10 | Codex | mang-luoi-san-xuat | Xếp hạng nguồn làm giàu theo độ uy tín và độ đầy đủ; trích xuất bằng chứng độc lập từng nguồn, chọn giá trị tốt nhất theo từng trường và chống ghép chéo thông tin công ty | codex/improve-company-source-enrichment | 🟢 DONE |
| 2026-08-19 12:30 | Codex | mang-luoi-san-xuat | Q6: kiểm thử hồi quy Q1-Q5; xác nhận test dữ liệu, TypeScript strict và build production 128/128 trang đạt, gồm trang Công ty đã lưu và hồ sơ công ty | codex/q6-regression-verification | 🟢 DONE |
| 2026-08-19 11:45 | Codex | mang-luoi-san-xuat | Q5: thiết kế lại thẻ kết quả theo 5 vùng, tách điểm phù hợp khỏi độ tin cậy, lưới liên hệ có icon màu, hiệu ứng nhẹ và menu thao tác phụ | codex/q5-professional-result-cards | 🟢 DONE |
| 2026-08-19 11:00 | Codex | mang-luoi-san-xuat | Q4: lưu từng công ty hoặc chọn nhiều, giữ kết quả sau lưu, đánh dấu đã lưu và chặn trùng theo MST/điện thoại/website/tên-địa chỉ/nguồn | codex/q4-selective-company-save | 🟢 DONE |
| 2026-08-19 10:15 | Codex | mang-luoi-san-xuat | Q3: tạo danh mục Công ty đã lưu quản lý vùng chờ Supabase theo trạng thái, vai trò, thiếu/trùng, tìm kiếm, phân trang và duyệt/loại/khôi phục | codex/q3-saved-company-management | 🟢 DONE |
| 2026-08-19 09:35 | Codex | mang-luoi-san-xuat | Q2: dùng chung URL Google Maps theo tên + địa chỉ chuẩn hóa, không ưu tiên tọa độ; thêm chỉ đường và sao chép địa chỉ trong hồ sơ | codex/q2-company-google-maps | 🟢 DONE |
| 2026-08-19 09:00 | Codex | mang-luoi-san-xuat | Q1: ẩn lọc nghiêm ngặt khỏi giao diện, cố định ưu tiên gần và tách rõ kết quả trong/ngoài/chưa xác minh; giữ backend STRICT để tương thích | codex/q1-prefer-near-location-mode | 🟢 DONE |
| 2026-08-17 21:20 | Codex | mang-luoi-san-xuat | Google Maps tìm bằng tên công ty + địa chỉ; chuẩn hóa 12 đơn vị Hóc Môn cũ sang 4 xã sau sắp xếp 2025 và giữ địa chỉ cũ dự phòng | codex/fix-google-maps-post-merger-address | 🟢 DONE |
| 2026-08-17 20:45 | Codex | mang-luoi-san-xuat | Chặn domain rao vặt/việc làm và chỉ giữ hồ sơ doanh nghiệp đúng vai trò, có bằng chứng nhận diện | codex/filter-sourcing-noise-domains | 🟢 DONE |
| 2026-08-17 20:15 | Codex | mang-luoi-san-xuat | Sửa địa chỉ nguồn tìm kiếm: chỉ nhận cấu trúc bưu chính, chặn mô tả bài viết và bỏ fallback nội dung nguồn | codex/fix-sourcing-company-address | 🟢 DONE |
| 2026-08-17 19:40 | Codex | mang-luoi-san-xuat | L7: mã truy vết từng lượt, phiên bản thuật toán, chấm chất lượng phủ tọa độ và cảnh báo cache cũ/mâu thuẫn | codex/l7-location-quality-observability | 🟢 DONE |
| 2026-08-17 19:15 | Codex | mang-luoi-san-xuat | L6: cache geocode Supabase 7 ngày, fallback bản cũ khi Nominatim lỗi và ưu tiên nguồn tọa độ mạnh hơn | codex/l6-geocode-cache-fallback | 🟢 DONE |
| 2026-08-17 18:50 | Codex | mang-luoi-san-xuat | L5: nhãn màu và số km, Google Maps, xem bằng chứng Haversine, xác minh lại có đối chiếu đúng doanh nghiệp | codex/l5-location-verification-ui | 🟢 DONE |
| 2026-08-17 18:25 | Codex | mang-luoi-san-xuat | L4: ưu tiên gần theo nhóm và km tăng dần; chế độ nghiêm ngặt chỉ giữ INSIDE, báo số hồ sơ bị loại và tách khu vực kết quả | codex/l4-location-mode-ranking | 🟢 DONE |
| 2026-08-17 18:00 | Codex | mang-luoi-san-xuat | L3: Haversine chuẩn, phân loại trong/ngoài/thiếu/mâu thuẫn, gói bằng chứng phép tính và epsilon chính xác tại ranh giới | codex/l3-distance-classification | 🟢 DONE |
| 2026-08-17 17:35 | Codex | mang-luoi-san-xuat | L2: làm sạch và geocode tối đa 10 địa chỉ công ty, xác minh Việt Nam/tương đồng/số nhà, lưu nguồn và độ tin cậy tọa độ | codex/l2-candidate-geocoding | 🟢 DONE |
| 2026-08-17 17:05 | Codex | mang-luoi-san-xuat | L1: chuẩn hóa và xác minh tâm tìm kiếm theo quốc gia, từ khóa hành chính, độ mơ hồ, GPS/sai số trước khi gọi nguồn AI | codex/l1-location-center-validation | 🟢 DONE |
| 2026-08-17 16:15 | Codex | mang-luoi-san-xuat | V6: chốt biên bản 4 trường pháp lý từ quyết định V5, lưu ảnh chụp bất biến và không tự cập nhật hồ sơ/danh mục | codex/v6-registry-verification-packet | 🟢 DONE |
| 2026-08-17 15:55 | Codex | mang-luoi-san-xuat | V5: kiểm duyệt từng trường VietQR/MaSoThue, lưu quyết định/người/thời gian/chứng cứ bất biến và không tự cập nhật hồ sơ | codex/v5-registry-field-review | 🟢 DONE |
| 2026-08-17 15:35 | Codex | mang-luoi-san-xuat | V4: màn hình kiểm duyệt VietQR–MaSoThue trong hồ sơ công ty, giữ kết quả gần nhất và hiển thị đối chiếu từng trường không tự ghi đè | codex/v4-registry-review-ui | 🟢 DONE |
| 2026-08-17 15:15 | Codex | mang-luoi-san-xuat | V3: đối chiếu VietQR–MaSoThue theo trọng số từng trường, phát hiện mâu thuẫn/thiếu nguồn và lưu lịch sử bất biến | codex/v3-registry-reconciliation | 🟢 DONE |
| 2026-08-17 15:00 | Codex | mang-luoi-san-xuat | V2: adapter MaSoThue phía server, xác minh chặt MST/URL, cache 3 ngày và lưu 10 nhóm chứng cứ mở rộng không ghi đè hồ sơ | codex/v2-masothue-evidence-adapter | 🟢 DONE |
| 2026-08-17 14:45 | Codex | mang-luoi-san-xuat | V1: adapter VietQR phía server, cache có hạn dùng, chuẩn hóa dữ liệu pháp lý và lưu chứng cứ theo từng trường với RLS | codex/v1-vietqr-registry-foundation | 🟢 DONE |
| 2026-08-17 14:15 | Codex | mang-luoi-san-xuat | U6: lưu lịch sử đánh giá uy tín bất biến, so sánh tăng/giảm điểm, giữ phiên bản công thức, bằng chứng, người và thời gian | codex/u6-trust-assessment-history | 🟢 DONE |
| 2026-08-17 13:45 | Codex | mang-luoi-san-xuat | U5: 4 xác nhận thủ công có người/thời gian, RLS Supabase và tác động đúng nhóm điểm uy tín; M5 vẫn khóa | codex/u5-manual-company-verification | 🟢 DONE |
| 2026-08-17 13:20 | Codex | mang-luoi-san-xuat | U4: lớp điểm trừ tối đa 40, cảnh báo MST mâu thuẫn/sai định dạng, giấy tờ hết hạn và bảng 7 nhóm điểm | codex/u4-trust-risk-penalties | 🟢 DONE |
| 2026-08-17 13:00 | Codex | mang-luoi-san-xuat | U3: bộ máy điểm uy tín sơ bộ 100 điểm tách khỏi độ phù hợp, có 7 nhóm, độ phủ dữ liệu và phiên bản công thức | codex/u3-company-trust-score | 🟢 DONE |
| 2026-08-17 12:35 | Codex | mang-luoi-san-xuat | U2: thay H1 cố định bằng mức hồ sơ động M0-M5 dựa trên nguồn, liên hệ, pháp lý, ảnh, giấy tờ và OCR | codex/u2-dynamic-profile-maturity | 🟢 DONE |
| 2026-08-17 12:20 | Codex | mang-luoi-san-xuat | U1: thêm Google Maps theo tọa độ/địa chỉ và liên kết Zalo cho số di động Việt Nam hợp lệ trong hồ sơ công ty | codex/u1-company-maps-zalo | 🟢 DONE |
| 2026-08-17 12:05 | Codex | mang-luoi-san-xuat | Giữ bộ lọc và kết quả tìm nguồn khi quay lại; tách địa chỉ thành dòng thông tin riêng có icon | codex/persist-sourcing-search-address | 🟢 DONE |
| 2026-08-17 11:45 | Codex | mang-luoi-san-xuat | H6: nhật ký kiểm toán bất biến cho hồ sơ, hình ảnh, giấy tờ và kết quả OCR; hiển thị dòng thời gian chỉ đọc | codex/h6-company-audit-history | 🟢 DONE |
| 2026-08-17 11:30 | Codex | mang-luoi-san-xuat | H5: Gemini OCR giấy tờ riêng tư, lưu đề xuất và bắt buộc người dùng duyệt trước khi áp dụng | codex/h5-document-ocr-review | 🟢 DONE |
| 2026-08-16 17:30 | Codex | mang-luoi-san-xuat | Giai đoạn 1: 4 danh mục, hồ sơ nhiều vai trò, CRUD, chống trùng, Supabase RLS | codex/production-network-foundation | 🟢 DONE |
| 2026-08-01 01:55 | Mavis | ai-tools | Fix Vercel AI SDK v7 compat: parameters → inputSchema, bỏ _options param. Build 89 routes OK. (Antigravity pause - Mavis fix) | feature/ai-agents | 🟢 DONE |
| 2026-08-01 01:50 | Mavis | workflow | Antigravity PAUSE: user yêu cầu Mavis làm 1 mình, Mavis tự review+fix code Antigravity | - | ⏸️ PAUSE |
| 2026-08-01 01:45 | Mavis | ai-agents | Pull feature/ai-agents về local, review code Antigravity (3 lỗi TS: parameters, ToolExecutionOptions, useChat API) | feature/ai-agents | 🟢 DONE |
| 2026-08-01 01:27 | Mavis | docs | Tạo WORKFLOW-2AI.md + cập nhật AGENTS.md | main | 🟢 DONE |
| 2026-08-01 01:10 | Mavis | docs | Test deploy Vercel + hướng dẫn PWA | main | 🟢 DONE |
| 2026-08-01 01:00 | Mavis | deploy | Build production + serve static | main | 🟢 DONE |
| 2026-07-30 23:30 | Mavis | build | 8 đợt phân quyền: 22 pages + 9 stores + 9 helpers | main | 🟢 DONE |
| 2026-07-30 22:00 | Mavis | doi-soat | Đợt 5 - Bộ 3 Kế toán: 7 trạng thái, 2 page, 2 modal | main | 🟢 DONE |
| 2026-07-30 20:00 | Mavis | hoan-thien | Đợt 6 - Bộ 6: 5 page + 1 store + 1 helper | main | 🟢 DONE |
| 2026-07-30 19:00 | Mavis | kho-mobile | Đợt 7 - Bộ 7: 5 page + 1 store + 1 helper | main | 🟢 DONE |
| 2026-07-30 18:00 | Mavis | qc | Đợt 8 - Bộ 8: 2 page + 1 store + 1 helper | main | 🟢 DONE |
| 2026-07-30 16:00 | Mavis | role-menu | Đợt 1-4: 8 components + 5 lib + role menu | main | 🟢 DONE |
| 2026-07-30 14:00 | Mavis | pwa | Tạo manifest.json + sw.js + 12 icons | main | 🟢 DONE |
| 2026-07-21 22:44 | Antigravity | soi-det-nhuom | Cập nhật DATABASE_SCHEMA.md + firebase-debug.log | HTML_APP | 🟢 DONE |
| 2026-07-17 16:00 | Antigravity | initial | Khởi tạo HTML_APP (HTML+JS+Firebase) | HTML_APP | 🟢 DONE |

---

## 🟡 WIP (đang làm)

| Ngày bắt đầu | AI | Module | Mô tả | Branch | Status |
|---|---|---|---|---|---|
| (chưa có) | | | | | |

---

## 🔴 CONFLICTS (cần resolve)

| Ngày | Module | Mô tả conflict | AI A | AI B | Resolution |
|---|---|---|---|---|---|
| (chưa có) | | | | | |

---

## 📊 Thống kê

### Mavis (MiniMax)
- **Modules đã làm**: 22 pages + 9 stores + 9 helpers
- **Đợt đã hoàn thành**: 1, 2, 3, 4, 5, 6, 7, 8 (8/8)
- **File đã tạo/sửa**: 50+
- **Build status**: ✅ PASS
- **Deploy**: https://mimin-erp.vercel.app/

### Antigravity
- **Modules đã làm**: HTML_APP (HTML+JS+Firebase)
- **Last update**: 2026-07-21
- **File đã tạo/sửa**: 186 files
- **MASTER_BLUEPRINT_V2**: Module Sợi-Dệt-Nhuộm

---

## 🎯 Pending tasks (chưa ai làm)

| Priority | Module | Mô tả | AI đề xuất |
|---|---|---|---|
| 🔴 HIGH | api/supabase | Tạo API endpoints cho sync data | Mavis |
| 🟡 MED | dashboard-ceo | Dashboard tổng quan cho GĐ | Mavis |
| 🟡 MED | workflow-sxn | Workflow Sợi-Dệt-Nhuộm module | Antigravity |
| 🟢 LOW | landing-page | Marketing landing page | Antigravity |
| 🟢 LOW | ai-agents | AI agents integration (9 agents) | Antigravity |

---

## 📞 Convention ghi log

### Khi Mavis sửa code
```markdown
| 2026-08-XX HH:MM | Mavis | ten-module | Mô tả ngắn | branch | 🟢 DONE |
```

### Khi Antigravity sửa code (sau khi push)
```markdown
| 2026-08-XX HH:MM | Antigravity | ten-module | Mô tả ngắn | branch | 🟢 DONE |
```

### Khi có conflict
```markdown
| 🔴 CONFLICT | ten-module | A sửa X, B sửa Y → user quyết | A | B | A sửa X, B làm phần khác |
```

---

**Maintained by**: Mavis + Antigravity
**Approved by**: Anh Sang (POLOMIMIN)

| 2026-08-19 10:30 | Codex | sourcing T2 | Thu thập Tavily phân loại nguồn, lưu raw content có giới hạn và metadata kiểm toán | codex/company-profile-t2-tavily-harvest | 🟢 DONE |
| 2026-08-19 11:30 | Codex | sourcing T3 | Làm sạch cứng tên pháp lý và địa chỉ bưu chính trước khi nhận hồ sơ | codex/company-profile-t3-identity-cleaning | 🟢 DONE |
| 2026-08-19 12:30 | Codex | sourcing T4 | DeepSeek trích xuất hồ sơ có dẫn chứng và kiểm chứng lại theo URL nguồn | codex/company-profile-t4-deepseek-evidence | 🟢 DONE |
| 2026-08-19 13:30 | Codex | sourcing T5 | Gộp thực thể bằng khóa mạnh, chặn gộp khi MST mâu thuẫn và đếm nguồn độc lập | codex/company-profile-t5-entity-resolution | 🟢 DONE |
| 2026-08-19 14:30 | Codex | sourcing T6 | Chấm độ tin cậy từng trường và áp dụng cổng chất lượng hồ sơ đa nguồn | codex/company-profile-t6-quality-gate | 🟢 DONE |
| 2026-08-19 15:30 | Codex | sourcing T7 | Hiển thị cổng chất lượng, kiểm chứng từng trường và cảnh báo hồ sơ xung đột | codex/company-profile-t7-review-ui | 🟢 DONE |
**Last updated**: 2026-08-01 (Mavis tạo file)
