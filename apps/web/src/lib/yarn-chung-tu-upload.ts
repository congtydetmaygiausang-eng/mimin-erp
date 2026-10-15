"use client";

import { supabase } from "@/lib/supabase/client";
import type { UploadedFile } from "@/components/ui/ImageUploader";

/**
 * Nén ảnh trên trình duyệt trước khi upload (tiết kiệm băng thông, load nhanh)
 */
export function compressImageToBlob(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8
): Promise<{ blob: Blob; dataUrlFallback: string }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      const reader = new FileReader();
      reader.onload = () => resolve({ blob: file, dataUrlFallback: reader.result as string });
      reader.onerror = () => resolve({ blob: file, dataUrlFallback: "" });
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ blob: file, dataUrlFallback: url });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.5); // Fallback base64 nhỏ nhẹ
          resolve({ blob: blob || file, dataUrlFallback: dataUrl });
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve({ blob: file, dataUrlFallback: reader.result as string });
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

/**
 * Upload 1 file chứng từ lên Supabase Storage
 * Ưu tiên:
 * 1. Bucket 'chung-tu-san-xuat'
 * 2. Fallback: Bucket 'san-pham-media' (subfolder 'chung-tu-san-xuat')
 * 3. Fallback: Base64 nén siêu nhẹ (~30KB)
 */
export async function uploadChungTuSanXuat(
  file: File,
  folder = "soi-det-nhuom",
  category = "Chứng từ"
): Promise<UploadedFile> {
  const fileExt = file.name.split(".").pop() || "jpg";
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, "");
  const timeKey = Date.now();
  const randKey = Math.random().toString(36).substring(2, 8);
  const filePath = `${folder}/${timeKey}_${randKey}.${cleanExt}`;

  const { blob, dataUrlFallback } = await compressImageToBlob(file);

  // 1. Thử upload lên Supabase Storage
  if (supabase) {
    // Ưu tiên 1: Bucket chung-tu-san-xuat
    try {
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("chung-tu-san-xuat")
        .upload(filePath, blob, {
          cacheControl: "31536000",
          upsert: true,
          contentType: file.type || "image/jpeg",
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage
          .from("chung-tu-san-xuat")
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          return {
            id: `CT_${timeKey}_${randKey}`,
            name: file.name,
            type: file.type || "image/jpeg",
            size: blob.size,
            dataUrl: urlData.publicUrl,
            category,
            uploadedAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("[Storage] Thử bucket chung-tu-san-xuat chưa được, thử sang san-pham-media:", e);
    }

    // Ưu tiên 2: Fallback sang bucket public sẵn có 'san-pham-media'
    try {
      const fallbackPath = `chung-tu/${filePath}`;
      const { data: fbData, error: fbErr } = await supabase.storage
        .from("san-pham-media")
        .upload(fallbackPath, blob, {
          cacheControl: "31536000",
          upsert: true,
          contentType: file.type || "image/jpeg",
        });

      if (!fbErr && fbData) {
        const { data: urlData } = supabase.storage
          .from("san-pham-media")
          .getPublicUrl(fallbackPath);

        if (urlData?.publicUrl) {
          return {
            id: `CT_${timeKey}_${randKey}`,
            name: file.name,
            type: file.type || "image/jpeg",
            size: blob.size,
            dataUrl: urlData.publicUrl,
            category,
            uploadedAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("[Storage] Thử bucket san-pham-media:", e);
    }
  }

  // Ưu tiên 3: Lưu fallback base64 nén gọn gàng
  return {
    id: `CT_${timeKey}_${randKey}`,
    name: file.name,
    type: file.type || "image/jpeg",
    size: blob.size,
    dataUrl: dataUrlFallback,
    category,
    uploadedAt: new Date().toISOString(),
  };
}
