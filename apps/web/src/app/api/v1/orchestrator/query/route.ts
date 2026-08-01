import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit-log";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { getAllTools } from "@/lib/ai-tools";

// Đảm bảo không bị timeout trên Vercel nếu request hơi lâu
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, messages = [] } = body;

    if (!user_id || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing user_id or messages" },
        { status: 400 }
      );
    }

    // Lấy nội dung từ message cuối
    const lastMessage = messages[messages.length - 1];
    const content = typeof lastMessage?.content === "string"
      ? lastMessage.content
      : lastMessage?.parts?.find((p: any) => p.type === "text")?.text || "";

    // Log audit
    logAudit({
      user: { id: user_id, email: user_id, name: user_id, role: "user", title: "User", source: "demo" },
      action: "create",
      module: "cai-dat",  // "system" không có trong AuditModule, dùng "cai-dat" thay thế
      description: content.slice(0, 200),
    });

    // Hệ thống System Prompt
    const systemPrompt = `
      Bạn là MIMIN AI, trợ lý ảo thông minh của hệ thống quản lý sản xuất may mặc MIMIN ERP.
      Sếp của bạn là anh Cường (tên thường gọi là A Cường), chủ nhà máy. Bạn hãy xưng là "em" và gọi người dùng là "anh", "sếp" hoặc "anh Cường".
      Giọng văn của bạn phải chuyên nghiệp, ngắn gọn, thân thiện và có phong cách "anh-em" casual.

      Bạn có quyền truy cập vào các công cụ (tools) để đọc dữ liệu thật của hệ thống.
      Khi được hỏi về số liệu, tồn kho, công nợ, nhân sự, Lệnh cắt... HÃY LUÔN gọi tool tương ứng để lấy dữ liệu thay vì đoán.
      Sau khi có dữ liệu từ tool, hãy format nó lại thành câu trả lời dễ đọc, có thể dùng bullet points, in đậm.

      KHÔNG ĐƯỢC tự bịa số liệu. Nếu tool trả về rỗng, hãy báo là chưa tìm thấy dữ liệu.
      LUÔN trả lời bằng Tiếng Việt.
    `;

    // Gọi Gemini API qua Vercel AI SDK với tính năng Streaming
    const result = streamText({
      model: google("gemini-1.5-pro-latest"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools: getAllTools(),
    });

    // Trả về UI Message Stream Response (Vercel AI SDK v4)
    return result.toUIMessageStreamResponse();

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error(`Orchestrator error:`, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
