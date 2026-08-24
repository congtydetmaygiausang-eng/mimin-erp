"use client";

// Upload ảnh/video sản phẩm lên Supabase Storage (bucket public
// "san-pham-media") - dùng chung cho mọi form có ảnh biến thể sản phẩm
// (Danh mục sản phẩm, Lệnh cắt, Kho thành phẩm). KHÔNG dùng readAsDataURL()
// nhúng base64 thẳng vào JSONB - từng làm bảng san_pham phình to hàng trăm
// MB khiến truy vấn bị Postgres huỷ do statement timeout.
import { authFetch } from "@/lib/auth-fetch";

export async function uploadProductFile(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await authFetch("/api/product-uploads", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Không thể upload file");
  return json.url as string;
}
