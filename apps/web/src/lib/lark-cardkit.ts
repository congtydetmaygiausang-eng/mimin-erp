// ============================================
// MIMIN ERP - Lark CardKit API Wrapper
// Tạo + gửi interactive message cards tới Lark
// Docs: https://open.larksuite.com/document/uAjLw4CM/ukzMukzMukzM/feishu-cards/card-json-v2-structure
// ============================================

const LARK_BASE_URL = "https://open.larksuite.com/open-apis";

interface CardResponse {
  code: number;
  msg: string;
  data?: {
    card_id?: string;
    message_id?: string;
  };
}

function getConfig() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mimin_lark_unified_v1");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function getAccessToken(): string | null {
  // Lấy user access token từ lark-user-token
  try {
    const raw = localStorage.getItem("mimin_lark_user_token_v1");
    if (raw) {
      const t = JSON.parse(raw);
      if (t.expiresAt > Date.now()) return t.accessToken;
    }
  } catch {}
  // Fallback: dùng mock
  return "mock-token";
}

// ============================================
// CREATE CARD ENTITY
// POST /open-apis/cardkit/v1/cards
// ============================================
export async function createCardEntity(cardData: any): Promise<CardResponse> {
  const token = getAccessToken();
  try {
    const res = await fetch(`${LARK_BASE_URL}/cardkit/v1/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "card_json",
        data: JSON.stringify(cardData),
      }),
    });
    return await res.json();
  } catch (e: any) {
    return { code: -1, msg: e.message, data: {} };
  }
}

// ============================================
// SEND CARD TO USER/CHAT
// POST /open-apis/im/v1/messages
// ============================================================
export async function sendCardToUser(cardId: string, receiveId: string, receiveIdType: "open_id" | "user_id" | "email" | "chat_id" = "open_id"): Promise<CardResponse> {
  const token = getAccessToken();
  try {
    const res = await fetch(`${LARK_BASE_URL}/im/v1/messages?receive_id_type=${receiveIdType}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: "interactive",
        content: JSON.stringify({ type: "card", data: { card_id: cardId } }),
      }),
    });
    return await res.json();
  } catch (e: any) {
    return { code: -1, msg: e.message, data: {} };
  }
}

// ============================================================
// CARD TEMPLATES - 5 templates cho MIMIN ERP
// ============================================================

// Template 1: Thông báo LSX mới
export function cardTemplateLSXMoi(lsx: any) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `🆕 Lệnh cắt mới: ${lsx.maSP}`,
      },
      template: "blue",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Mã LSX:** ${lsx.id}\n**Sản phẩm:** ${lsx.tenSP}\n**Số lượng:** ${lsx.soLuong} ${lsx.donVi}\n**Hạn hoàn thành:** ${lsx.hanHoanThanh}\n**Người phụ trách:** ${lsx.nguoiPhuTrach}`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "📋 Xem chi tiết" },
              type: "primary",
              url: `https://mimin-erp.app/lenh-cat/?id=${lsx.id}`,
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "✅ Nhận" },
              type: "default",
              value: { action: "accept_lsx", lsx_id: lsx.id },
            },
          ],
        },
      ],
    },
  };
}

// Template 2: Cảnh báo công nợ quá hạn
export function cardTemplateCongNoQuaHan(items: Array<{ kh_ten: string; so_tien: number; so_ngay: number }>) {
  const totalAmount = items.reduce((s, i) => s + i.so_tien, 0);
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `🔴 Cảnh báo: ${items.length} KH quá hạn thanh toán`,
      },
      template: "red",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Tổng công nợ quá hạn:** ${(totalAmount / 1_000_000).toFixed(1)} triệu đồng\n\n${items
            .slice(0, 5)
            .map((i, idx) => `${idx + 1}. **${i.kh_ten}** - ${(i.so_tien / 1_000_000).toFixed(1)}tr (${i.so_ngay} ngày)`)
            .join("\n")}`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "📊 Xem chi tiết" },
              type: "primary",
              url: "https://mimin-erp.app/cong-no/",
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "📞 Gọi KH" },
              type: "default",
              value: { action: "call_all_debtors" },
            },
          ],
        },
      ],
    },
  };
}

// Template 3: Báo cáo tuần
export function cardTemplateBaoCaoTuan(stats: { doanh_thu: number; lsx_hoan_thanh: number; lsx_dang_lam: number; loi_nhuan: number }) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: "📊 Báo cáo tuần - MIMIN ERP",
      },
      template: "green",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Tuần qua:**\n\n- 💰 Doanh thu: **${(stats.doanh_thu / 1_000_000).toFixed(1)} triệu**\n- ✅ LSX hoàn thành: **${stats.lsx_hoan_thanh}**\n- ⚙️ LSX đang làm: **${stats.lsx_dang_lam}**\n- 📈 Lợi nhuận: **${(stats.loi_nhuan / 1_000_000).toFixed(1)} triệu**`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "📈 Xem dashboard" },
              type: "primary",
              url: "https://mimin-erp.app/dashboard/",
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "📥 Tải PDF" },
              type: "default",
              value: { action: "download_weekly_report" },
            },
          ],
        },
      ],
    },
  };
}

