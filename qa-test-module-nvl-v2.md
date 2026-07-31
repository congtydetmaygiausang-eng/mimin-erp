# PROMPT KIỂM TRA TOÀN BỘ MÀN HÌNH VÀ NÚT BẤM (v2 — TỐI ƯU 10 MÀN)

## Module 1 · Nguyên vật liệu & Kho vải

Bạn là **Senior QA Engineer + Business Analyst chuyên hệ thống ERP dệt may**.

Nhiệm vụ của bạn là kiểm tra toàn bộ giao diện, dữ liệu, logic nghiệp vụ, nút bấm, bộ lọc, biểu mẫu, trạng thái và luồng xử lý của từng màn hình trong:

**Module 1 · Nguyên vật liệu & Kho vải**

Không chỉ kiểm tra giao diện hiển thị. Phải kiểm tra đầy đủ:

* Frontend.
* Backend API.
* Database.
* Phân quyền.
* Validation.
* Trạng thái nghiệp vụ.
* Công thức tính toán.
* Nhật ký thao tác.
* Tính đồng bộ giữa các màn hình.
* Responsive trên máy tính, máy tính bảng và điện thoại.

> **Ghi chú phiên bản (v2):** Danh sách 30 màn hình gốc đã được **gộp thành 10 màn theo luồng nghiệp vụ**. Mỗi màn mới = 1 module CRUD đầy đủ (List + Detail + Create + Edit + các action liên quan), bám sát quy trình sản xuất dệt may thực tế.

---

# I. PHẠM VI KIỂM TRA — 10 MÀN HÌNH TỐI ƯU

Kiểm tra lần lượt 10 màn hình (mỗi màn = 1 module nghiệp vụ hoàn chỉnh):

| # | Màn hình | Nghiệp vụ chính | Sub-flows gộp bên trong |
|---|----------|----------------|--------------------------|
| 1 | **Dashboard Module NVL** | Tổng quan KPI, cảnh báo, tồn kho theo xưởng | KPI cards, biểu đồ, alerts |
| 2 | **Lệnh sợi** | Quản lý lệnh sợi (sợi thô) | List + Detail + Tạo + Sửa + Nhận sợi TP |
| 3 | **Kho sợi** | Tồn kho sợi các xưởng | Tồn kho + Lô + Vị trí |
| 4 | **Lệnh dệt** | Quản lý lệnh dệt vải mộc | List + Detail + Tạo + Sửa + Nhận vải mộc |
| 5 | **Lệnh nhuộm** | Quản lý lệnh nhuộm vải | List + Detail + Tạo + Sửa + Kế hoạch nhuộm + Nhận vải nhuộm |
| 6 | **Kho vải** | Quản lý kho vải (mộc + TP) | Kho vải mộc + Kho vải TP + Nhập + Xuất + Điều chuyển + Kiểm kê |
| 7 | **QC vải** | Kiểm tra chất lượng vải | Phiếu QC + Lỗi + Trả xử lý |
| 8 | **Đối tác** | Nhà cung cấp + Xưởng gia công | NCC + Xưởng + Hợp đồng |
| 9 | **Công nợ & Báo cáo** | Công nợ đối tác + Báo cáo NVL | Công nợ + BC NVL + BC Hao hụt + Lịch sử thao tác |
| 10 | **Phân quyền & Cấu hình** | Phân quyền + Danh mục hệ thống | User + Role + Permission + Danh mục NVL |

Nếu hệ thống hiện tại chưa có màn hình nào trong danh sách trên, phải ghi rõ:

* Chưa có.
* Có nhưng chưa hoàn chỉnh.
* Có giao diện nhưng chưa có dữ liệu thật.
* Có nút nhưng chưa có chức năng.
* Có API nhưng chưa kết nối giao diện.

**Quy tắc kiểm tra chung cho cả 10 màn:**

Mỗi màn phải kiểm tra đầy đủ:

* Phần tiêu đề + breadcrumb + phân quyền truy cập.
* Thẻ KPI (nếu là màn Dashboard hoặc có số liệu tổng).
* Thanh tìm kiếm + bộ lọc + sắp xếp + phân trang (với màn có danh sách).
* Bảng dữ liệu (từng cột, validation, format).
* Form tạo/sửa (validation đầy đủ, công thức tự tính, dropdown từ danh mục).
* Các nút bấm (theo danh sách nút chuẩn ở mục X).
* Trạng thái nghiệp vụ + state machine.
* Phân quyền 6 roles.
* API + Database + Audit log.
* Responsive 4 breakpoints.
* Thông báo + lỗi + validation message.
* Hiệu năng + bảo mật.

---

# II. KIỂM TRA TIÊU ĐỀ MÀN HÌNH (áp dụng cho cả 10 màn)

Với mỗi màn, kiểm tra:

* Tên màn hình hiển thị đúng tên nghiệp vụ.
* Mô tả màn hình đúng nội dung.
* Breadcrumb đúng đường dẫn cha → con.
* Nút quay lại hoạt động.
* Module hiện tại tô sáng trên menu.
* Người dùng thấy đúng màn hình theo quyền.

Kết quả mong đợi:

* Không sai chính tả.
* Không hiển thị nhầm module.
* Không mở sai đường dẫn.
* Không truy cập được màn hình khi không có quyền.

---

# III. KIỂM TRA THẺ KPI (Dashboard + các màn có số liệu)

