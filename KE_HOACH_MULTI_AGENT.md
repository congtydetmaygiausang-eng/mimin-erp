# 🤖 KẾ HOẠCH CẤU HÌNH MULTI-AGENT CHO MIMIN ERP

> Tác giả: Trợ lý sếp Sang  
> Phiên bản: v89.6.8  
> Ngày: 2026-07-30

---

## 🎯 TỔNG QUAN

MIMIN ERP có 21 modules → em đề xuất **1 Orchestrator + 21 Module Agents + 5 Cross-cutting Agents = 27 AI agents** làm việc song song, mỗi agent chuyên trách 1 module, giao tiếp qua **Mavis API + Supabase Realtime**.

---

## 🏗️ KIẾN TRÚC 3 LỚP

```
┌──────────────────────────────────────────────────────────────┐
│  LỚP 1: ORCHESTRATOR (1 agent duy nhất)                     │
│  - Mavis (Mavis/claude-opus-4)                              │
│  - Nhận câu hỏi user → Phân tích → Gọi agents → Tổng hợp │
└─────────────────┬────────────────────────────────────────────┘
                  │ HTTPS API
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  LỚP 2: MODULE AGENTS (21 agents)                           │
│  - Mỗi agent = 1 module nghiệp vụ                          │
│  - Có tools riêng (query DB, gọi Lark, tính toán)          │
│  - Return JSON cho orchestrator                             │
└─────────────────┬────────────────────────────────────────────┘
                  │ Supabase Realtime
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  LỚP 3: CROSS-CUTTING AGENTS (5 agents)                     │
│  - Security, Audit, Notification, Backup, Integration       │
│  - Listen toàn bộ events, tự động trigger                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 DANH SÁCH 21 MODULE AGENTS

| # | Agent ID | Module | Tools chính | Trigger events |
|--:|---|---|---|---|
| 1 | `agent-dashboard` | Dashboard | `tinhKPI()`, `layDonHangMoi()`, `tinhDoanhThu()` | Realtime: tasks, kho, lenh_sx |
| 2 | `agent-lenh-cat` | Lệnh cắt | `taoLenhCat()`, `suaLenhCat()`, `tinhDinhMuc()`, `anhFile()` | User: tạo/sửa LSX |
| 3 | `agent-khach-hang` | Khách hàng | `themKH()`, `capNhatNoKH()`, `tinhDoanhThuKH()` | User: CRUD khách |
| 4 | `agent-ke-hoach` | Kế hoạch SX | `lapKH()`, `ganMay()`, `kiemTraNangLuc()` | User: lập kế hoạch |
| 5 | `agent-nhan-su` | Nhân sự | `themNV()`, `tinhLuong()`, `capNhatHopDong()` | Cron: 1/1, 15/15 |
| 6 | `agent-kho-vai` | Kho vải | `nhapVai()`, `xuatVai()`, `tinhTonKhoVai()` | User: phiếu nhập/xuất |
| 7 | `agent-kho-soi` | Kho sợi | `nhapSoi()`, `xuatSoi()`, `duKienMetVai()` | Realtime: workflow |
| 8 | `agent-kho-phu-lieu` | Kho PL | `nhapPL()`, `xuatPL()`, `canhBaoPL()` | Realtime: workflow |
| 9 | `agent-kho-tp` | Kho thành phẩm | `nhapTP()`, `xuatTP()`, `tinhGiaTriTon()` | User: phiếu đóng gói |
| 10 | `agent-don-hang` | Đơn hàng | `taoDon()`, `capNhatTrangThai()`, `tinhGiaTri()` | User: CRUD đơn |
| 11 | `agent-cong-no` | Công nợ | `tinhCongNoKH()`, `tinhCongNoNCC()`, `canhBaoQuaHan()` | Cron: mỗi 6h |
| 12 | `agent-qc` | QC | `ghiNhanLoi()`, `tinhTyLeDat()`, `canhBaoLoi()` | User: NV cập nhật SL |
| 13 | `agent-may` | Tổ may | `phanCongMay()`, `tinhTienCong()`, `theoDoiTienDo()` | Realtime: phiếu may |
| 14 | `agent-hoan-thien` | Hoàn thiện | `ghiNhanUy()`, `kiemTraCuoi()`, `dongGoi()` | Realtime: phiếu ủi |
| 15 | `agent-giao-hang` | Giao hàng | `taoPhieuGiao()`, `theoDoiVanChuyen()`, `xacNhanGiao()` | User: tạo phiếu giao |
| 16 | `agent-cham-cong` | Chấm công | `ghiCong()`, `tinhGioCong()`, `canhBaoVang()` | Cron: 17h hàng ngày |
| 17 | `agent-bang-luong` | Bảng lương | `tinhLuongCN()`, `tinhLuongCBQL()`, `xuatBangLuong()` | Cron: 1 hàng tháng |
| 18 | `agent-ncc` | NCC | `themNCC()`, `capNhatCongNo()`, `canhBaoVuotHanMuc()` | User: CRUD NCC |
| 19 | `agent-gia-cong` | Gia công ngoài | `taoPhieuGC()`, `theoDoiGiaoNhan()`, `tinhCongGC()` | User: phiếu gia công |
| 20 | `agent-bao-cao` | Báo cáo | `tongHopDoanhThu()`, `tongHopLoiNhuan()`, `xuatBaoCao()` | User: yêu cầu báo cáo |
| 21 | `agent-cai-dat` | Cài đặt | `capNhatCauHinh()`, `quanLyUser()`, `kiemTraLicense()` | Admin: thay đổi config |

---

## 📋 5 CROSS-CUTTING AGENTS

| # | Agent ID | Chức năng | Listen events |
|--:|---|---|---|
| 1 | `agent-security` | 2FA, rate-limit, audit | All `auth.*` events |
| 2 | `agent-audit` | Ghi log tất cả thao tác | All `*.*` events |
| 3 | `agent-notification` | Push notification, email, Lark msg | `task.*`, `kho.*`, `cong_no.*` |
| 4 | `agent-backup` | Tự động backup localStorage → Drive | Cron: 0h hàng ngày |
| 5 | `agent-integration` | Đồng bộ Lark Base + Supabase | Cron: 5 phút/lần |

---

## 🔌 API SPEC (RESTful + WebSocket)

### Base URL
```
Production:  https://api.mimin.vn/v1
Development: http://localhost:3000/api/v1
```

### Authentication
```
Headers:
  Authorization: Bearer <jwt_token>
  X-Agent-ID: <agent_id>
  X-Request-ID: <uuid>
