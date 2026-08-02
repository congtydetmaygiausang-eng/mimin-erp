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
      return NextResponse.json(
        { error: "MINIMAX_API_KEY not configured on server" },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        {
          error: `MiniMax image API ${res.status}: ${errMsg}`,
          hint:
            res.status === 401
              ? "API key sai hoặc hết hạn. Cần key từ platform.minimax.io (International)"
              : res.status === 429
                ? "Rate limit 10 ảnh/phút. Đợi rồi thử lại."
                : undefined,
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