Kiểm tra các chỉ số trên Dashboard Module NVL:

### Tổng lệnh tháng

Ví dụ đang hiển thị:

* 12 tổng lệnh.
* Tăng 25%.
* Tăng 3 lệnh so với tháng trước.

Phải kiểm tra:

* Số 12 có lấy đúng từ database không.
* Chỉ tính lệnh trong tháng hiện tại.
* Có loại trừ lệnh đã xóa hay không.
* Lệnh nháp có được tính hay không.
* Phần trăm tăng có đúng công thức không.
* Nếu tháng trước bằng 0 thì xử lý phần trăm thế nào.
* Khi đổi khoảng thời gian, KPI có cập nhật không.

Công thức:

```text
Tỷ lệ tăng trưởng =
(Tổng tháng hiện tại - Tổng tháng trước)
÷ Tổng tháng trước × 100
```

### Đang sản xuất

Kiểm tra:

* Chỉ đếm trạng thái `Đang SX`.
* Có đếm `Chờ sản xuất` hay không.
* Có đếm `Tạm dừng` hay không.
* Khi đổi trạng thái một lệnh, KPI có cập nhật ngay không.

### Hoàn thành

Kiểm tra:

* Tổng số lệnh hoàn thành.
* Tỷ lệ hoàn thành 66,7% có đúng không.
* Mẫu số là tổng lệnh nào.
* Có tính lệnh hủy hay không.
* Làm tròn một chữ số thập phân.

### Tổng kg tháng

Kiểm tra:

* Tổng số kg có đúng từ các lệnh trong tháng.
* Dùng kg đặt sản xuất hay kg thực nhận.
* Có cộng lệnh bị hủy hay không.
* Có cộng trùng lệnh hay không.
* Định dạng số hàng nghìn đúng chuẩn Việt Nam.

### Tồn kho sợi theo xưởng (Dashboard widget)

Đang hiển thị:

```text
Xưởng SG: 1.240 kg, 6 lô
Xưởng Bình Dương: 850 kg, 4 lô
Xưởng Long An: 620 kg, 3 lô
Tổng: 2.710 kg
```

Kiểm tra công thức:

```text
1.240 + 850 + 620 = 2.710 kg
```

Phải kiểm tra:

* Tổng kg đúng.
* Tổng số lô đúng.
* Không cộng lô đã xuất hết.
* Không cộng kho đã khóa.
* Không cộng lô lỗi hoặc chờ QC nếu chưa được phép.
* Dữ liệu realtime thật hay dữ liệu giả.
* Nhấn vào từng xưởng mở đúng kho.
* Số liệu khớp màn Kho sợi.
* Số liệu khớp database.
* Có thời gian cập nhật cuối.

---

# IV. KIỂM TRA THANH TÌM KIẾM (áp dụng cho màn có danh sách)

Kiểm tra ô:

```text
Tìm theo mã LS, loại sợi, màu…
```

Thực hiện các trường hợp:

1. Nhập đầy đủ mã `LSOI-0012`.
2. Nhập một phần mã `0012`.
3. Tìm `Cotton`.
4. Tìm `30/1`.
5. Tìm màu `Trắng`.
6. Tìm thành phần `100% Cotton`.
7. Nhập chữ thường.
8. Nhập chữ hoa.
9. Nhập có dấu.
10. Nhập không dấu.
11. Nhập khoảng trắng đầu và cuối.
12. Nhập ký tự đặc biệt.
13. Nhập chuỗi không tồn tại.
14. Xóa nội dung tìm kiếm.
15. Nhấn Enter.
16. Dán nội dung vào ô tìm kiếm.

Kết quả mong đợi:

* Kết quả lọc đúng.
* Không phân biệt chữ hoa và chữ thường.
* Không lỗi khi nhập ký tự đặc biệt.
* Không gửi API liên tục khi người dùng đang gõ.
* Có debounce khoảng 300–500 ms.
* Không có dữ liệu phải hiển thị trạng thái rỗng.
* Xóa từ khóa phải trả về toàn bộ danh sách.

---

# V. KIỂM TRA BỘ LỌC (áp dụng cho màn có danh sách)

## Bộ lọc xưởng

Kiểm tra:

* Tất cả xưởng.
* Xưởng SG.
* Xưởng Bình Dương.
* Xưởng Long An.
* Xưởng đã ngừng hoạt động.
* Xưởng không có dữ liệu.

Phải kiểm tra:

* Kết quả đúng theo xưởng.
* KPI có thay đổi theo bộ lọc hay không.
* Bộ lọc có giữ lại sau khi tải lại trang hay không.
* Có thể kết hợp với tìm kiếm và trạng thái.

## Bộ lọc trạng thái

Kiểm tra:

* Tất cả trạng thái.
* Nháp.
* Chờ duyệt.
* Đã duyệt.
* Chờ sản xuất.
* Đang SX.
* Tạm dừng.
* Chờ nhận hàng.
* Hoàn thành.
* Hủy.

Phải kiểm tra:

* Không hiển thị sai trạng thái.
* Bộ lọc kết hợp đúng với xưởng.
* Bộ lọc kết hợp đúng với từ khóa.
* Không bị mất bộ lọc khi phân trang.

## Bộ lọc ngày

Nếu chưa có thì đề xuất bổ sung:

* Ngày tạo từ ngày.
* Ngày tạo đến ngày.
* Ngày giao từ ngày.
* Ngày giao đến ngày.
* Tháng hiện tại.
* Tháng trước.
* Quý hiện tại.
* Khoảng thời gian tùy chỉnh.

---

# VI. KIỂM TRA BẢNG DANH SÁCH (áp dụng cho màn có danh sách)

Kiểm tra từng cột:

* Mã lệnh.
* Loại sợi.
* Thành phần.
* Màu.
* Số lượng kg.
* Đơn giá.
* Thành tiền.
* Xưởng.
* Ngày tạo.
* Ngày giao.
* Trạng thái.
* Người tạo.
* Hành động.

## Kiểm tra dữ liệu từng dòng

Ví dụ:

```text
LSOI-0012
Cotton 30/1
100% Cotton
Trắng ngà
250 kg
85.000 đồng/kg
21.250.000 đồng
Xưởng SG
15/06/2026
30/06/2026
Đang SX
```

Kiểm tra công thức:

```text
Thành tiền = Số kg × Đơn giá
250 × 85.000 = 21.250.000 đồng
```

Thực hiện kiểm tra tương tự cho toàn bộ dòng.

Các lỗi cần phát hiện:

* Số lượng và đơn giá bị đặt sai cột.
* Thiếu tiêu đề cột số lượng.
* Định dạng tiền không thống nhất.
* Thiếu đơn vị kg.
* Thành tiền sai.
* Ngày giao nhỏ hơn ngày tạo.
* Trạng thái sai màu.
* Mã lệnh bị trùng.
* Xưởng không tồn tại.
* Dữ liệu bảng không khớp API.
* Dữ liệu bảng không khớp database.

---

# VII. KIỂM TRA SẮP XẾP (áp dụng cho màn có danh sách)

Kiểm tra sắp xếp theo:

* Mã lệnh.
* Ngày tạo.
* Ngày giao.
* Số lượng.
* Đơn giá.
* Thành tiền.
* Trạng thái.
* Xưởng.

Thực hiện:

* Tăng dần.
* Giảm dần.
* Nhấn nhiều lần.
* Sắp xếp sau khi tìm kiếm.
* Sắp xếp sau khi lọc.
* Sắp xếp khi chuyển trang.

Kết quả mong đợi:

* Không sắp xếp theo chuỗi đối với cột số.
* Ngày phải sắp xếp theo kiểu ngày.
* Tiền phải sắp xếp theo giá trị số.
* Trạng thái phải theo thứ tự nghiệp vụ nếu có cấu hình.

---

# VIII. KIỂM TRA PHÂN TRANG (áp dụng cho màn có danh sách)

Kiểm tra:

* 10 dòng mỗi trang.
* 20 dòng mỗi trang.
* 50 dòng mỗi trang.
* Trang đầu.
* Trang cuối.
* Trang tiếp theo.
* Trang trước.
* Nhập số trang.
* Không có dữ liệu.
* Chỉ có một trang.
* Dữ liệu vượt 100 trang.

Kết quả mong đợi:

* Không bị trùng dữ liệu.
* Không bị thiếu dữ liệu.
* Giữ nguyên bộ lọc.
* Giữ nguyên từ khóa tìm kiếm.
* Hiển thị đúng tổng số bản ghi.

---

# IX. KIỂM TRA FORM TẠO MỚI (áp dụng cho Lệnh sợi, Lệnh dệt, Lệnh nhuộm, Đối tác)

Khi nhấn `Tạo mới`, kiểm tra:

* Có mở đúng form.
* Form mở dạng trang, modal hay drawer đúng thiết kế.
* Không mở hai lần khi nhấn liên tục.
* Không tạo bản ghi rỗng trước khi lưu.
* Người không có quyền không nhìn thấy nút.

Các trường cần có (áp dụng cho form Lệnh sợi, tương tự các form khác):

```text
Mã lệnh
Ngày tạo
Ngày dự kiến giao
Nhà cung cấp hoặc xưởng sợi
Loại sợi
Chi số sợi
Thành phần sợi
Màu sợi
Mã màu
Số lượng đặt
Đơn vị
Đơn giá
Thành tiền
Thuế VAT
Chi phí vận chuyển
Tổng thanh toán
Nguồn nguyên liệu
Kho nhận
Người phụ trách
Ghi chú
Tệp đính kèm
Trạng thái
```

---

# X. KIỂM TRA VALIDATION FORM TẠO MỚI (áp dụng cho tất cả form)

## Mã lệnh

Kiểm tra:

* Tự sinh đúng định dạng.
* Không được trùng.
* Không cho sửa nếu mã tự động.
* Không sinh hai mã giống nhau khi hai người tạo cùng lúc.

Định dạng đề xuất:

```text
LSOI-YYYYMMDD-XXX
```

## Ngày tạo và ngày giao

Kiểm tra:

* Ngày tạo không được bỏ trống.
* Ngày giao không nhỏ hơn ngày tạo.
* Không nhập ký tự.
* Kiểm tra ngày nhuận.
* Kiểm tra ngày cuối tháng.

## Loại sợi

Kiểm tra:

* Không được bỏ trống.
* Phải lấy từ danh mục.
* Không cho nhập loại sợi đã ngừng sử dụng.
* Có thể thêm mới theo quyền.

## Thành phần sợi

Ví dụ:

```text
100% Cotton
60% Cotton - 40% Polyester
65% Polyester - 35% Cotton
95% Cotton - 5% Spandex
```