```

### 1️⃣ Orchestrator Endpoints

#### POST /orchestrator/query
```json
// Request
{
  "user_id": "sang@mimin.vn",
  "query": "Lệnh cắt M758 tiến độ thế nào?",
  "context": { "lsx_id": "M758", "current_page": "/lenh-cat/" },
  "session_id": "uuid"
}

// Response
{
  "request_id": "uuid",
  "agents_called": ["agent-lenh-cat", "agent-dashboard"],
  "response": "Lệnh M758 đã cắt 320/500 áo, dự kiến xong 5/8/2026...",
  "data": {
    "lsx": { "id": "M758", "trang_thai": "dang-cat", "tien_do": 64 },
    "kpi": { "doanh_thu_du_kien": 75000000 }
  },
  "actions_taken": [
    { "agent": "agent-lenh-cat", "tool": "layTienDo", "result": {...} }
  ],
  "latency_ms": 1250
}
```

#### POST /orchestrator/execute
```json
// Request (thực thi hành động)
{
  "user_id": "sang@mimin.vn",
  "intent": "create_lenh_cat",
  "params": {
    "ma_sp": "M999",
    "ten_sp": "Áo polo trắng",
    "so_luong": 500,
    "han_hoan_thanh": "2026-08-15"
  }
}

// Response
{
  "request_id": "uuid",
  "agent": "agent-lenh-cat",
  "result": { "lsx_id": "LC-M999-1234", "status": "created" },
  "next_steps": ["Thêm ảnh", "Phân công tổ cắt"]
}
```

### 2️⃣ Module Agent Endpoints

Mỗi module agent có 5 endpoints chuẩn:

#### GET /agents/{module}/list
#### GET /agents/{module}/{id}
#### POST /agents/{module}/create
#### PUT /agents/{module}/{id}
#### DELETE /agents/{module}/{id}

#### GET /agents/{module}/stats
```json
{
  "module": "lenh_cat",
  "stats": {
    "tong_lenh": 156,
    "dang_thuc_hien": 23,
    "hoan_thanh": 128,
    "tre_han": 5
  }
}
```

#### POST /agents/{module}/action
```json
// Custom action (mỗi module có actions riêng)
{
  "action": "tao_lenh_cat",
  "params": { ... }
}
```

### 3️⃣ Realtime WebSocket

```
WS: wss://api.mimin.vn/v1/realtime?token=<jwt>

Subscribe: 
  - { "channel": "tasks", "event": "*" }
  - { "channel": "kho", "event": "INSERT" }
  - { "channel": "lenh_sx_tong", "event": "UPDATE" }

