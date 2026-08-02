import { NextRequest, NextResponse } from "next/server";

// ============================================
// POST /api/v1/ai/generate-image
// Body: { prompt: string, aspect_ratio?: string, reference_image?: string }
// Returns: { url: string, model: string, usage: object }
// MiniMax image-01 model - text-to-image + image-to-image
// ============================================

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aspect_ratio = "1:1", reference_image } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt' field" },
        { status: 400 }
      );
    }

    if (prompt.length > 1500) {
      return NextResponse.json(
        { error: "Prompt too long (max 1500 characters)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      console.error("[generate-image] MINIMAX_API_KEY not configured on Vercel");
      return NextResponse.json(
        { error: "MINIMAX_API_KEY chưa được cấu hình trên Vercel", hint: "Vào Vercel → Settings → Environment Variables → thêm MINIMAX_API_KEY" },
        { status: 500 }
      );
    }

    // Log key prefix để debug (không log full key vì security)
    const keyPrefix = apiKey.substring(0, Math.min(15, apiKey.length));
    console.log(`[generate-image] Using key prefix: ${keyPrefix}... | prompt: ${prompt.substring(0, 50)}... | aspect: ${aspect_ratio}`);

    // Build payload for MiniMax image-01
    const payload: Record<string, any> = {
      model: "image-01",
      prompt: prompt.trim(),
      aspect_ratio,
      response_format: "url", // URL output (expires in 24h - có thể đổi sang base64 nếu cần)
    };

    // Optional: subject reference (image-to-image)
    if (reference_image && typeof reference_image === "string") {
      payload.subject_reference = [
        {
          type: "character",
          image_file: reference_image,
        },
      ];
    }

    const res = await fetch("https://api.minimax.io/v1/image_generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = errText.slice(0, 300);
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errJson.message || errMsg;
      } catch {
        // keep raw text
      }

      // Log chi tiết để debug
      console.error(`[generate-image] MiniMax API error ${res.status}: ${errMsg}`);

      // Phát hiện key sai format để hint
      let extraHint: string | undefined;
      if (res.status === 401) {
        if (apiKey.startsWith("MINIMAX-")) {
          extraHint = "Key hiện tại bắt đầu bằng 'MINIMAX-' (format cũ). Cần key mới từ platform.minimax.io (International) - format 'sk-api-...'";
        } else if (apiKey.startsWith("eyJ")) {
          extraHint = "Key có format JWT. Có thể key China (.com) - cần key International (.io)";
        } else {
          extraHint = "API key sai, hết hạn, hoặc bị revoke. Generate key mới từ platform.minimax.io";
        }
      } else if (res.status === 429) {
        extraHint = "Rate limit 10 ảnh/phút. Đợi 1 phút rồi thử lại";
      } else if (res.status === 400) {
        extraHint = "Prompt không hợp lệ hoặc ảnh tham chiếu quá lớn. Thử bỏ ảnh tham chiếu + viết prompt chi tiết hơn";
      } else if (res.status === 413) {
        extraHint = "Ảnh tham chiếu quá lớn (>4.5MB). Đã auto-resize ở client - kiểm tra console log";
      }

      return NextResponse.json(
        {
          error: `MiniMax image API ${res.status}: ${errMsg}`,
          hint: extraHint,
          key_prefix: keyPrefix, // Trả về cho client biết key nào đang dùng
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    const images = data.data?.image_base64 || data.images || data.data?.images;
    const firstImage = Array.isArray(images) ? images[0] : images;
    const imageUrl = data.data?.image_url || data.image_url || firstImage;

    return NextResponse.json({
      url: imageUrl,
      model: "image-01",
      provider: "minimax",
      aspect_ratio,
      usage: data.usage || null,
      created: data.created || Date.now(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error("[generate-image] error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
