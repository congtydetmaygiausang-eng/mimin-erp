# MIMIN ERP - AUDIT CHECKLIST 10 FORMS

> **Ngày tạo**: 2026-08-06
> **Cập nhật**: 2026-08-06 (thêm Form 7-12)
> **Tác giả**: Mavis (mavis-agent)
> **Yêu cầu**: Sếp Sang muốn làm hết trong nhiều session
> **Mục tiêu**: Đánh giá chất lượng toàn diện hệ thống MIMIN ERP

---

## 🎯 Tổng quan 10 Forms

| # | Form | Scope | Số checks | Thời gian | Phase |
|---|---|---|---|---|---|
| 1 | **#3 Routes & Navigation** | Menu, route, 404, redirect, dynamic | 7 | 2-3 giờ | 3 |
| 2 | **#4 Role × Module × Action × Data Scope** | Phân quyền 4D | 11 actions × 5 scopes × 30 modules | 1-2 ngày | 4 |
| 3 | **#5 Login & Session** | Auth, token, multi-tab | 10 | 1-2 giờ | 2 |
| 4 | **#6 Buttons & Forms** | Mỗi nút 10 checks | ~50 nút × 10 | 1-2 ngày | 5 |
| 5 | **#7 Luồng nghiệp vụ E2E** | 8 bước: Tạo → Duyệt → Phân công → Thực hiện → Kiểm tra → Hoàn thành → Ghi nhận TC → Khóa | 8 bước × 20 luồng | 2-3 ngày | 6 |
| 6 | **#8 Liên kết dữ liệu** | FK, orphan, sync FE/API/DB | 8 | 1-2 ngày | 7 |
| 7 | **#9 Số lượng & công thức** | Tồn kho, doanh thu, vượt nguồn | 9 | 1-2 ngày | 8 |
| 8 | **#10 API/Console/Network** | F12 errors, status codes, payloads | 12 | 1-2 ngày | 9 |
| 9 | **#11 Hiệu năng & đồng thời** | Tải trang, multi-tab, race condition | 15 | 1-2 ngày | 10 |
| 10 | **#12 Báo cáo tổng hợp** | P0/P1/P2/P3 + kế hoạch fix | Output | 1 ngày | 11 |

**Tổng thời gian ước tính**: 2-3 tuần, 4 specialists (general, qa-test, bug-fix, data-sql)

---

## 📋 Form #3 - Routes & Navigation (7 checks)

| # | Check | Status | Notes | Phase |
|---|---|---|---|---|
| 3.1 | Menu bấm có mở đúng trang không | ⏸ | Sample test | |
| 3.2 | Có route 404 không | ⏸ | Auto detect | |
| 3.3 | Redirect có vòng lặp không | ⏸ | Auto detect | |
| 3.4 | Nút quay lại có đúng không | ⏸ | Manual test | |
| 3.5 | Route động có xử lý ID sai không | 🔴 FAIL | `/agents/[id]` không 404 khi ID không tồn tại | Phase 1 |
| 3.6 | Gõ URL trực tiếp có vượt quyền không | ⏸ | Test 30 routes × 9 roles | |
| 3.7 | Trang lỗi có giao diện xử lý phù hợp không | 🔴 FAIL | KHÔNG có not-found.tsx, error.tsx, loading.tsx | Phase 1 |

---

## 📋 Form #4 - Role × Module × Action × Data Scope (11 × 5 × 30)

### Actions (11)
- View, Create, Edit, Delete, Assign, Approve, Reject, Confirm, Lock, Payment, Export

### Data Scopes (5)
- SELF, ASSIGNED, TEAM, DEPARTMENT, ALL

### 30 Modules (kiểm tra)
1. dashboard, 2. lenh-cat, 3. khach-hang, 4. ke-hoach-san-xuat, 5. nhan-su, 6. kho-vai-tinhmann, 7. kho-phu-lieu, 8. kho-thanh-pham, 9. nha-cung-cap, 10. gia-cong-ngoai, 11. cong-no, 12. bang-luong, 13. cham-cong, 14. don-hang, 15. qc, 16. audit-log, 17. agents, 18. ai-assistant, 19. phan-quyen-tuy-chinh, 20. cai-dat, 21. backup-restore, 22. doi-tac-gia-cong, 23. cong-nhan-gia-cong, 24. bao-cao, 25. may, 26. hoan-thien, 27. giao-hang, 28. realtime, 29. supabase-status, 30. profile

