# 9 AGENT TỔNG HỢP - MIMIN ERP v89.6.9

## Danh sách 9 nhân viên AI:

| # | Nhân viên | Tuổi | Chức vụ | Kinh nghiệm | Module |
|---|-----------|------|---------|-------------|--------|
| 1 | Anh Hùng | 52 | GĐ Sản xuất | 30 năm | san-xuat |
| 2 | Anh Khoa | 48 | GĐ Kho | 25 năm | kho |
| 3 | Anh Sơn | 45 | Kế toán trưởng | 22 năm | ke-toan |
| 4 | Chị Mai | 42 | TP Nhân sự | 18 năm | nhan-su |
| 5 | Anh Sâu | 99 | AI Toàn năng | DeepSeek+R1 | deepseek |
| 6 | Chị Hoa | 40 | TP Bán hàng | 15 năm | ban-hang |
| 7 | Anh Quốc | 48 | CFO | 23 năm | tai-chinh |
| 8 | Chị Hạnh | 38 | TP Theo dõi SX | 15 năm | theo-doi-cd |
| 9 | Anh Tuấn KT | 50 | TP Kỹ thuật may | 28 năm | ky-thuat-may |

## Files:
- `agent-*.json` (9 files): Config mỗi agent
- `orchestrator.json`: Routing rules
- `agent-personas.ts`: TypeScript personas với đầy đủ tính cách, giọng nói, câu chào

## Cách dùng:
Import vào project MIMIN ERP:
```ts
import { AGENT_PERSONAS, getPersona } from "./agent-personas";
import { callAgent } from "./agent-runtime-v2";

const res = await callAgent({
  agent_id: "agent-san-xuat",
  user_message: "Tình hình LSX?",
  user_id: "sang@mimin.vn",
});
```
