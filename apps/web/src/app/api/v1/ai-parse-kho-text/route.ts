import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Nút "AI Tự điền" ở nhap-kho-mobile/xuat-kho-mobile TRƯỚC ĐÂY là giả hoàn
// toàn (setTimeout 1.5s + regex bóc số trong chuỗi, luôn điền cứng
// tenSP="Mặt hàng (AI Tự điền)" + maSP="SP-AI-001") nhưng vẫn báo "AI đã bóc
// tách dữ liệu thành công!" - người dùng có thể tin và tạo phiếu kho với mã/
// tên hàng rác. Route này gọi AI thật (DeepSeek, cùng key đã dùng cho 6
// agent) để bóc tách đúng nghĩa từ văn bản tự do, KHÔNG bịa field nào không
// tìm thấy trong văn bản (trả null, form giữ nguyên giá trị cũ cho field đó).
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Thiếu nội dung cần bóc tách" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: "Nội dung quá dài (tối đa 2000 ký tự)" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`ai-parse-kho:${ip}`, { max: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: `Quá nhiều yêu cầu, vui lòng đợi ${rl.retryAfterSec}s` }, { status: 429 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "Chưa cấu hình DEEPSEEK_API_KEY" }, { status: 500 });
    }

    const systemPrompt = `Bạn bóc tách thông tin phiếu kho (nhập hoặc xuất) từ văn bản tự do tiếng Việt (nhân viên gõ nhanh, có thể viết tắt/thiếu dấu).
Trả về DUY NHẤT 1 JSON object, không thêm chữ nào khác, đúng format:
{"tenSP": string|null, "maSP": string|null, "soLuong": number|null, "donGia": number|null, "loaiKho": "vai"|"phu-lieu"|null, "nhaCC": string|null, "ghiChu": string|null, "lsx": string|null}
Quy tắc:
- Field nào KHÔNG có thông tin rõ ràng trong văn bản -> để null, TUYỆT ĐỐI không bịa/đoán giá trị.
- donGia là đơn giá/1 đơn vị (không phải thành tiền) - nếu văn bản chỉ ghi tổng tiền, để null.
- loaiKho: "vai" nếu nói về vải/mét/cuộn vải, "phu-lieu" nếu nói về phụ liệu/nút/khoá/chỉ/nhãn.
- lsx: mã lệnh sản xuất nếu có nhắc tới (VD "LSX-0123", "lệnh sản xuất 123" -> "LSX-0123"), chuẩn hoá dạng "LSX-<số>".`;

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json({ error: `Lỗi gọi AI (${res.status}): ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI trả về định dạng không đọc được, thử lại giúp em" }, { status: 502 });
    }

    return NextResponse.json({
      tenSP: typeof parsed.tenSP === "string" ? parsed.tenSP : null,
      maSP: typeof parsed.maSP === "string" ? parsed.maSP : null,
      soLuong: typeof parsed.soLuong === "number" ? parsed.soLuong : null,
      donGia: typeof parsed.donGia === "number" ? parsed.donGia : null,
      loaiKho: parsed.loaiKho === "vai" || parsed.loaiKho === "phu-lieu" ? parsed.loaiKho : null,
      nhaCC: typeof parsed.nhaCC === "string" ? parsed.nhaCC : null,
      ghiChu: typeof parsed.ghiChu === "string" ? parsed.ghiChu : null,
      lsx: typeof parsed.lsx === "string" ? parsed.lsx : null,
    });
  } catch (err) {
    console.error("[ai-parse-kho-text] error:", err);
    return NextResponse.json({ error: "Lỗi không xác định" }, { status: 500 });
  }
}
