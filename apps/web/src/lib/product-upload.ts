"use client";

// Upload ảnh/video sản phẩm lên Supabase Storage (bucket public
// "san-pham-media") - dùng chung cho mọi form có ảnh biến thể sản phẩm
// (Danh mục sản phẩm, Lệnh cắt, Kho thành phẩm). KHÔNG dùng readAsDataURL()
// nhúng base64 thẳng vào JSONB - từng làm bảng san_pham phình to hàng trăm
// MB khiến truy vấn bị Postgres huỷ do statement timeout.
import { supabase } from "@/lib/supabase/client";

/**
 * Nén ảnh client-side bằng HTML5 Canvas trước khi tải lên.
 * Giảm dung lượng ảnh từ 5MB - 12MB (camera điện thoại) xuống còn ~100KB - 200KB,
 * giúp tốc độ upload tăng gấp 20-30 lần (chỉ mất 0.2s - 0.5s), không bị treo form.
 */
async function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<{ data: Blob | File; ext: string }> {
  // Chỉ nén nếu là file ảnh và đang chạy trên trình duyệt
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return { data: file, ext: file.name.split(".").pop() || "jpg" };
  }

  // Bỏ qua nén nếu là ảnh GIF hoặc SVG
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return { data: file, ext: file.name.split(".").pop() || "gif" };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Tính tỷ lệ co giãn giữ nguyên aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ data: file, ext: file.name.split(".").pop() || "jpg" });
        return;
      }

      // Tô nền trắng đề phòng PNG trong suốt bị đen khi chuyển JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve({ data: blob, ext: "jpg" });
          } else {
            // Nếu blob sau nén không nhỏ hơn file gốc thì giữ file gốc
            resolve({ data: file, ext: file.name.split(".").pop() || "jpg" });
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ data: file, ext: file.name.split(".").pop() || "jpg" });
    };

    img.src = objectUrl;
  });
}

export async function uploadProductFile(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error("Chưa cấu hình Supabase");

  // Nén ảnh trước khi upload để tối ưu tốc độ và dung lượng mạng
  const { data: uploadPayload, ext } = await compressImage(file, 1280, 0.82);
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

  const { error } = await supabase.storage
    .from("san-pham-media")
    .upload(fileName, uploadPayload, {
      cacheControl: "31536000",
      contentType: ext === "jpg" || ext === "jpeg" ? "image/jpeg" : file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Lỗi upload lên Supabase Storage");
  }

  const { data: urlData } = supabase.storage
    .from("san-pham-media")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