// Template 4: Approval workflow
export function cardTemplateApproval(req: { type: string; requester: string; amount: number; reason: string; request_id: string }) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `✋ Yêu cầu duyệt: ${req.type}`,
      },
      template: "orange",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Người yêu cầu:** ${req.requester}\n**Số tiền:** ${(req.amount / 1_000_000).toFixed(1)} triệu\n**Lý do:** ${req.reason}\n**Mã yêu cầu:** ${req.request_id}`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "✅ Duyệt" },
              type: "primary",
              value: { action: "approve", request_id: req.request_id },
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "❌ Từ chối" },
              type: "danger",
              value: { action: "reject", request_id: req.request_id },
            },
          ],
        },
      ],
    },
  };
}

// Template 5: Workflow update (phiếu chuyển khâu)
export function cardTemplateWorkflowUpdate(phieu: { id: string; maSP: string; trang_thai: string; nguoi_phu_trach: string; tien_do: number }) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `🔄 ${phieu.id} - ${phieu.trang_thai}`,
      },
      template: "purple",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Mã SP:** ${phieu.maSP}\n**Người phụ trách:** ${phieu.nguoi_phu_trach}\n**Tiến độ:** ${phieu.tien_do}%`,
        },
        {
          tag: "progress",
          value: phieu.tien_do,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "📋 Xem chi tiết" },
              type: "primary",
              url: `https://mimin-erp.app/workflow/?id=${phieu.id}`,
            },
          ],
        },
      ],
    },
  };
}


// Template 6: Kho sắp hết
export function cardTemplateKhoSapHet(items: Array<{ ten: string; ton: number; don_vi: string; ncc: string }>) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `⚠️ ${items.length} mặt hàng sắp hết`,
      },
      template: "orange",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Cần nhập gấp:**\n\n${items.map((i, idx) => `${idx + 1}. **${i.ten}** - tồn: ${i.ton} ${i.don_vi} (NCC: ${i.ncc})`).join("\n")}`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "📦 Đặt hàng ngay" },
              type: "primary",
              url: "https://mimin-erp.app/nha-cung-cap/",
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "📊 Xem kho" },
              type: "default",
              value: { action: "view_kho" },
            },
          ],
        },
      ],
    },
  };
}

// Template 7: NV mới vào
export function cardTemplateNVMoi(nv: { maNV: string; ten: string; chucVu: string; ngayVao: string; phongBan: string }) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `👋 Chào mừng ${nv.ten}!`,
      },
      template: "blue",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Mã NV:** ${nv.maNV}\n**Chức vụ:** ${nv.chucVu}\n**Phòng ban:** ${nv.phongBan}\n**Ngày vào:** ${nv.ngayVao}`,
        },
        {
          tag: "hr",
        },
        {
          tag: "markdown",
          content: "📋 **Checklist onboarding:**\n- [ ] Ký hợp đồng lao động\n- [ ] Cấp BHXH\n- [ ] Setup tài khoản MIMIN ERP\n- [ ] Training quy trình SX\n- [ ] Cấp đồng phục",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "📋 Xem hồ sơ" },
              type: "primary",
              url: `https://mimin-erp.app/nhan-su/?id=${nv.maNV}`,
            },
          ],
        },
      ],
    },
  };
}

