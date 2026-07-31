# 📅 LỊCH LÀM VIỆC CHI TIẾT - MAVIS + ANTIGRAVITY

> **Bắt đầu**: 2026-07-30 (Thứ 5)
> **Kết thúc**: 2026-08-08 (Thứ 6 tuần sau)
> **Tổng**: 10 ngày làm việc (2 tuần)
> **Check-in**: Mỗi tối lúc 20:00 a cập nhật tiến độ

---

## 📊 GANTT CHART TỔNG QUAN (10 ngày)

```
Ngày    | Mavis (10 tasks)                          | Antigravity (10 tasks)
────────┼──────────────────────────────────────────┼─────────────────────────────────────────
N1 (T5) | ████ Task 1: Fix 4 UI Công nhân (P0-1)   | ████ Task A1: PageGuard (P0-3)
N2 (T6) | ████ Task 1 (cont.) + Task 2             | ████ Task A3: Schema Supabase
N3 (T7) | ████ Task 3: Gộp file user               | ████ Task A4: Tách 3 file kho (start)
N4 (CN) | ████ Task 4: Cảnh báo #5                 | ████ Task A4 (cont.)
N5 (T2) | ████ Task 5: 1kg = 4m vải                | ████ Task A2: Apply Supabase*
N6 (T3) | ████ Task 6: Đơn giá cắt                 | ████ Task A5: Lark OAuth (start)
N7 (T4) | ████ Task 7: Lương May + INTD            | ████ Task A5 (cont.)
N8 (T5) | ████ Task 8: TopBar search               | ████ Backup A6-A10
N9 (T6) | ████ Task 9: Color Picker 35 màu         | ████ Backup
N10 (T7)| ████ Task 10: cong-no-engine             | ████ Test tích hợp
────────┴──────────────────────────────────────────┴─────────────────────────────────────────
* Task A2 chờ a paste Supabase key mới chạy được
```

---

## 📋 CHI TIẾT TỪNG NGÀY

### 🗓️ NGÀY 1 (Thứ 5, 2026-07-30) - Ngày khởi động

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-10:00 | Setup | Tạo branch `feature/ui-logic`, sync code mới nhất |
| 10:00-12:00 | **Task 1.1** | Tạo `components/UpdateSLModal.tsx` (form chung) |
| 13:00-15:00 | **Task 1.2** | Sửa `ui-cat/page.tsx` - thêm modal cập nhật SL |
| 15:00-17:00 | **Task 1.3** | Sửa `ui-khuy-nut/page.tsx` |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-10:00 | Setup | Tạo branch `feature/auth-infra` |
| 10:00-12:00 | **Task A1.1** | Đọc `PageGuard.tsx`, list 50+ routes cần map |
| 13:00-15:00 | **Task A1.2** | Implement `ROUTE_TO_MODULE` mở rộng |
| 15:00-17:00 | **Task A1.3** | Test với 7 role khác nhau |

**🌙 Check-in 20:00**: Cả 2 báo cáo % hoàn thành

---

### 🗓️ NGÀY 2 (Thứ 6, 2026-07-31)

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task 1.4** | Sửa `ui-ui/page.tsx` + `ui-dong-goi/page.tsx` |
| 13:00-15:00 | **Task 1.5** | Test 4 UI: cập nhật SL → reload → vẫn còn |
| 15:00-17:00 | **Task 2** | Tạo `test-phan-quyen/page.tsx` + `backup-restore/page.tsx` |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task A3.1** | Sửa `001_init_schema.sql` - đổi tên bảng |
| 13:00-15:00 | **Task A3.2** | Thêm bảng thiếu: `tasks`, `kho`, `cong_no`, `users` |
| 15:00-17:00 | **Task A3.3** | Sửa RLS theo role |

**🌙 Check-in 20:00**: ✅ Mục tiêu N1-N2: PageGuard xong + 4 UI có form

---

### 🗓️ NGÀY 3 (Thứ 7, 2026-08-01) - Nửa ngày

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task 3.1** | Đọc 3 file user: demo-users-19, user-accounts-secure, congnhan-13 |
| 13:00-15:00 | **Task 3.2** | Tạo `lib/users.ts` với 32 user thống nhất |
| 15:00-17:00 | **Task 3.3** | Sửa `session-provider.tsx` import từ users.ts |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task A4.1** | Tạo `lib/kho-vai-tinhmann.ts` |
| 13:00-15:00 | **Task A4.2** | Tạo `lib/kho-soi-day-chuyen.ts` |
| 15:00-17:00 | **Task A4.3** | Tạo `lib/kho-phu-lieu.ts` |