### Matrix Template
| Module | Action | Data Scope | Admin OK? | User OK? | NV OK? | Ghi chú |
|---|---|---|---|---|---|---|
| lenh-cat | View | ALL | ✅ | ✅ | ✅ | |
| lenh-cat | Create | ALL | ✅ | ✅ | ❌ | |
| ... | ... | ... | ... | ... | ... | |

### Nguyên tắc
- **KHÔNG chỉ ẩn menu** - phải check cả API + data
- Mỗi role chỉ thấy dữ liệu trong scope của mình
- Service role bypass hết (chỉ dùng server-side)

---

## 📋 Form #5 - Login & Session (10 checks)

| # | Check | Status | Notes | Phase |
|---|---|---|---|---|
| 5.1 | Đăng nhập đúng (sang@mimin.vn / sang123) | ⏸ | Live test | |
| 5.2 | Đăng nhập sai (sai password) | ⏸ | Live test | |
| 5.3 | Tài khoản bị khóa (sang@mimin.vn + bật cờ locked) | ⏸ | Mock test | |
| 5.4 | Session hết hạn (1 giờ timeout) | ⏸ | Test timeout | |
| 5.5 | Token bị xóa (clear localStorage) | ⏸ | Auto test | |
| 5.6 | Đăng xuất (click button) | ⏸ | Live test | |
| 5.7 | Refresh trang (F5) - giữ session? | ⏸ | Auto test | |
| 5.8 | Mở nhiều tab - cùng session? | ⏸ | Test 2 tabs | |
| 5.9 | Đổi tài khoản (logout → login user khác) | ⏸ | Live test | |
| 5.10 | Chống giả mạo role từ client (sửa localStorage) | ⏸ | Security test | |

---

## 📋 Form #6 - Buttons & Forms (10 checks per button)

Mỗi nút cần verify:
1. ✅ Hiển thị đúng role (chỉ admin mới thấy, etc)
2. ✅ Bấm được (không disabled)
3. ✅ Gọi handler (không chỉ decoration)
4. ✅ Request hoặc update store thật
5. ✅ Lưu dữ liệu (không chỉ toast "thành công")
6. ✅ Reload có còn dữ liệu (persist)
7. ✅ Cập nhật module liên quan (cross-module update)
8. ✅ Audit log (ghi vào audit_logs)
9. ✅ Xử lý bấm 2 lần (debounce/lock)
10. ✅ Thông báo lỗi rõ ràng (không silent fail)

### Buttons cần check (top 20)
- Lệnh cắt: Tạo, Sửa, Xóa, Duyệt, Reject, Confirm
- Nhân sự: Tạo NV, Sửa, Xóa, Phân quyền, Khóa TK
- Kho: Nhập kho, Xuất kho, Kiểm kê, Điều chỉnh
- Đơn hàng: Tạo, Sửa, Xóa, Duyệt, Reject
- Bảng lương: Tính lương, Duyệt, Thanh toán
- Agents: Pause, Resume, Configure
- 14 nút còn lại...

---

## 📋 Form #7 - Validation (13 checks)

| # | Check | Status | Notes | Phase |
|---|---|---|---|---|
| 7.1 | Trường bắt buộc (required) | ⏸ | Test với input rỗng | |
| 7.2 | Kiểu dữ liệu (string/number/date) | ⏸ | Test với type sai | |
| 7.3 | Giá trị âm | ⏸ | Số lượng, tiền | |
| 7.4 | Giá trị bằng 0 | ⏸ | Edge case | |
| 7.5 | Số quá lớn (overflow) | ⏸ | Test max int | |
| 7.6 | Ngày bắt đầu > kết thúc | ⏸ | Test date range | |
| 7.7 | Mã bị trùng (unique constraint) | ⏸ | Test duplicate ID | |
| 7.8 | Khoảng trắng (whitespace) | ⏸ | Trim, validate | |
| 7.9 | Ký tự đặc biệt (SQL injection, XSS) | ⏸ | Security test | |
| 7.10 | File sai định dạng | ⏸ | Upload .exe | |
| 7.11 | Dữ liệu thiếu liên kết (FK) | ⏸ | Order no customer | |
| 7.12 | Bản ghi đã khóa vẫn sửa được | ⏸ | Lock row + update | |
| 7.13 | Dữ liệu sai giữa FE/API/DB | ⏸ | Compare 3 layer | |