Kiểm tra:

* Tổng tỷ lệ phải bằng 100%.
* Không cho tỷ lệ âm.
* Không cho lớn hơn 100%.
* Không nhập trùng thành phần.
* Chuẩn hóa tên Cotton, Polyester, Spandex, Viscose.

## Số lượng

Kiểm tra:

* Bắt buộc nhập.
* Phải lớn hơn 0.
* Không cho số âm.
* Không cho ký tự.
* Có cho số lẻ hay không.
* Số lượng tối đa.
* Đơn vị mặc định là kg.

## Đơn giá

Kiểm tra:

* Không được âm.
* Không nhập chữ.
* Cho phép số thập phân hay không.
* Định dạng tiền đúng.
* Không làm tròn sai.

## Thành tiền

Phải tự động tính:

```text
Thành tiền = Số lượng × Đơn giá
```

Không cho người dùng sửa trực tiếp nếu là trường tự tính.

## VAT

Kiểm tra:

* 0%.
* 5%.
* 8%.
* 10%.
* Tỷ lệ tùy chỉnh nếu được cấp quyền.

Công thức:

```text
Tiền VAT = Thành tiền × Tỷ lệ VAT
Tổng thanh toán = Thành tiền + VAT + Chi phí khác
```

---

# XI. KIỂM TRA CÁC NÚT TRÊN FORM VÀ DANH SÁCH (áp dụng cho tất cả 10 màn)

## Nút Lưu nháp

Kiểm tra:

* Cho phép lưu khi chưa đủ một số trường.
* Trạng thái phải là `Nháp`.
* Không tạo trùng khi nhấn hai lần.
* Sau khi lưu phải có thông báo thành công.
* Có ghi nhật ký người tạo.

## Nút Gửi duyệt

Kiểm tra:

* Chỉ gửi khi đủ trường bắt buộc.
* Chuyển trạng thái `Chờ duyệt`.
* Người tạo không được tự duyệt nếu quy trình không cho phép.
* Gửi thông báo cho người duyệt.
* Khóa các trường quan trọng sau khi gửi.

## Nút Duyệt

Kiểm tra:

* Chỉ người có quyền mới được duyệt.
* Chuyển trạng thái `Đã duyệt`.
* Ghi người duyệt và thời gian duyệt.
* Không duyệt hai lần.
* Không duyệt lệnh đã hủy.

## Nút Từ chối

Kiểm tra:

* Bắt buộc nhập lý do.
* Trả trạng thái phù hợp.
* Gửi thông báo cho người tạo.
* Lưu lịch sử từ chối.

## Nút Bắt đầu sản xuất

Kiểm tra:

* Chỉ lệnh đã duyệt mới được chạy.
* Chuyển trạng thái `Đang SX`.
* Ghi ngày bắt đầu thực tế.
* Cập nhật danh sách phiếu đang xử lý.

## Nút Tạm dừng

Kiểm tra:

* Bắt buộc nhập lý do.
* Chuyển trạng thái `Tạm dừng`.
* Không tính vào số lệnh đang chạy.
* Hiển thị cảnh báo trên Dashboard.
* Có thể tiếp tục lại đúng quyền.

## Nút Tiếp tục

Kiểm tra:

* Chỉ xuất hiện với lệnh tạm dừng.
* Chuyển về `Đang SX`.
* Ghi người tiếp tục và thời gian.
* Không mất lịch sử tạm dừng.

## Nút Hoàn thành

Kiểm tra:

* Không hoàn thành khi chưa nhập số lượng thực nhận.
* Không hoàn thành khi chưa QC nếu quy trình yêu cầu.
* Chuyển trạng thái `Hoàn thành`.
* Cập nhật kho sợi.
* Tạo phiếu nhập kho.
* Cập nhật công nợ.
* Cập nhật KPI.

## Nút Hủy lệnh

Kiểm tra:

* Bắt buộc nhập lý do.
* Không cho hủy lệnh đã hoàn thành.
* Không cho hủy nếu đã nhập kho, trừ người có quyền đặc biệt.
* Không xóa dữ liệu vật lý.
* Chuyển trạng thái `Hủy`.
* Ghi lịch sử đầy đủ.

## Nút Xóa

Kiểm tra:

* Chỉ admin được dùng.
* Chỉ xóa lệnh nháp chưa phát sinh giao dịch.
* Có hộp thoại xác nhận.
* Ưu tiên soft delete.
* Không xóa liên kết kho, công nợ hoặc lịch sử.

## Nút Nhân bản

Kiểm tra:

* Tạo lệnh mới.
* Sinh mã mới.
* Không sao chép trạng thái.
* Không sao chép lịch sử.
* Cho phép sửa dữ liệu trước khi lưu.

## Nút In phiếu

Kiểm tra:

* Nội dung đúng dữ liệu.
* Không thiếu mã lệnh.
* Có thông tin công ty.
* Có xưởng.
* Có số lượng.
* Có đơn giá nếu người dùng có quyền xem giá.
* Có chữ ký.
* In đúng khổ A4.
* Không vỡ bố cục.

## Nút Xuất Excel

Kiểm tra:

* Xuất đúng dữ liệu đang lọc.
* Đúng tên cột.
* Đúng định dạng số.
* Đúng định dạng ngày.
* Không lỗi tiếng Việt.
* Không xuất các trường người dùng không có quyền xem.

