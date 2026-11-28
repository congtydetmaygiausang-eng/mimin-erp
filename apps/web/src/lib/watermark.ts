/**
 * Helper đóng dấu mã sản phẩm (Watermark) trực tiếp vào ảnh bằng HTML5 Canvas.
 * Ảnh xuất ra sẽ có sẵn mã SP đóng dấu trực tiếp trên nội dung bức hình,
 * khi xem phóng to hoặc tải về máy đều có con dấu mã SP gắn liền.
 */

const watermarkCache = new Map<string, string>();

export interface WatermarkOptions {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  subText?: string;
}

/**
 * Đóng dấu mã sản phẩm lên ảnh và trả về dataURL ảnh mới đã có con dấu.
 * Nếu có lỗi (ví dụ CORS server ảnh), tự động fallback về URL gốc.
 */
export async function applyWatermark(
  imgSrc: string,
  spCode: string,
  options?: WatermarkOptions
): Promise<string> {
  if (!imgSrc || !spCode) return imgSrc;

  const code = spCode.trim().toUpperCase();
  const cacheKey = `${imgSrc}__${code}__${options?.position || "top-left"}__v3`;
  if (watermarkCache.has(cacheKey)) {
    return watermarkCache.get(cacheKey)!;
  }

  // Chạy trên browser
  if (typeof window === "undefined" || typeof document === "undefined") {
    return imgSrc;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        if (w <= 0 || h <= 0) {
          resolve(imgSrc);
          return;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imgSrc);
          return;
        }

        // 1. Vẽ ảnh gốc
        ctx.drawImage(img, 0, 0, w, h);

        // 2. Tính toán kích thước con dấu: to rõ, đẹp và hiện đại, chỉ hiển thị duy nhất Mã SP (VD: M28)
        const scale = Math.max(1.1, Math.min(3.5, w / 400));
        const fontSize = Math.round(38 * scale);
        const paddingX = Math.round(22 * scale);
        const paddingY = Math.round(12 * scale);
        const margin = Math.round(22 * scale);
        const borderRadius = Math.round(10 * scale);

        // Chuẩn bị đo đạc kích thước text mã SP
        ctx.font = `900 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        const textMetrics = ctx.measureText(code);
        const textWidth = textMetrics.width;

        // Chiều rộng & chiều cao badge con dấu to rõ, chuẩn tỷ lệ
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = fontSize + paddingY * 2;

        // 3. Xác định vị trí con dấu (mặc định: top-left góc trên bên trái)
        const pos = options?.position || "top-left";
        let x = margin;
        let y = margin;
        if (pos === "top-right") {
          x = w - boxWidth - margin;
          y = margin;
        } else if (pos === "bottom-left") {
          x = margin;
          y = h - boxHeight - margin;
        } else if (pos === "bottom-right") {
          x = w - boxWidth - margin;
          y = h - boxHeight - margin;
        }

        // 4. Vẽ nền badge con dấu cao cấp (nền đen than chì 93% + viền vàng hổ phách nổi bật)
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
        ctx.shadowBlur = Math.round(14 * scale);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = Math.round(4 * scale);

        ctx.fillStyle = "rgba(10, 15, 30, 0.93)"; // Đen than chì cực sâu
        ctx.strokeStyle = "rgba(251, 191, 36, 0.95)"; // Vàng hổ phách amber-400 sắc nét
        ctx.lineWidth = Math.max(2, Math.round(3 * scale));

        // Vẽ rounded rect
        if (typeof (ctx as any).roundRect === "function") {
          (ctx as any).roundRect(x, y, boxWidth, boxHeight, borderRadius);
        } else {
          ctx.beginPath();
          ctx.moveTo(x + borderRadius, y);
          ctx.lineTo(x + boxWidth - borderRadius, y);
          ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + borderRadius);
          ctx.lineTo(x + boxWidth, y + boxHeight - borderRadius);
          ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - borderRadius, y + boxHeight);
          ctx.lineTo(x + borderRadius, y + boxHeight);
          ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - borderRadius);
          ctx.lineTo(x, y + borderRadius);
          ctx.quadraticCurveTo(x, y, x + borderRadius, y);
          ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 5. Vẽ Mã Sản Phẩm to bản, đậm nét, màu vàng hoàng gia, căn chính giữa hộp badge
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = Math.round(6 * scale);
        ctx.fillStyle = "#fde047"; // Vàng tươi rực rỡ yellow-300
        ctx.font = `900 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        ctx.fillText(code, x + boxWidth / 2, y + boxHeight / 2 + Math.round(1 * scale));
        ctx.restore();

        // 7. Xuất ra ảnh
        const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
        watermarkCache.set(cacheKey, dataUrl);
        resolve(dataUrl);
      } catch (err) {
        // Fallback khi bị tainted canvas hoặc lỗi vẽ
        console.warn("[applyWatermark] Lỗi đóng dấu ảnh:", err);
        resolve(imgSrc);
      }
    };

    img.onerror = () => {
      resolve(imgSrc);
    };

    img.src = imgSrc;
  });
}