---

## 📋 Form #8 - Luồng nghiệp vụ E2E (8 bước × 20 luồng)

Mỗi luồng kiểm tra 8 bước: `Khởi tạo → Duyệt → Phân công → Thực hiện → Kiểm tra → Hoàn thành → Ghi nhận tài chính → Khóa`

Sau từng bước phải kiểm tra:
- Trạng thái trước và sau
- Người được phép thực hiện
- Dữ liệu đầu vào
- Bảng/store được cập nhật
- Module tiếp theo có nhận dữ liệu không
- Có tạo dữ liệu trùng không
- Có cho phép bỏ qua bước không
- Hủy thao tác có hoàn nguyên không

### Top 20 luồng cần check
1. Lệnh cắt: KH tạo → Kế hoạch duyệt → Phân công chuyền → May thực hiện → QC kiểm → Hoàn thành → Tính tiền công → Khóa LSX
2. Kho: Nhập vải → Duyệt phiếu nhập → Phân bổ tồn → Xuất kho SX → Kiểm kê → Đối chiếu → Cập nhật giá vốn → Khóa kỳ
3. Đơn hàng: KH đặt → Duyệt đơn → Phân công SX → Sản xuất → QC → Giao hàng → Thu tiền → Khóa đơn
4. Bảng lương: Chấm công → Tính lương → Duyệt lương → Phát lương → Khóa kỳ lương
5. Gia công ngoài: Tạo đơn GC → Duyệt → Giao hàng → Nhận hàng GC → QC → Thanh toán → Khóa
6-20. Các luồng khác (công nợ, nhân sự, etc)

| # | Check | Status | Notes |
|---|---|---|---|
| 8.1 | 8 bước có đầy đủ cho 20 luồng chính | ⏸ | Sample test 3-5 luồng |
| 8.2 | Trạng thái trước/sau mỗi bước | ⏸ | Compare state |
| 8.3 | Phân quyền theo bước | ⏸ | Phụ thuộc Form #4 |
| 8.4 | Data flow giữa modules | ⏸ | Sample |
| 8.5 | Không cho bỏ qua bước | ⏸ | Test 5 luồng |
| 8.6 | Hủy thao tác có rollback | ⏸ | Test 3 luồng |

---

## 📋 Form #9 - Liên kết dữ liệu (8 checks)

| # | Check | Status | Notes |
|---|---|---|---|
| 9.1 | Một bản ghi nguồn tạo ra những bản ghi nào | ⏸ | Trace FK chain |
| 9.2 | Sửa nguồn có cập nhật dữ liệu phụ thuộc không | ⏸ | Test cascade update |
| 9.3 | Xóa nguồn có tạo orphan không | ⏸ | Test FK constraint |
| 9.4 | Dữ liệu lưu ở nhiều nơi? | ⏸ | Check duplicate storage |
| 9.5 | Single source of truth | ⏸ | Check master table |
| 9.6 | Trùng ID, mã, trạng thái | ⏸ | Sample check |
| 9.7 | LocalStorage vs API vs DB lệch nhau | ⏸ | Compare 3 layer |
| 9.8 | Data mẫu trộn với data thật | ⏸ | Production check |

---

## 📋 Form #10 - Số lượng & công thức (9 checks)

