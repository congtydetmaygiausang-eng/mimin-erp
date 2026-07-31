# 🎨 KẾ HOẠCH GIAO DIỆN NGƯỜI DÙNG - MIMIN ERP MULTI-AGENT

> Tác giả: Trợ lý sếp Sang  
> Ngày: 2026-07-30

---

## 🏗️ TỔNG QUAN UI (3 LỚP)

```
┌──────────────────────────────────────────────────────────────┐
│  LỚP 1: AI ASSISTANT (Chat với Mavis)                       │
│  - Floating chat widget ở mọi trang                         │
│  - Hoặc /ai-assistant full-screen                           │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  LỚP 2: AGENT DASHBOARD (/agents/)                          │
│  - Grid 26 agents với status, latency, cost                 │
│  - Click vào 1 agent → chi tiết                            │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  LỚP 3: REALTIME MONITOR (/realtime-monitor/)               │
│  - Live event stream                                         │
│  - Audit log viewer                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 MÀN HÌNH 1: AI ASSISTANT (CHAT WIDGET)

### Vị trí: Floating bottom-right ở mọi trang

```
┌─────────────────────────────────────────────┐
│  ✕                                         │
│                                             │
│  🤖 Trợ lý sếp Sang                        │
│  ─────────────────                         │
│                                             │
│  [User]: Lệnh cắt M758 tiến độ?            │
│                                             │
│  [AI]: Đang gọi agent-lenh-cat...          │
│        Lệnh M758 đang ở khâu Cắt           │
│        320/500 áo (64%)                     │
│        Dự kiến xong 5/8/2026                │
│        [Xem chi tiết]                       │
│                                             │
│  ─────────────────                         │
│  [Nhập câu hỏi...        ] [📎] [Gửi ▶]   │
│                                             │
│  💡 Gợi ý:                                │
│  • "Tồn kho vải?"                          │
│  • "Công nợ quá hạn?"                      │
│  • "Lương tháng 7?"                        │
└─────────────────────────────────────────────┘
```

### Behavior:
- Mở rộng: 380px × 600px (mobile: full screen)
- Voice input (mic button)
- Markdown render: bảng, code, list
- Quick actions: nút "Tạo LSX", "Xem kho", v.v.
- Streaming response (hiển thị từng từ)

### Files:
- `src/components/AIAssistant/ChatWidget.tsx` (main)
- `src/components/AIAssistant/MessageList.tsx`
- `src/components/AIAssistant/MessageInput.tsx`
- `src/components/AIAssistant/QuickActions.tsx`
- `src/app/(main)/ai-assistant/page.tsx` (full-screen)

---

## 📱 MÀN HÌNH 2: AGENT DASHBOARD `/agents/`

### Layout: Grid 4 cột × nhiều hàng

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 AGENT DASHBOARD                            [● Đang chạy 26]│
│  ──────────────────────────────────────────────────────────────│
│  📊 Tổng: 9700 calls/ngày | $62/ngày | Avg latency 1.2s         │
├─────────────────────────────────────────────────────────────────┤
│  🔍 [Tìm agent...]    🏷️ [Tất cả ▼] [Module ▼] [● Active ▼]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐│
│  │ 📊 Dashboard │ │ ✂️ Lệnh cắt │ │ 👥 Khách hàng│ │ 📅 KHSX││
│  │ ● Active     │ │ ● Active     │ │ ● Active     │ │ ● Active││
│  │ Sonnet-4     │ │ Sonnet-4     │ │ Sonnet-4     │ │ Sonnet-4││
│  │ 1.2s avg     │ │ 0.8s avg     │ │ 1.5s avg     │ │ 2.1s avg││
│  │ 234 calls/ngày│ │ 156 calls/d │ │ 89 calls/d   │ │ 67 calls/d││
│  │              │ │              │ │              │ │        ││
│  │ [Chi tiết →] │ │ [Chi tiết →] │ │ [Chi tiết →] │ │ [Chi tiết→]││
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘│
│                                                                 │
│  ... (26 agents total)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Mỗi Agent Card hiển thị:
- Icon + Tên + Module
- Status: 🟢 Active / 🟡 Paused / 🔴 Error / ⚪ Disabled
- Model: Sonnet-4 / Haiku-3.5 / Opus-4
- Avg latency (last 1h)
- Calls/ngày
- Cost estimate ($/ngày)
- Nút "Chi tiết", "Pause", "Test"

### Files:
- `src/app/(main)/agents/page.tsx` (grid)
- `src/components/AgentCard.tsx`
- `src/components/AgentFilter.tsx`

---

## 📱 MÀN HÌNH 3: AGENT DETAIL `/agents/[id]/`

### Layout: 3 panels (info / tools / activity)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Quay lại    ✂️ Agent Lệnh Cắt                  [⏸ Pause] [⚙️]│
├──────────────────────────────────┬───────────────────────────────┤
│  📋 THÔNG TIN                     │  🛠 TOOLS (7)                │
│  ────────                         │  ──────                      │
│  Agent ID: agent-lenh-cat         │  ✅ taoLenhCat                │
│  Model: claude-sonnet-4           │     89 calls / 0.8s avg      │
│  Status: 🟢 Active                │  ✅ suaLenhCat                │
│  System prompt: 234 tokens        │     12 calls / 1.2s avg      │
│  Tools: 7                         │  ✅ tinhDinhMuc               │
│  Triggers: 2                      │     45 calls / 0.5s avg      │
│  Data scope: PLANNER              │  ✅ layTienDo                 │
│  Rate limit: 60/min, 1000/h       │     234 calls / 0.3s avg     │
│                                   │  ...                         │
│  📊 METRICS (24h)                 │                               │
│  ──────                           │                               │
│  Total calls:    1,234            │  ⚡ TRIGGERS (2)             │
│  Success rate:   98.5%            │  ──────                      │
│  Avg latency:    0.85s            │  📥 lenh_sx_tong:INSERT       │
│  P95 latency:    2.1s             │     → Tự tạo lệnh cắt       │
│  Tokens used:    234,567          │  📥 lenh_sx_tong:UPDATE       │
│  Cost:           $4.20            │     → Cập nhật dashboard     │
│                                   │                               │
│  📈 LATENCY CHART                 │  📋 RECENT CALLS             │
│  ─────                            │  ──────                      │
│  [Biểu đồ 24h latency]            │  12:34 layTienDo  0.3s ✅    │
│  [Biểu đồ 24h cost]               │  12:33 taoLenhCat 0.8s ✅    │
│                                   │  12:30 layTienDo  0.4s ✅    │
│                                   │  ...                         │
└──────────────────────────────────┴───────────────────────────────┘
```

