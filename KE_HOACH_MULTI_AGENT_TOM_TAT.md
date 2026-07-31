# 🤖 TÓM TẮT KẾ HOẠCH MULTI-AGENT MIMIN ERP

> Tác giả: Trợ lý sếp Sang  
> Ngày: 2026-07-30

---

## 📦 ĐÃ TẠO

| File | Mục đích |
|---|---|
| `KE_HOACH_MULTI_AGENT.md` | Kế hoạch chi tiết 14.9KB (kiến trúc, API, tools, triggers) |
| `orchestrator.json` | Config Mavis orchestrator (27 agents routing) |
| `agents/agent-lenh-cat.json` | Config agent Lệnh cắt (1.9KB) |
| `agents/agent-kho-vai.json` | Config agent Kho vải (1.6KB) |
| `agents/agent-cong-no.json` | Config agent Công nợ (1.7KB) |
| `agents/agent-dashboard.json` | Config agent Dashboard (1.5KB) |
| `agents/agent-bang-luong.json` | Config agent Bảng lương (1.7KB) |
| `agents/agent-audit.json` | Config agent Audit (1.7KB) |
| `apps/web/src/app/api/v1/orchestrator/query/route.ts` | API endpoint orchestrator (5.3KB) |

## 🎯 KIẾN TRÚC

```
┌──────────────────────────────────────────────┐
│  LỚP 1: ORCHESTRATOR (Mavis)                │
│  - claude-opus-4                            │
│  - Nhận query → Phân tích → Route → Tổng hợp│
└─────────────────┬────────────────────────────┘
                  │ HTTPS API + WebSocket
                  ▼
┌──────────────────────────────────────────────┐
│  LỚP 2: 21 MODULE AGENTS                    │
│  - claude-sonnet-4                          │
│  - Mỗi agent = 1 module nghiệp vụ           │
│  - Có tools riêng (query DB, tính toán)     │
└─────────────────┬────────────────────────────┘
                  │ Supabase Realtime
                  ▼
┌──────────────────────────────────────────────┐
│  LỚP 3: 5 CROSS-CUTTING AGENTS              │
│  - claude-haiku-3.5                         │
│  - Security, Audit, Notification, Backup,   │
│    Integration                              │
└──────────────────────────────────────────────┘
```

## 📊 27 AGENTS TỔNG CỘNG

**21 Module Agents:**
- agent-dashboard, agent-lenh-cat, agent-khach-hang
- agent-ke-hoach, agent-nhan-su, agent-kho-vai
- agent-kho-soi, agent-kho-phu-lieu, agent-kho-tp
- agent-don-hang, agent-cong-no, agent-qc
- agent-may, agent-hoan-thien, agent-giao-hang
- agent-cham-cong, agent-bang-luong, agent-ncc
- agent-gia-cong, agent-bao-cao, agent-cai-dat

**5 Cross-cutting:**
- agent-security, agent-audit, agent-notification
- agent-backup, agent-integration

## 💰 COST ESTIMATE

| Agent | Model | Calls/day | Cost/day |
|---|---|--:|--:|
| Orchestrator | claude-opus-4 | 500 | $15 |
| 21 Module | claude-sonnet-4 | 4200 | $42 |
| 5 Cross | claude-haiku-3.5 | 5000 | $5 |
| **Total** | | **~9700** | **~$62/day** |

## 🚀 TRIỂN KHAI 5 GIAI ĐOẠN

| Giai đoạn | Thời gian | Nội dung |
|---|---|---|
| 1. Foundation | Tuần 1 | 21 file JSON config + orchestrator + API cơ bản |
| 2. Core Modules | Tuần 2-3 | 9 agents ưu tiên (dashboard, lenh-cat, kho, cong-no, nhan-su, bang-luong) |
| 3. Workflow | Tuần 4 | 6 agents workflow (ke-hoach, qc, may, hoan-thien, giao-hang) |
| 4. Cross-cutting | Tuần 5 | 5 cross-cutting (security, audit, notification, backup, integration) |
| 5. Polish | Tuần 6 | 6 agents còn lại + E2E test + docs |

## 🔌 API ENDPOINTS

```
POST /api/v1/orchestrator/query       ← User hỏi, orchestrator route
POST /api/v1/orchestrator/execute     ← User yêu cầu hành động
GET  /api/v1/agents/{module}/list
GET  /api/v1/agents/{module}/{id}
POST /api/v1/agents/{module}/create
PUT  /api/v1/agents/{module}/{id}
DELETE /api/v1/agents/{module}/{id}
GET  /api/v1/agents/{module}/stats
POST /api/v1/agents/{module}/action
WS   /api/v1/realtime
```

## 📞 BƯỚC TIẾP THEO

Sếp Sang có 3 lựa chọn:

**Option A: Triển khai ngay Phase 1** (1 tuần)
- Em tạo 21 file JSON config còn lại
- Setup API endpoints cho 3 modules (lenh-cat, kho-vai, cong-no)
- Test với Mavis API thật
- Cost: $0 trong tuần đầu (chỉ setup)

**Option B: Làm từ từ** (2-3 tuần)
- Em setup 3 agents/đợt
- Sếp test thực tế với data
- Điều chỉnh dựa trên feedback
- Cost: $20-30/đợt

**Option C: Chỉ setup orchestrator + 3 agents chính** (3-5 ngày)
- Triển khai MVP nhanh
- Test routing + 1-2 tools
- Đánh giá hiệu quả trước khi scale

---

**Sếp Sang chọn option nào? Hay muốn em điều chỉnh gì trong kế hoạch?** 🚀

---

**Tác giả**: Trợ lý sếp Sang  
**Cập nhật**: 2026-07-30