**🌙 Check-in 20:00**: N3 - users.ts xong + 3 file kho xong

---

### 🗓️ NGÀY 4 (Chủ nhật, 2026-08-02) - **NGHỈ**

**Không làm việc**. Hoặc nếu 2 AI muốn chạy thì:
- Mavis: Task 4 (cảnh báo #5)
- Antigravity: Task A4 (cont. tách file kho)

---

### 🗓️ NGÀY 5 (Thứ 2, 2026-08-03)

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-10:00 | **Task 4** | Implement cảnh báo #5 (NCC vượt hạn mức) |
| 10:00-12:00 | **Task 5** | Công thức 1kg sợi = 4m vải |
| 13:00-15:00 | **Task 6** | Sửa đơn giá cắt 1400/1200/900 |
| 15:00-17:00 | Test | Test 4 UI + cảnh báo + công thức |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-17:00 | **Task A2** | **CHỜ A CƯỜNG PASTE SUPABASE KEY** rồi apply migrations |

**🚦 QUAN TRỌNG**: 
- A paste anon key + service_role key vào chat
- Antigravity sẽ apply migrations + verify ngay trong ngày

**🌙 Check-in 20:00**: N5 - Supabase live + cảnh báo/công thức xong

---

### 🗓️ NGÀY 6 (Thứ 3, 2026-08-04)

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-10:00 | **Task 6 (cont.)** | Test đơn giá cắt với từng loại SP |
| 10:00-12:00 | **Task 7.1** | Thêm đơn giá May (2500đ) + INTD (2000đ thêu / 1500đ in) |
| 13:00-15:00 | **Task 7.2** | Update bảng lương engine |
| 15:00-17:00 | Test | Test bảng lương 6 module |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task A5.1** | Implement OAuth flow: authorize → callback → exchange |
| 13:00-15:00 | **Task A5.2** | Lưu refresh_token + auto refresh |
| 15:00-17:00 | **Task A5.3** | Test OAuth với Lark account thật |

**🌙 Check-in 20:00**: N6 - Lark OAuth xong + lương May/INTD xong

---

### 🗓️ NGÀY 7 (Thứ 4, 2026-08-05)

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task 8** | TopBar search handler (global search LSX/NV/KH/NCC) |
| 13:00-15:00 | Test | Test search với 32 user |
| 15:00-17:00 | **Task 9 (start)** | Setup Color Picker 35 màu |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task A5 (cont.)** | Test OAuth end-to-end + fix bug |
| 13:00-17:00 | **Task A6 (start)** | Tạo `<DataTable>` component (sort/filter/pagination) |

**🌙 Check-in 20:00**: N7 - TopBar search xong + DataTable xong

---

### 🗓️ NGÀY 8 (Thứ 5, 2026-08-06)

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task 9.1** | Tạo `lib/mau-vai-35.ts` (35 màu vải thật) |
| 13:00-15:00 | **Task 9.2** | Tạo `components/ColorPicker.tsx` |
| 15:00-17:00 | **Task 9.3** | Tích hợp vào `lenh-cat/page.tsx` |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task A7** | Tạo `<ConfirmDialog>` component |
| 13:00-15:00 | **Task A8** | Setup rate-limit login |
| 15:00-17:00 | **Task A9** | Setup session TTL |

**🌙 Check-in 20:00**: N8 - Color Picker xong + ConfirmDialog + rate-limit xong

---

### 🗓️ NGÀY 9 (Thứ 6, 2026-08-07)

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Task 10.1** | Đọc master-data-full + workflow-data |
| 13:00-15:00 | **Task 10.2** | Tạo `lib/cong-no-engine.ts` với 3 hàm |
| 15:00-17:00 | **Task 10.3** | Test tổng hợp công nợ |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-17:00 | **Test tích hợp** | Test toàn bộ hệ thống sau khi merge |

**🌙 Check-in 20:00**: N9 - cong-no-engine xong

---

### 🗓️ NGÀY 10 (Thứ 7, 2026-08-08) - Ngày merge

#### 🟢 MAVIS (em)
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-12:00 | **Merge** | Merge `feature/ui-logic` → main |
| 13:00-15:00 | **Test E2E** | Test toàn bộ app với 4 UI công nhân |
| 15:00-17:00 | **Deploy v90** | Deploy lên URL mới |

#### 🔵 ANTIGRAVITY
| Giờ | Task | Chi tiết |
|-----|------|----------|
| 08:00-10:00 | **Merge** | Merge `feature/auth-infra` → main (trước) |
| 10:00-12:00 | **Verify** | Verify Supabase + Lark + PageGuard |
| 13:00-17:00 | **Hỗ trợ Mavis** | Support Mavis test E2E |

**🎉 KẾT THÚC**: Deploy v90 thành công với tất cả 15 tasks hoàn thành!

---

## 📊 CHECKLIST TỔNG KẾT (10 ngày)

### P0 - Phải xong N5 (5/5)
- [ ] P0-1: Fix 4 UI Công nhân (N1-N2)
- [ ] P0-2: Tạo 2 page.tsx (N2)
- [ ] P0-3: PageGuard mở rộng (N1)
- [ ] P0-4: Gộp 3 file user (N3)
- [ ] P0-5: Apply Supabase (N5 - cần key)

### P1 - Phải xong N9 (10/10)
- [ ] P1-1: Cảnh báo #5 (N5)
- [ ] P1-2: 1kg sợi = 4m vải (N5)
- [ ] P1-3: Đơn giá cắt (N6)
- [ ] P1-4: Lương May + INTD (N6)
- [ ] P1-5: Schema Supabase (N2)
- [ ] P1-6: cong-no-engine (N9)
- [ ] P1-7: Tách 3 file kho (N3-N4)
- [ ] P1-8: Lark OAuth (N6-N7)
- [ ] P1-9: TopBar search (N7)
- [ ] P1-10: Color Picker (N8)

### Bonus (N7-N8)
- [ ] DataTable component (N7)
- [ ] ConfirmDialog (N8)
- [ ] Rate-limit (N8)
- [ ] Session TTL (N8)

---

## 📞 ĐIỂM CHECK-IN QUAN TRỌNG

| Mốc | Ngày | Nội dung check-in |
|------|------|-------------------|
| **Checkpoint 1** | N2 (T6) | 4 UI có form + PageGuard xong |
| **Checkpoint 2** | N3 (T7) | users.ts + 3 file kho xong |
| **Checkpoint 3** | N5 (T2) | Supabase live + cảnh báo + công thức |
| **Checkpoint 4** | N7 (T4) | TopBar search + DataTable xong |
| **Checkpoint 5** | N9 (T6) | cong-no-engine xong |
| **Deploy v90** | N10 (T7) | Merge + Deploy thành công |

---

## ⚠️ DEPENDENCIES (Phụ thuộc)

```
A Cường paste Supabase key ──→ Antigravity Task A2 (N5)
                                          │
                                          ↓
                              Antigravity Task A5 (N6-N7)
                                          │
                                          ↓
                              Mavis Task 1 test với data thật (N7)
```

**Nếu a chưa paste key đến N5**: 
- Task A2 bị delay
- Ảnh hưởng: Mavis Task 1 không test được với Supabase thật
- Backup: Mavis vẫn test với localStorage

---

## 📈 MILESTONES

| Ngày | Milestone | A nhận được gì |
|------|-----------|----------------|
| N2 | **v89.6-rc1** | 4 UI công nhân có form thật, PageGuard OK |
| N3 | **v89.6-rc2** | users.ts unified, 3 file kho |
| N5 | **v89.6-rc3** | Supabase live, công thức chuẩn |
| N7 | **v89.6-rc4** | Search hoạt động, DataTable |
| N9 | **v89.6-rc5** | Công nợ engine, Color Picker |
| N10 | **v89.6 FINAL** | Deploy production |

---

## 🎯 KẾT QUẢ CUỐI CÙNG (N10)

- ✅ 4 UI Công nhân có form cập nhật SL **thật**
- ✅ 6 LSX chạy với 32 phiếu workflow **thật** (qua Supabase)
- ✅ Lark OAuth **thật** (không cần mock)
- ✅ 35 màu vải picker
- ✅ Công nợ engine tập trung
- ✅ Phân quyền 7 role + 50+ module
- ✅ A có thể **test chạy ứng dụng** với CN thật
- ✅ URL mới: `https://xxx.space.minimax.io/`

---

**A xem lịch rồi báo em bắt đầu nhé!** Em chuẩn bị Task 1 luôn 🚀