### Files:
- `src/app/(main)/agents/[id]/page.tsx`
- `src/components/AgentInfo.tsx`
- `src/components/AgentTools.tsx`
- `src/components/AgentTriggers.tsx`
- `src/components/AgentActivity.tsx`
- `src/components/AgentMetrics.tsx`

---

## 📱 MÀN HÌNH 4: REALTIME MONITOR `/realtime-monitor/`

### Layout: Live event stream

```
┌──────────────────────────────────────────────────────────────────┐
│  📡 REALTIME EVENT MONITOR          [⏸ Pause] [⚙️ Filter] [📥 Export]│
├──────────────────────────────────────────────────────────────────┤
│  📊 Today: 1,234 events | 56 by agents | 1,178 by users          │
│  🔥 Hot channels: tasks (45%), kho (23%), lenh_sx (18%)          │
├──────────────────────────────────────────────────────────────────┤
│  12:34:56  tasks:UPDATE       agent-may          ✅ 0.3s         │
│             └─ new.soLuongDat: 320                                │
│                                                                   │
│  12:34:55  kho:UPDATE (vai)   agent-kho-vai      ✅ 0.5s         │
│             └─ new.don_gia: 42.000                                │
│                                                                   │
│  12:34:50  lenh_sx_tong:UPDATE agent-lenh-cat   ✅ 0.8s         │
│             └─ new.trang_thai: "dang-cat"                         │
│                                                                   │
│  12:34:45  users:INSERT        agent-security     ✅ 0.2s         │
│             └─ new.email: "nv017@mimin.vn"                        │
│                                                                   │
│  12:34:30  cong_no:UPDATE     agent-cong-no      ⚠️ HIGH          │
│             └─ new.vuot_han_muc: true (Sammoon 909tr/1tỷ)        │
│                                                                   │
│  ... auto-scroll                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Files:
- `src/app/(main)/realtime-monitor/page.tsx`
- `src/components/RealtimeEventList.tsx`
- `src/components/RealtimeChannelChart.tsx`

---

## 📱 MÀN HÌNH 5: ORCHESTRATOR CHAT FULL `/ai-assistant/`

### Layout: 2-pane (history + chat)

```
┌──────────────────────────────────────────────────────────────────┐
│  💬 AI ASSISTANT (Mavis)                                          │
├────────────────┬─────────────────────────────────────────────────┤
│ 📜 HISTORY     │  ┌──────────────────────────────────────────┐  │
│                │  │                                          │  │
│ • Lệnh cắt?    │  │  [User] Lệnh cắt M758 tiến độ?          │  │
│   2 min ago    │  │                                          │  │
│                │  │  [AI] Đang gọi agent-lenh-cat...        │  │
│ • Tồn kho?     │  │      ┌────────────────────────────┐     │  │
│   1 hour ago   │  │      │ 📊 Tiến độ M758             │     │  │
│                │  │      │ Cắt:  320/500 áo (64%)     │     │  │
│ • Lương T7?    │  │      │ May:  chưa bắt đầu         │     │  │
│   Yesterday    │  │      │ Dự kiến: 5/8/2026          │     │  │
│                │  │      └────────────────────────────┘     │  │
│ • Công nợ?     │  │                                          │  │
│   2 days ago   │  │      Chi tiết: M758 có thể trễ hạn       │  │
│                │  │      nếu tổ ủi không tăng ca.           │  │
│                │  │                                          │  │
│ [+ New chat]   │  │  [Mở LSX M758] [Xem kho vải] [Tạo NV]   │  │
│                │  │                                          │  │
│                │  │  [User] Tăng ca ổ được không?            │  │
│                │  │                                          │  │
│                │  │  [AI] ...                                │  │
│                │  └──────────────────────────────────────────┘  │
│                │  ┌──────────────────────────────────────────┐  │
│                │  │ [Nhập câu hỏi...] [📎] [🎤] [Gửi ▶]   │  │
│                │  └──────────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────────┘
```

### Files:
- `src/app/(main)/ai-assistant/page.tsx`
- `src/components/AIAssistant/ChatHistory.tsx`
- `src/components/AIAssistant/ChatArea.tsx`
- `src/components/AIAssistant/MessageBubble.tsx`
- `src/components/AIAssistant/RichResponse.tsx` (render markdown, table, chart)

---

## 🎨 DESIGN SYSTEM

### Theme: Mở rộng từ theme hiện tại

| Element | Color | Note |
|---|---|---|
| Background | gradient teal-cyan (giữ nguyên) | Hiện tại |
| Primary | sky-500 → sky-600 | CTA chính |
| Success | emerald-500 | Active, OK |
| Warning | amber-500 | Cảnh báo |
| Danger | rose-500 | Lỗi, urgent |
| Info | blue-500 | Thông tin |
| Card | glass + backdrop-blur | `.card` class |
| Border | rgba(255,255,255,0.1) | Dark mode |

### Typography
- Sans: Inter (default)
- Mono: JetBrains Mono (cho code/JSON)
- Size: 14px base, 12px small, 16px medium

### Components dùng chung
- `Card` (glass effect)
- `Button` (primary/secondary/ghost)
- `Badge` (status, tag)
- `Toast` (sonner)
- `Modal` (CrudModal)
- `DataTable` (sortable, filterable)
- `Chart` (recharts)
- `Tabs` (navigation)

---

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
sm: 640px   - 1 col grid, full-screen chat
md: 768px   - 2 col grid, side-by-side panels
lg: 1024px  - 3 col grid, full layout
xl: 1280px  - 4 col grid, max content
2xl: 1536px - large desktop
```

