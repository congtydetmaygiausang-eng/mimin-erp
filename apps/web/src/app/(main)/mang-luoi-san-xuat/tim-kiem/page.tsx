"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimKiemRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mang-luoi-san-xuat");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="card p-10 text-center opacity-60">
        Đang chuyển hướng về trang chủ sản xuất...
      </div>
    </div>
  );
}
