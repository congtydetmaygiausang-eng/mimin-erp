# Agent Workflow cho MIMIN ERP

Tài liệu này giúp chọn agent phù hợp khi làm việc với dự án MIMIN ERP.

## Các agent có sẵn
- General specialist: .agent.md
- UI/UX specialist: .agent.ui-ux.md
- Data/SQL specialist: .agent.data-sql.md
- Bug fixing specialist: .agent.bug-fix.md
- Finance specialist: .agent.tai-chinh.md
- Operations/Production specialist: .agent.van-hanh-production.md
- QA/Test specialist: .agent.qa-test.md
- Reporting/BI specialist: .agent.bao-cao-bi.md

## Khi nào dùng từng agent

### 1. General specialist
Dùng khi task là chung chung hoặc cần triển khai feature mới.
Ví dụ:
- thêm module mới
- chỉnh page chính
- làm feature theo yêu cầu nghiệp vụ

### 2. UI/UX specialist
Dùng khi task liên quan đến giao diện, layout, responsive, form UX.
Ví dụ:
- cải thiện bố cục page
- làm form dễ dùng hơn
- sửa spacing, màu sắc, hierarchy

### 3. Data/SQL specialist
Dùng khi task liên quan đến dữ liệu, schema, SQL, migration, seed data.
Ví dụ:
- sửa SQL
- kiểm tra cấu trúc bảng
- cập nhật dữ liệu mẫu

### 4. Bug fixing specialist
Dùng khi task là debug lỗi hoặc sửa regressions.
Ví dụ:
- lỗi render
- logic sai
- tính toán không đúng
- hành vi không như mong đợi

## Quy trình chọn agent
1. Đọc yêu cầu task.
2. Xác định loại task: feature, UI, data/SQL, hay bug.
3. Chọn agent phù hợp nhất.
4. Nếu task có nhiều phần, có thể dùng general specialist làm đầu mối và phối hợp với agent chuyên sâu.

## Gợi ý sử dụng
- Feature mới → General specialist
- Giao diện đẹp hơn → UI/UX specialist
- Chỉnh dữ liệu/schema → Data/SQL specialist
- Sửa lỗi hiện tại → Bug fixing specialist

## Mẫu prompt khi gọi agent
- “Hãy dùng UI/UX specialist để cải thiện layout trang này.”
- “Hãy dùng Data/SQL specialist để kiểm tra migration này.”
- “Hãy dùng Bug fixing specialist để debug lỗi này.”