## Nút Tải lại

Kiểm tra:

* Tải dữ liệu mới nhất.
* Không tạo request lặp vô hạn.
* Không mất bộ lọc nếu thiết kế yêu cầu giữ bộ lọc.
* Có trạng thái loading.

---

# XII. KIỂM TRA CHI TIẾT (màn Lệnh sợi, Lệnh dệt, Lệnh nhuộm)

Khi nhấn vào mã `LSOI-0012`, kiểm tra trang chi tiết có:

1. Thông tin chung.
2. Thành phần sợi.
3. Xưởng sản xuất.
4. Tiến độ.
5. Số lượng đặt.
6. Số lượng thực nhận.
7. Hao hụt.
8. Đơn giá.
9. Thành tiền.
10. VAT.
11. Tổng thanh toán.
12. Công nợ.
13. Phiếu nhập kho.
14. Tệp đính kèm.
15. Ghi chú.
16. Lịch sử trạng thái.
17. Người tạo.
18. Người duyệt.
19. Người cập nhật.
20. Ngày cập nhật cuối.

Kiểm tra toàn bộ tab:

* Tổng quan.
* Tiến độ.
* Nhập kho.
* Thanh toán.
* Tệp đính kèm.
* Nhật ký.

---

# XIII. KIỂM TRA PHIẾU ĐANG XỬ LÝ (Dashboard + Lệnh sợi/Dệt/Nhuộm)

Đang hiển thị:

```text
LSOI-0012
Cotton 30/1
250 kg
Xưởng SG
Hạn giao 30/06
```

Kiểm tra:

* Chỉ hiển thị lệnh đang chạy.
* Thứ tự ưu tiên theo hạn giao gần nhất.
* Lệnh quá hạn phải cảnh báo.
* Nhấn vào phiếu mở đúng chi tiết.
* Số lượng phiếu phải khớp KPI.
* Khi lệnh hoàn thành, phiếu biến mất.
* Khi lệnh tạm dừng, hiển thị trạng thái đúng.
* Tên xưởng không được viết tắt không thống nhất.

Đề xuất hiển thị:

* Số ngày còn lại.
* Số ngày trễ.
* Phần trăm tiến độ.
* Người phụ trách.
* Cảnh báo thiếu nguyên liệu.

---

# XIV. KIỂM TRA CẢNH BÁO (Dashboard)

Ví dụ:

```text
1 lệnh tạm dừng do thiếu NVL
```

Kiểm tra:

* Số lượng cảnh báo đúng.
* Nhấn vào cảnh báo lọc đúng lệnh.
* Có hiển thị nguyên nhân.
* Có người phụ trách xử lý.
* Có ngày phát sinh.
* Có mức độ nghiêm trọng.
* Có nút xác nhận đã xử lý.
* Không mất cảnh báo khi tải lại trang.
* Không hiển thị cảnh báo đã đóng.

Các cảnh báo nên có:

* Thiếu nguyên liệu.
* Lệnh quá hạn.
* Xưởng chậm tiến độ.
* Số lượng thực nhận thiếu.
* Hao hụt vượt mức.
* Đơn giá vượt ngân sách.
* Lô không đạt QC.
* Công nợ quá hạn.
* Tồn kho thấp.
* Dữ liệu chưa đồng bộ.

---

# XV. KIỂM TRA LOGIC TRẠNG THÁI (áp dụng cho Lệnh sợi, Lệnh dệt, Lệnh nhuộm)

Luồng chuẩn đề xuất:

```text
Nháp
→ Chờ duyệt
→ Đã duyệt
→ Chờ sản xuất
→ Đang SX
→ Chờ nhận hàng
→ Đã nhận một phần
→ Chờ QC
→ Đạt QC
→ Nhập kho
→ Hoàn thành
```

Nhánh ngoại lệ:

```text
Chờ duyệt → Từ chối
Đang SX → Tạm dừng
Tạm dừng → Đang SX
Đang SX → Hủy
Chờ QC → Không đạt
Không đạt → Trả xử lý
Đã nhận một phần → Chờ nhận phần còn lại
```

Kiểm tra không cho phép chuyển sai như:

* Nháp chuyển thẳng Hoàn thành.
* Hủy chuyển lại Đang SX.
* Hoàn thành chuyển về Nháp.
* Chưa duyệt nhưng bắt đầu sản xuất.
* Chưa nhận hàng nhưng nhập kho.
* Chưa QC nhưng hoàn thành.

---

# XVI. KIỂM TRA NHẬP NGUYÊN LIỆU (màn Lệnh sợi, Lệnh dệt, Lệnh nhuộm — sub-flow Nhận hàng)

Khi nhận sợi/vải, kiểm tra các trường:

```text
Mã phiếu nhập
Mã lệnh
Xưởng giao
Ngày giao thực tế
Số kg đặt
Số kg giao lần này
Lũy kế đã nhận
Số kg còn thiếu
Số kg dư
Số bao
Số lô
Mã lô
Màu thực tế
Kết quả QC
Kho nhận
Người nhận
Ảnh cân hàng
Phiếu giao hàng
Ghi chú
```

Công thức:

```text
Còn thiếu = Số lượng đặt - Lũy kế đã nhận
Tỷ lệ hao hụt = (Số lượng đặt - Số lượng đạt) ÷ Số lượng đặt × 100
```

Kiểm tra:

* Cho phép nhận nhiều lần.
* Không cộng trùng số lượng.
* Không nhận âm.
* Không nhận vượt quá mức cho phép nếu chưa xác nhận.
* Bắt buộc ảnh cân hàng nếu quy trình yêu cầu.
* Lô không đạt QC không được nhập kho đạt.
* Tự cập nhật tồn kho.
* Tự cập nhật công nợ theo số lượng thực nhận hoặc theo hợp đồng.

---

# XVII. KIỂM TRA PHÂN QUYỀN (áp dụng cho cả 10 màn)

Kiểm tra tối thiểu các vai trò:

## Admin

* Xem.
* Tạo.
* Sửa.
* Duyệt.
* Hủy.
* Xóa.
* Xuất dữ liệu.
* Xem giá.
* Xem công nợ.

## Quản lý nguyên vật liệu

* Xem.
* Tạo.
* Sửa.
* Gửi duyệt.
* Theo dõi tiến độ.
* Nhận hàng.
* Không xóa dữ liệu đã phát sinh.

## Kho

* Xem lệnh liên quan.
* Nhập kho.
* Cập nhật số lượng thực nhận.
* Không sửa đơn giá.
* Không duyệt lệnh.

## Kế toán

* Xem giá.
* Xem thanh toán.
* Cập nhật công nợ.
* Không sửa tiến độ sản xuất.

## Xưởng

* Chỉ xem lệnh của xưởng mình.
* Cập nhật tiến độ.
* Tải phiếu.
* Không xem giá nếu không được phép.
* Không xem dữ liệu xưởng khác.

## Người xem

* Chỉ xem.
* Không tạo.
* Không sửa.
* Không duyệt.
* Không xuất dữ liệu nhạy cảm nếu chưa được cấp quyền.

Phải kiểm tra cả:

* Ẩn nút trên giao diện.
* Chặn API phía backend.
* Chặn truy cập URL trực tiếp.
* Chặn sửa request bằng DevTools.
* Chặn xem dữ liệu khác chi nhánh hoặc khác xưởng.

---

# XVIII. KIỂM TRA API (gộp cho 10 màn)

Kiểm tra các API chính (gộp theo từng nhóm màn):

**Lệnh sợi / Lệnh dệt / Lệnh nhuộm** (cùng pattern, đổi resource):

```text
GET    /api/<resource>-orders
GET    /api/<resource>-orders/:id
POST   /api/<resource>-orders
PUT    /api/<resource>-orders/:id
PATCH  /api/<resource>-orders/:id/status
DELETE /api/<resource>-orders/:id
GET    /api/<resource>-orders/statistics
GET    /api/<resource>-orders/in-progress
POST   /api/<resource>-orders/:id/approve
POST   /api/<resource>-orders/:id/reject
POST   /api/<resource>-orders/:id/pause
POST   /api/<resource>-orders/:id/resume
POST   /api/<resource>-orders/:id/complete
POST   /api/<resource>-receipts
GET    /api/<resource>-receipts
```

**Kho sợi / Kho vải** (cùng pattern, đổi resource):

```text
GET    /api/<resource>-inventory
GET    /api/<resource>-inventory/by-factory
POST   /api/<resource>-inventory/import
POST   /api/<resource>-inventory/export
POST   /api/<resource>-inventory/transfer
POST   /api/<resource>-inventory/stocktake
```

**QC / Đối tác / Công nợ / Phân quyền**: tương tự, dùng pattern RESTful chuẩn.

Kiểm tra:

* Status code.
* Request body.
* Response body.
* Authentication.
* Authorization.
* Pagination.
* Filter.
* Sort.
* Validation.
* Transaction database.
* Chống gửi trùng.
* Thông báo lỗi.
* Tốc độ phản hồi.
* Không trả dữ liệu nhạy cảm.

Các status code mong đợi:

```text
200: Thành công
201: Tạo mới thành công
400: Dữ liệu không hợp lệ
401: Chưa đăng nhập
403: Không có quyền
404: Không tìm thấy
409: Trùng dữ liệu hoặc xung đột trạng thái
422: Validation thất bại
500: Lỗi hệ thống
```

---

# XIX. KIỂM TRA DATABASE (gộp schema chuẩn cho 10 màn)

Bảng lệnh NVL (áp dụng chung cho Lệnh sợi, Lệnh dệt, Lệnh nhuộm) có các trường tối thiểu:

```text
id
order_code
factory_id
supplier_id
yarn_type_id          (hoặc fabric_type_id cho vải)
yarn_count
composition
color_id
color_name
ordered_weight_kg
received_weight_kg
accepted_weight_kg
rejected_weight_kg
unit_price
subtotal
vat_rate
vat_amount
shipping_cost
total_amount
planned_start_date
planned_delivery_date
actual_start_date
actual_delivery_date
status
pause_reason
cancel_reason
notes
created_by
approved_by
created_at
updated_at
deleted_at
```

Kiểm tra:

* Primary key.
* Foreign key.
* Unique mã lệnh.
* Index tìm kiếm.
* Kiểu dữ liệu số.
* Kiểu dữ liệu tiền.
* Kiểu dữ liệu ngày.
* Soft delete.
* Audit log.
* Không lưu tiền bằng float.
* Không lưu số kg bằng chuỗi.
* Không để dữ liệu mồ côi.
* Có transaction khi nhập kho và cập nhật công nợ.

