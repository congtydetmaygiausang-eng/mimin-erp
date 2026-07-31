# 💰 BÁO CÁO KIỂM TOÁN TIỀN CÔNG, GIÁ VỐN & CÔNG NỢ (v89.6.9.3)

> **Mục đích**: Báo cáo kiểm toán minh bạch công thức tính toán tài chính, tiền công nhân viên, giá vốn sản phẩm (COGS), công nợ khách hàng sỉ và công nợ đối tác gia công ngoài.

---

## 📐 1. CÔNG THỨC VÀ LOGIC TÍNH TOÁN TÀI CHÍNH

### 1.1. Công thức Tính Tiền công Sản lượng (Piece-rate Wage)
```
Tiền công Công nhân = ∑ (Số lượng SP Đạt QC × Đơn giá Công đoạn Hiệu lực)
```
- **File xử lý**: [bang-luong-engine.ts](file:///d:/APP%20ERP%20POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/bang-luong-engine.ts)
- **Quy tắc bảo mật**: Khi đơn giá công đoạn thay đổi, các chứng từ phiếu tiền công đã khóa/đối soát (`DA_DOI_SOAT`, `DA_THANH_TOAN`) **KHÔNG** bị tính lại retroactively.

### 1.2. Công thức Giá vốn Sản phẩm (COGS)
```
Giá vốn 1 Áo Polo = CP Vải + CP Phụ liệu + CP Cắt + CP In/Thêu + CP May + CP Ủi/Đóng gói + CP Phân bổ
```
- **Ví dụ sản phẩm Polo M758**:
  - Chi phí Vải Cotton: 45.000 VNĐ / áo
  - Chi phí Phụ liệu (Cổ, Bo, Nhãn, Chỉ): 6.500 VNĐ / áo
  - Chi phí Cắt: 1.200 VNĐ / áo
  - Chi phí May: 15.000 VNĐ / áo
  - Chi phí Khuy nút & Ủi đóng gói: 2.750 VNĐ / áo
  - Chi phí Phân bổ quản lý xưởng: 4.550 VNĐ / áo
  - **Tổng Giá vốn**: **75.000 VNĐ / áo**.

### 1.3. Công nợ Khách hàng Sỉ (Receivables)
```
Công nợ KH = ∑ Giá trị Đơn hàng + Phụ phí - Chiết khấu - Tổng Tiền đã Thanh toán - Hàng Trả lại
```
- **File xử lý**: [cong-no-engine.ts](file:///d:/APP%20ERP%20POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/cong-no-engine.ts)
- **Dữ liệu thật**: 8 Khách hàng sỉ (`KH-001` đến `KH-008`).

### 1.4. Công nợ Gia công Ngoài (Subcontractor Payables)
```
Công nợ Gia công = ∑ Phiếu Gia công đã Duyệt - Tổng Đã Thanh toán
```
- **File xử lý**: [doi-tac-gia-cong.ts](file:///d:/APP%20ERP%20POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/doi-tac-gia-cong.ts)
- **Dữ liệu thật**: 35 Đối tác xưởng gia công ngoài (`DT-001` đến `DT-035`).

---

## 🛡️ 2. QUY TẮC BẢO VỆ DỮ LIỆU TÀI CHÍNH

1. **Khóa chứng từ (Document Lock)**: Sau khi Kế toán bấm "Đã duyệt thanh toán", chứng từ chuyển trạng thái `DA_DUYET` và cấm chỉnh sửa.
2. **Hủy giao dịch (Rollback Safety)**: Khi hủy đơn hàng hoặc phiếu tiền công, hệ thống hoàn nguyên chính xác số dư công nợ và số lượng tồn kho.
3. **Phân loại**: **LOGIC PASS** / **UI PASS** / **PARTIAL**.