| # | Check | Status | Notes |
|---|---|---|---|
| 10.1 | Tổng chi tiết = tổng đầu | ⏸ | Test 5 phiếu |
| 10.2 | SL công đoạn sau không vượt trước | ⏸ | Test workflow |
| 10.3 | Nhập không vượt nguồn | ⏸ | Test kho |
| 10.4 | Xuất không vượt tồn | ⏸ | Test kho |
| 10.5 | Đạt + lỗi + thiếu = tổng kiểm | ⏸ | Test QC |
| 10.6 | Hàng sửa không tính 2 lần | ⏸ | Test workflow |
| 10.7 | Hủy phiếu hoàn lại SL | ⏸ | Test rollback |
| 10.8 | Số tiền không làm tròn sai | ⏸ | Test 0.1 + 0.2 |
| 10.9 | Đơn giá đổi không ảnh hưởng CT đã khóa | ⏸ | Test lock |

---

## 📋 Form #11 - API/Console/Network (12 checks - F12)

| # | Check | Status | Notes |
|---|---|---|---|
| 11.1 | Lỗi JavaScript | ⏸ | Console errors |
| 11.2 | Lỗi React | ⏸ | Error boundary |
| 11.3 | Request 400/401/403/404/409/422/500 | ⏸ | Check status codes |
| 11.4 | API gọi sai URL | ⏸ | URL audit |
| 11.5 | Request sai payload | ⏸ | Schema check |
| 11.6 | Response thiếu field | ⏸ | Type check |
| 11.7 | Token không được gửi | ⏸ | Header check |
| 11.8 | API lặp vô hạn | ⏸ | useEffect dep |
| 11.9 | Nút bấm không tạo request | ⏸ | Dead button check |
| 11.10 | Success 200 nhưng UI không update | ⏸ | State sync |
| 11.11 | API trả success giả | ⏸ | Toast success nhưng fail |
| 11.12 | File ảnh/asset lỗi | ⏸ | 404 check |

---

## 📋 Form #12 - Hiệu năng & đồng thời (15 checks)

| # | Check | Status | Notes |
|---|---|---|---|
| 12.1 | Thời gian tải trang | ⏸ | Lighthouse |
| 12.2 | Trang nhiều bản ghi (>1000) | ⏸ | Pagination |
| 12.3 | Tìm kiếm nhanh | ⏸ | Debounce |
| 12.4 | Lọc nhanh | ⏸ | Index check |
| 12.5 | Phân trang | ⏸ | Page size |
| 12.6 | Scroll mượt | ⏸ | Virtual list |
| 12.7 | Import/Export | ⏸ | Large file |
| 12.8 | 2 người cùng sửa 1 record | ⏸ | Optimistic lock |
| 12.9 | Bấm lưu liên tục | ⏸ | Debounce |
| 12.10 | Mở nhiều tab | ⏸ | Sync |
| 12.11 | Mạng chậm | ⏸ | Loading state |
| 12.12 | Mất mạng | ⏸ | Offline |
| 12.13 | Retry | ⏸ | Exponential backoff |
| 12.14 | Data cũ ghi đè data mới | ⏸ | Stale data |
| 12.15 | Memory leak + API lặp | ⏸ | Cleanup useEffect |

---

## 📋 Form #13 - Báo cáo tổng hợp P0/P1/P2/P3 (cuối cùng)

Mỗi vấn đề phải có:
- Mã lỗi
- Module
- Mô tả
- Cách tái hiện
- Kết quả hiện tại vs mong đợi
- Nguyên nhân dự đoán
- File liên quan
- Phần cần sửa/bổ sung
- Mức độ ảnh hưởng
- Cách kiểm tra lại

| Mức | Ý nghĩa |
|-----|---------|
| **P0** | Lỗi làm hệ thống không dùng được, mất dữ liệu hoặc vượt quyền |
| **P1** | Lỗi nghiệp vụ chính, sai số liệu hoặc sai luồng |
| **P2** | Thiếu chức năng, UX chưa hoàn chỉnh hoặc hiệu năng chưa tốt |
| **P3** | Tối ưu, chuẩn hóa và nâng cấp |

---

## 🗓 Phases thực hiện

### Phase 1: Setup (session này, 30-60 phút)
- [x] Tạo AUDIT-CHECKLIST.md
- [ ] Sample test Form #3 (5-10 routes)
- [ ] Sample test Form #5 (login flow)
- [ ] Commit findings ban đầu
- [ ] Update memory với scope

### Phase 2: Form #5 Login & Session (session tiếp, 1-2 giờ)
- [ ] Test 10/10 checks
- [ ] Document findings
- [ ] Commit