// Template 8: LSX trễ hạn
export function cardTemplateLSXTreHan(items: Array<{ id: string; maSP: string; tre: number; nguoi: string }>) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `🔴 ${items.length} LSX trễ hạn!`,
      },
      template: "red",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Cần xử lý gấp:**\n\n${items.map((i, idx) => `${idx + 1}. **${i.id}** - ${i.maSP} (trễ ${i.tre} ngày) - ${i.nguoi}`).join("\n")}`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "🔥 Xử lý ngay" },
              type: "danger",
              url: "https://mimin-erp.app/ke-hoach-san-xuat/",
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "📞 Gọi NV" },
              type: "default",
              value: { action: "call_all_late_lsx" },
            },
          ],
        },
      ],
    },
  };
}

// Template 9: Lương đã chi
export function cardTemplateLuongDaChi(stats: { thang: number; nam: number; tong: number; cn: number; cbql: number; nguoi: number }) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `💰 Bảng lương ${stats.thang}/${stats.nam} - ĐÃ CHI`,
      },
      template: "green",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Tổng chi:** ${(stats.tong / 1_000_000).toFixed(1)} triệu\n**Số người:** ${stats.nguoi}\n\n- Công nhân: ${(stats.cn / 1_000_000).toFixed(1)}tr\n- Cán bộ QL: ${(stats.cbql / 1_000_000).toFixed(1)}tr`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "📊 Xem chi tiết" },
              type: "primary",
              url: "https://mimin-erp.app/bang-luong/",
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "📥 Tải Excel" },
              type: "default",
              value: { action: "download_payroll" },
            },
          ],
        },
      ],
    },
  };
}

// Template 10: Đơn hàng mới
export function cardTemplateDonHangMoi(dh: { id: string; kh: string; sp: string; sl: number; deadline: string; giaTri: number }) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `🛒 Đơn hàng mới từ ${dh.kh}`,
      },
      template: "blue",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Mã ĐH:** ${dh.id}\n**Sản phẩm:** ${dh.sp}\n**Số lượng:** ${dh.sl}\n**Deadline:** ${dh.deadline}\n**Giá trị:** ${(dh.giaTri / 1_000_000).toFixed(1)} triệu`,
        },
        {
          tag: "hr",
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "✅ Xác nhận" },
              type: "primary",
              value: { action: "accept_order", order_id: dh.id },
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "❌ Từ chối" },
              type: "danger",
              value: { action: "reject_order", order_id: dh.id },
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "📋 Chi tiết" },
              type: "default",
              url: `https://mimin-erp.app/don-hang/?id=${dh.id}`,
            },
          ],
        },
      ],
    },
  };
}

// Template 11: Hệ thống OK (heartbeat)
export function cardTemplateSystemOK(stats: { uptime: number; records: number; errors24h: number; users: number }) {
  return {
    schema: "2.0",
    header: {
      title: {
        tag: "plain_text",
        content: `💚 Hệ thống hoạt động bình thường`,
      },
      template: "green",
    },
    body: {
      elements: [
        {
          tag: "markdown",
          content: `**Uptime:** ${stats.uptime} ngày\n**Records:** ${stats.records.toLocaleString()}\n**Errors 24h:** ${stats.errors24h}\n**Users online:** ${stats.users}`,
        },
        {
          tag: "hr",
        },
        {
          tag: "markdown",
          content: "✅ Database OK\n✅ Lark sync OK\n✅ Backups OK\n✅ Realtime OK",
        },
      ],
    },
  };
}

// ============================================================
// HELPER: Tạo + gửi card 1 lần
// ============================================================
export async function createAndSendCard(cardData: any, receiveId: string, receiveIdType: "open_id" | "user_id" | "email" | "chat_id" = "open_id") {
  // Bước 1: Tạo card entity
  const cardRes = await createCardEntity(cardData);
  if (cardRes.code !== 0 || !cardRes.data?.card_id) {
    return { ok: false, error: cardRes.msg || "Tạo card thất bại" };
  }

  // Bước 2: Gửi card
  const sendRes = await sendCardToUser(cardRes.data.card_id, receiveId, receiveIdType);
  if (sendRes.code !== 0) {
    return { ok: false, error: sendRes.msg || "Gửi card thất bại" };
  }

  return { ok: true, card_id: cardRes.data.card_id, message_id: sendRes.data?.message_id };
}