### Mobile-specific:
- Sidebar collapse thành drawer
- Chat widget full-screen
- Agent grid: 1 col
- Realtime: filter ẩn bớt

---

## 🔌 NAVIGATION STRUCTURE

Thêm vào Sidebar (group mới: "AI & AGENTS"):

```
├── 🏠 Dashboard
├── 📦 Kho
│   ├── Kho vải
│   ├── Kho sợi
│   ├── Kho phụ liệu
│   └── Kho thành phẩm
├── ...
├── 🤖 AI & AGENTS  ← GROUP MỚI
│   ├── 💬 AI Assistant     (/ai-assistant/)
│   ├── 🤖 Agents Dashboard (/agents/)
│   ├── 📡 Realtime Monitor (/realtime-monitor/)
│   └── 📋 Audit Log        (/audit-log/)
```

---

## 🛠️ IMPLEMENTATION PHASES

### Phase 1: AI Assistant Chat Widget (1-2 ngày)
- Floating chat widget
- Gọi `/api/v1/orchestrator/query`
- Streaming response
- Quick actions

### Phase 2: Agent Dashboard (2-3 ngày)
- Grid 26 agents với status
- API `/api/v1/agents` (list all)
- Auto-refresh mỗi 30s

### Phase 3: Agent Detail (2-3 ngày)
- `/agents/[id]/page.tsx`
- 3 panels: info/tools/activity
- Charts (latency, cost)

### Phase 4: Realtime Monitor (1-2 ngày)
- Live event stream
- Filter theo channel/agent
- Export logs

### Phase 5: Polish (1 ngày)
- Mobile responsive
- Dark mode
- Performance optimization
- Accessibility (ARIA)

**Tổng: 7-11 ngày (1 AI làm) hoặc 3-5 ngày (2 AI song song)**

---

## 💰 COST

| Tính năng | Effort | Impact |
|---|---|---|
| AI Assistant | 1-2 ngày | ⭐⭐⭐⭐⭐ Cao - user thấy ngay |
| Agent Dashboard | 2-3 ngày | ⭐⭐⭐⭐ Trung bình - admin/ops |
| Realtime Monitor | 1-2 ngày | ⭐⭐⭐ Thấp - debug only |
| Agent Detail | 2-3 ngày | ⭐⭐⭐⭐ Trung bình |

**Khuyến nghị**: Phase 1 (AI Assistant) trước, vì user thấy ngay và giải quyết 80% use case.

---

## 📞 BƯỚC TIẾP THEO

Sếp Sang chọn:

**Option A: Làm hết 5 phase** (7-11 ngày, full features)
**Option B: Phase 1 (AI Assistant)** (1-2 ngày, quick win)
**Option C: Phase 1 + 2** (3-5 ngày, MVP đầy đủ)
**Option D: Chỉ prototype UI** (em viết HTML/CSS mẫu, sếp review trước)

---

**Tác giả**: Trợ lý sếp Sang  
**Cập nhật**: 2026-07-30