### Phase 3: Form #3 Routes & Navigation (session 3, 2-3 giờ)
- [ ] Test 7/7 checks
- [ ] Auto-detect 404 + redirect loops
- [ ] Test gõ URL trực tiếp vượt quyền
- [ ] Commit

### Phase 4: Form #4 Role × Module × Action × Data Scope (delegate specialists, 1-2 ngày)
- [ ] Build matrix template
- [ ] Test top 10 modules critical (lenh-cat, kho, nhan-su, bang-luong, don-hang, qc, etc)
- [ ] Test 3 roles chính (admin, planner, viewer)
- [ ] Test 11 actions
- [ ] Test 5 data scopes
- [ ] Commit

### Phase 5: Form #6 + #7 Buttons & Forms + Validation (delegate specialists, 1-2 ngày)
- [ ] Test top 20 nút
- [ ] Test 13 validations
- [ ] Đặc biệt: phát hiện "toast success nhưng không lưu"
- [ ] Commit

---

## 📊 Status Summary (cập nhật 2026-08-06 - 10 forms)

| Form | Total | Tested | Pass | Fail | N/A | % Done |
|---|---|---|---|---|---|---|
| #3 Routes | 7 | 2 | 0 | 2 | 0 | 14% |
| #4 Role×Mod×Act×Scope | 1650 | 0 | 0 | 0 | 0 | 0% |
| #5 Login | 10 | 0 | 0 | 0 | 0 | 0% |
| #6 Buttons | 500 | 0 | 0 | 0 | 0 | 0% |
| #7 Validation | 13 | 0 | 0 | 0 | 0 | 0% |
| #8 Luồng E2E | 8 bước × 20 luồng | 0 | 0 | 0 | 0 | 0% |
| #9 Liên kết data | 8 | 0 | 0 | 0 | 0 | 0% |
| #10 Số lượng | 9 | 0 | 0 | 0 | 0 | 0% |
| #11 API/Console | 12 | 0 | 0 | 0 | 0 | 0% |
| #12 Hiệu năng | 15 | 0 | 0 | 0 | 0 | 0% |
| #13 Báo cáo P0/P1 | Output | 0 | 0 | 0 | 0 | 0% |
| **Tổng** | **~2240** | **2** | **0** | **2** | **0** | **0.1%** |

---

## 🎯 Findings Log (sẽ update sau)

### Form #3 - Routes

#### 🔴 #3.7 - Thiếu not-found.tsx, error.tsx, loading.tsx
- **Phát hiện**: 2026-08-06
- **Mức độ**: Medium
- **Tác động**: User gõ URL sai sẽ thấy 404 mặc định của Next.js (xấu, không thương hiệu MIMIN)
- **Fix**: Tạo 3 file:
  - `apps/web/src/app/not-found.tsx` - trang 404 custom
  - `apps/web/src/app/error.tsx` - trang error
  - `apps/web/src/app/loading.tsx` - loading state
- **Effort**: 30 phút

#### 🔴 #3.5 - Route /agents/[id] không 404 khi ID sai
- **Phát hiện**: 2026-08-06
- **Mức độ**: Low (cosmetic)
- **Tác động**: User gõ `/agents/xyz-khong-ton-tai` sẽ thấy trang "Unknown agent" thay vì 404
- **Fix**: Trong `agents/[id]/page.tsx`, check `AGENT_PERSONAS[agentId]` → nếu không có, gọi `notFound()` từ next/navigation
- **Effort**: 10 phút

### Form #4 - Role
- (chưa có)

### Form #5 - Login
- (chưa có)

### Form #6 - Buttons
- (chưa có)

### Form #7 - Validation
- (chưa có)

---

## 📝 Notes

- Sếp Sang đã từng phát hiện bug "toast success nhưng không lưu" qua audit cũ
- Project đang dùng static export → không có middleware → chỉ check client-side
- Supabase RLS đã apply cho 9 bảng chính + 3 bảng agent
- 45 user @mimin.vn (1 admin + 24 NV + 20 NCC + 1 QC)

---

**Last updated**: 2026-08-06 (Mavis)