Các bảng phụ trợ cần có: `factories`, `suppliers`, `yarn_types`, `colors`, `yarn_receipts`, `inventory_lots`, `qc_records`, `users`, `roles`, `permissions`, `audit_logs`.

---

# XX. KIỂM TRA GIAO DIỆN VÀ RESPONSIVE (áp dụng cho cả 10 màn)

Kiểm tra trên:

* Desktop 1920×1080.
* Laptop 1366×768.
* Tablet 768×1024.
* Mobile 390×844.
* Màn hình phóng to 125%.
* Trình duyệt Chrome.
* Edge.
* Safari nếu có.

Kiểm tra:

* Bảng không bị tràn.
* Có cuộn ngang trên mobile.
* Nút không bị che.
* Modal không vượt màn hình.
* Chữ không bị cắt.
* KPI không chồng lên nhau.
* Tooltip hiển thị đầy đủ.
* Màu trạng thái dễ phân biệt.
* Có hỗ trợ bàn phím.
* Có trạng thái focus.
* Độ tương phản đạt yêu cầu.

---

# XXI. KIỂM TRA THÔNG BÁO VÀ LỖI (áp dụng cho cả 10 màn)

Kiểm tra các thông báo:

* Tạo thành công.
* Lưu nháp thành công.
* Cập nhật thành công.
* Duyệt thành công.
* Từ chối thành công.
* Tạm dừng thành công.
* Hoàn thành thành công.
* Xóa thành công.
* Không có quyền.
* Mất kết nối.
* API lỗi.
* Dữ liệu bị thay đổi bởi người khác.
* Phiên đăng nhập hết hạn.

Thông báo lỗi phải:

* Dễ hiểu.
* Không hiển thị mã lỗi kỹ thuật cho người dùng thường.
* Không làm mất dữ liệu đã nhập.
* Có nút thử lại khi phù hợp.
* Không hiển thị thông báo thành công khi API thất bại.

---

# XXII. KIỂM TRA HIỆU NĂNG (áp dụng cho cả 10 màn)

Kiểm tra:

* Màn hình tải dưới 3 giây.
* Tìm kiếm phản hồi dưới 1 giây.
* Bảng 10.000 lệnh vẫn phân trang được.
* Không gọi API lặp.
* Không tải toàn bộ dữ liệu khi chỉ cần một trang.
* Không render lại toàn bộ giao diện không cần thiết.
* Không rò rỉ bộ nhớ.
* Không treo khi xuất Excel.
* Có loading skeleton.
* Có cache phù hợp.
* Dữ liệu realtime không tạo quá nhiều kết nối.

---

# XXIII. KIỂM TRA BẢO MẬT (áp dụng cho cả 10 màn)

Kiểm tra:

* SQL Injection.
* XSS.
* CSRF.
* IDOR.
* Sửa ID trên URL.
* Truy cập lệnh của xưởng khác.
* Thay đổi đơn giá qua request.
* Thay đổi trạng thái trái phép.
* Upload file độc hại.
* Upload file quá dung lượng.
* Đoán mã lệnh.
* Token hết hạn.
* Đăng nhập nhiều thiết thiết bị.
* Nhật ký thao tác.
* Dữ liệu nhạy cảm trong console.
* API key bị lộ trên frontend.

---

# XXIV. CÁCH BÁO CÁO LỖI (áp dụng cho cả 10 màn)

Mỗi lỗi phải báo theo mẫu:

```text
Mã lỗi:
Màn hình:
Chức năng:
Mức độ:
Tiêu đề lỗi:
Điều kiện kiểm tra:
Các bước tái hiện:
Kết quả thực tế:
Kết quả mong đợi:
Dữ liệu kiểm thử:
Ảnh hoặc video:
API liên quan:
Bảng database liên quan:
Nguyên nhân dự đoán:
Đề xuất sửa:
Trạng thái xử lý:
Người phụ trách:
```

Mức độ lỗi:

```text
Critical: Làm mất dữ liệu, sai kho, sai công nợ, sai tiền.
High: Không thể hoàn thành nghiệp vụ chính.
Medium: Chức năng hoạt động sai nhưng có cách xử lý tạm.
Low: Lỗi giao diện, chính tả, căn chỉnh.
Improvement: Đề xuất cải tiến.
```

---

# XXV. BẢNG KẾT QUẢ KIỂM TRA (10 màn)

Trả kết quả theo bảng (một bảng cho mỗi màn, dùng mẫu dưới):

| STT | Màn hình | Chức năng    | Nút hoặc trường    | Kết quả   | Mức độ          | Mô tả lỗi | Đề xuất sửa |
| --: | -------- | ------------ | ------------------ | --------- | --------------- | --------- | ----------- |
|   1 | Lệnh sợi | Tìm kiếm     | Ô tìm kiếm         | Pass/Fail | High/Medium/Low | Mô tả     | Cách sửa    |
|   2 | Lệnh sợi | Bộ lọc       | Xưởng              | Pass/Fail |                 |           |             |
|   3 | Lệnh sợi | Bộ lọc       | Trạng thái         | Pass/Fail |                 |           |             |
|   4 | Lệnh sợi | Tạo mới      | Tạo lệnh sợi       | Pass/Fail |                 |           |             |
|   5 | Lệnh sợi | Chỉnh sửa    | Nút sửa            | Pass/Fail |                 |           |             |
|   6 | Lệnh sợi | Phê duyệt    | Nút duyệt          | Pass/Fail |                 |           |             |
|   7 | Lệnh sợi | Tạm dừng     | Nút tạm dừng       | Pass/Fail |                 |           |             |
|   8 | Lệnh sợi | Hoàn thành   | Nút hoàn thành     | Pass/Fail |                 |           |             |
|   9 | Lệnh sợi | Xuất dữ liệu | Xuất Excel         | Pass/Fail |                 |           |             |
|  10 | Lệnh sợi | Kho          | Tồn kho theo xưởng | Pass/Fail |                 |           |             |
| ... | (Lặp lại cho 9 màn còn lại) |