Payload:
{
  "channel": "tasks",
  "event": "UPDATE",
  "new": { "id": "...", "trang_thai": "hoan-thanh" },
  "old": { "id": "...", "trang_thai": "dang-may" },
  "agent_id": "agent-may"
}
```

---

## 🛠️ TOOLS CHO MỖI AGENT (Ví dụ)

### `agent-lenh-cat` (Lệnh cắt)
```typescript
const tools = {
  taoLenhCat: {
    description: "Tạo lệnh cắt mới",
    params: {
      ma_sp: "string (required)",
      ten_sp: "string (required)",
      loai: "enum: ao | bo",
      so_luong: "number (required)",
      han_hoan_thanh: "date (required)",
      kieu_may: "enum: tron | bo_gau | co_vest | co_polo",
      mau: "string",
      size: "string",
    },
    returns: { lsx_id: "string", tien_du_kien: "number" },
  },
  suaLenhCat: {
    description: "Sửa lệnh cắt (cần unlock nếu đã khóa)",
    params: { lsx_id: "string", updates: "object" },
    returns: { success: "boolean" },
  },
  tinhDinhMuc: {
    description: "Tính định mức vải cần dùng",
    params: { loai: "ao | bo", kieu_may: "string", so_luong: "number" },
    returns: { dinh_muc_kg: "number", dinh_muc_m: "number" },
  },
  tinhTienCongCat: {
    description: "Tính tiền công cắt (1400đ/áo, 1200đ/bộ, 900đ/...",
    params: { loai: "string", so_luong: "number" },
    returns: { tien_cong: "number" },
  },
  layTienDo: {
    description: "Lấy tiến độ 7 khâu của 1 LSX",
    params: { lsx_id: "string" },
    returns: { phieu_workflow: "array" },
  },
};
```

### `agent-cong-no` (Công nợ)
```typescript
const tools = {
  tinhCongNoKH: {
    description: "Tính công nợ 1 khách hàng",
    params: { kh_id: "string", tu_ngay: "date", den_ngay: "date" },
    returns: { cong_no: "number", qua_han: "number" },
  },
  tinhCongNoNCC: {
    description: "Tính công nợ 1 NCC (có check hạn mức)",
    params: { ncc_id: "string" },
    returns: { cong_no: "number", han_muc: "number", vuot_han_muc: "boolean" },
  },
  canhBaoQuaHan: {
    description: "List NCC/KH có công nợ quá hạn > 30 ngày",
    params: { loai: "kh | ncc", so_ngay: "number" },
    returns: { canh_bao: "array<{id, ten, so_tien, so_ngay}>" },
  },
  tongHopCongNo: {
    description: "Tổng hợp công nợ toàn hệ thống (KH + NCC + công đoạn)",
    returns: { tong_kh: "number", tong_ncc: "number", tong_cong_doan: "number" },
  },
};
```

---

## ⚙️ CẤU HÌNH AGENT (JSON cho Mavis/Claude/GPT)

### File: `agents/agent-lenh-cat.json`
```json
{
  "agent_id": "agent-lenh-cat",
  "name": "Agent Lệnh Cắt",
  "version": "1.0.0",
  "model": "claude-sonnet-4-20250514",
  "system_prompt": "Bạn là AI Agent chuyên trách Module Lệnh Cắt của MIMIN ERP. Bạn có quyền truy cập database bảng lenh_sx_tong, tasks, kho. Bạn giúp người dùng tạo, sửa, xem, tính toán lệnh cắt. Khi user hỏi, hãy dùng tools phù hợp. Khi tạo lệnh mới, luôn validate: ma_sp unique, so_luong > 0, han_hoan_thanh > today. Trả lời ngắn gọn, có data cụ thể.",
  "tools": [
    "taoLenhCat",
    "suaLenhCat",
    "tinhDinhMuc",
    "tinhTienCongCat",
    "layTienDo",
    "xoaLenhCat"
  ],
  "context": {
    "database_tables": ["lenh_sx_tong", "tasks", "kho", "phieu_workflow"],
    "data_scope": "PLANNER",
    "max_rows_per_query": 100
  },
  "rate_limit": {
    "requests_per_minute": 60,
    "requests_per_hour": 1000
  },
  "fallback": {
    "on_error": "agent-dashboard",
    "retry_count": 3
  }
}
```

### File: `orchestrator.json` (Mavis root config)
```json
{
  "agent_id": "orchestrator",
  "name": "MIMIN Orchestrator (Mavis)",
  "version": "1.0.0",
  "model": "claude-opus-4-20250514",
  "system_prompt": "Bạn là Orchestrator AI của MIMIN ERP. Nhận câu hỏi từ user, phân tích ý định, gọi 1 hoặc nhiều module agents, tổng hợp kết quả, trả lời tự nhiên. Luôn gọi agent-lenh-cat trước cho câu hỏi về LSX, agent-kho-* cho câu hỏi về tồn kho, agent-cong-no cho câu hỏi về nợ, v.v. Nếu user yêu cầu thực thi (tạo/sửa), confirm trước khi gọi POST/PUT/DELETE.",
  "agents": [
    "agent-dashboard", "agent-lenh-cat", "agent-khach-hang",
    "agent-ke-hoach", "agent-nhan-su", "agent-kho-vai",
    "agent-kho-soi", "agent-kho-phu-lieu", "agent-kho-tp",
    "agent-don-hang", "agent-cong-no", "agent-qc",
    "agent-may", "agent-hoan-thien", "agent-giao-hang",
    "agent-cham-cong", "agent-bang-luong", "agent-ncc",
    "agent-gia-cong", "agent-bao-cao", "agent-cai-dat"
  ],
  "routing_rules": [
    { "intent": "lenh_cat|tao|sua|xem", "agent": "agent-lenh-cat" },
    { "intent": "kho|ton|nhap|xuat", "agent": "agent-kho-vai|soi|phu-lieu|tp" },
    { "intent": "cong_no|no|han_muc", "agent": "agent-cong-no" },
    { "intent": "luong|cong|tinh_luong", "agent": "agent-bang-luong" }
  ],
  "context": {
    "user_session": "required",
    "permissions_check": true
  }
}
```

---

## 🚀 TRIỂN KHAI THEO 5 GIAI ĐOẠN

### Giai đoạn 1: Foundation (Tuần 1)
- [x] Đã có 1 file `KE_HOACH_MULTI_AGENT.md` (file này)
- [ ] Tạo folder `agents/` với 21 file JSON config
- [ ] Tạo file `orchestrator.json`
- [ ] Setup Supabase Realtime channels
- [ ] Deploy API endpoints cơ bản (CRUD cho 3 modules đầu: lenh-cat, kho-vai, cong-no)

### Giai đoạn 2: Core Modules (Tuần 2-3)
- [ ] Implement 9 agents ưu tiên: dashboard, lenh-cat, kho-vai, kho-soi, kho-phu-lieu, kho-tp, cong-no, nhan-su, bang-luong
- [ ] Test tích hợp với Mavis/Claude API
- [ ] Test rate-limit + 2FA + audit log

### Giai đoạn 3: Workflow Agents (Tuần 4)
- [ ] Implement 6 agents workflow: ke-hoach, don-hang, qc, may, hoan-thien, giao-hang
- [ ] Wire realtime subscriptions
- [ ] Auto-trigger khi phiếu workflow chuyển trạng thái

### Giai đoạn 4: Cross-cutting (Tuần 5)
- [ ] Implement 5 cross-cutting agents: security, audit, notification, backup, integration
- [ ] Setup cron jobs
- [ ] Lark Base sync engine

### Giai đoạn 5: Polish (Tuần 6)
- [ ] Implement 6 agents còn lại: khach-hang, cham-cong, ncc, gia-cong, bao-cao, cai-dat
- [ ] E2E test toàn bộ 27 agents
- [ ] Documentation + training data
- [ ] Deploy production

---

## 💰 ESTIMATE COST

| Agent | Model | Calls/day | Cost/day |
|---|---|--:|--:|
| Orchestrator (Mavis) | claude-opus-4 | 500 | $15 |
| 21 Module agents | claude-sonnet-4 | 200/each = 4200 | $42 |
| 5 Cross-cutting | claude-haiku-3.5 | 1000/each = 5000 | $5 |
| **Total** | | **~9700** | **~$62/day** |

Có thể giảm 50% bằng cách:
- Dùng Sonnet cho 80% queries
- Cache kết quả 5-10 phút
- Batch processing thay vì real-time

---

## 📞 BƯỚC TIẾP THEO

1. Sếp review kế hoạch → Chốt scope giai đoạn 1
2. Em tạo:
   - 21 file `agents/*.json` (config mỗi agent)
   - 1 file `orchestrator.json`
   - Folder `api/` (Next.js API routes)
   - Folder `lib/agent-tools/` (tools cho từng module)
3. Deploy thử 3 agents đầu (lenh-cat, kho-vai, cong-no) → Test với Mavis
4. Nếu OK → Scale ra 21 agents

---

**Sếp Sang chốt: bắt đầu giai đoạn 1 ngay, hay muốn điều chỉnh gì trước?** 🚀

Tác giả: Trợ lý sếp Sang  
Cập nhật: 2026-07-30
