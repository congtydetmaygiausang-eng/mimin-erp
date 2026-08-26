"use client";

// Upload ảnh/video sản phẩm lên Supabase Storage (bucket public
// "san-pham-media") - dùng chung cho mọi form có ảnh biến thể sản phẩm
// (Danh mục sản phẩm, Lệnh cắt, Kho thành phẩm). KHÔNG dùng readAsDataURL()
// nhúng base64 thẳng vào JSONB - từng làm bảng san_pham phình to hàng trăm
// MB khiến truy vấn bị Postgres huỷ do statement timeout.
import { supabase } from "@/lib/supabase/client";

export async function uploadProductFile(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error("Chưa cấu hình Supabase");

  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("san-pham-media")
    .upload(fileName, file, {
      cacheControl: "3600",
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