**Mapping bảng kết quả với 10 màn:**

1. Dashboard Module NVL — 6 dòng (KPI, cảnh báo, tồn kho, số liệu tổng)
2. Lệnh sợi — 10 dòng (theo mẫu trên)
3. Kho sợi — 6 dòng (tồn kho, lô, nhập/xuất, kiểm kê)
4. Lệnh dệt — 10 dòng (giống pattern Lệnh sợi)
5. Lệnh nhuộm — 10 dòng (giống pattern + kế hoạch nhuộm)
6. Kho vải — 8 dòng (mộc, TP, nhập, xuất, điều chuyển, kiểm kê)
7. QC vải — 6 dòng (phiếu QC, lỗi, trả xử lý)
8. Đối tác — 6 dòng (NCC, xưởng, hợp đồng)
9. Công nợ & Báo cáo — 8 dòng (công nợ, BC NVL, BC Hao hụt, lịch sử)
10. Phân quyền & Cấu hình — 6 dòng (user, role, permission, danh mục)

**Tổng cộng: ~76 dòng kiểm tra cho 10 màn** (gọn hơn 67% so với 30 màn).

---

# XXVI. YÊU CẦU CUỐI CÙNG

Sau khi kiểm tra, hãy trả về đầy đủ:

1. Danh sách 10 màn hình đã kiểm tra.
2. Danh sách tất cả nút bấm trên từng màn hình.
3. Nút nào hoạt động đúng.
4. Nút nào chưa kết nối chức năng.
5. Nút nào mở sai màn hình.
6. Nút nào không có kiểm tra quyền.
7. Trường nào thiếu validation.
8. Công thức nào tính sai.
9. Dữ liệu nào không khớp database.
10. API nào lỗi.
11. Luồng trạng thái nào chưa đúng.
12. Màn hình nào chưa responsive.
13. Lỗi nghiêm trọng có thể gây sai kho, sai tiền hoặc sai công nợ.
14. Đề xuất thứ tự ưu tiên sửa lỗi.
15. Danh sách file frontend cần sửa.
16. Danh sách file backend cần sửa.
17. Danh sách bảng database cần sửa.
18. Mã nguồn đề xuất sửa cho từng lỗi nếu có thể.

Không được chỉ nhận xét chung chung.

Phải kiểm tra trực tiếp từng nút, từng trường, từng trạng thái, từng API và từng dữ liệu hiển thị.

Nếu không thể kiểm tra được một chức năng, phải ghi rõ lý do:

```text
Không tìm thấy file.
Chưa có API.
Chưa có database.
Chưa được kết nối.
Không có quyền truy cập.
Chức năng mới chỉ là giao diện mô phỏng.
```

---

# PHỤ LỤC: BẢNG SO SÁNH v1 (30 màn) vs v2 (10 màn)

| v1 (30 màn) | v2 (10 màn) | Ghi chú gộp |
|-------------|-------------|-------------|
| Dashboard Module 1 | Màn 1: Dashboard Module NVL | Giữ nguyên |
| Lệnh sợi + Chi tiết + Tạo + Sửa + Nhận sợi | Màn 2: Lệnh sợi | Gộp CRUD + sub-flow Nhận sợi |
| Kho sợi | Màn 3: Kho sợi | Giữ nguyên |
| Lệnh dệt + Chi tiết + Tạo + Sửa + Nhận vải mộc | Màn 4: Lệnh dệt | Gộp CRUD + sub-flow Nhận vải mộc |
| Lệnh nhuộm + Kế hoạch + Chi tiết + Nhận vải nhuộm | Màn 5: Lệnh nhuộm | Gộp CRUD + Kế hoạch + Nhận vải |
| Kho vải mộc + Kho vải TP + Nhập + Xuất + Điều chuyển + Kiểm kê | Màn 6: Kho vải | Gộp 6 màn kho thành 1 |
| Kiểm tra chất lượng vải | Màn 7: QC vải | Giữ nguyên |
| Nhà cung cấp + Xưởng gia công | Màn 8: Đối tác | Gộp 2 màn |
| Công nợ + Báo cáo NVL + Báo cáo hao hụt + Lịch sử | Màn 9: Công nợ & Báo cáo | Gộp 4 màn |
| Phân quyền + Cấu hình danh mục | Màn 10: Phân quyền & Cấu hình | Gộp 2 màn |

**Tổng kết v2:**
* 10 màn hình (gộp từ 30, giảm 67%).
* Bám sát luồng nghiệp vụ thực tế.
* Vẫn giữ đầy đủ 26 sections kiểm tra.
* Bảng kết quả XXV: ~76 dòng kiểm tra (gọn, dễ theo dõi).
* Mỗi màn = 1 module CRUD đầy đủ + các sub-flows, dễ phát triển và bảo trì.
