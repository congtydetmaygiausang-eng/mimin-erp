"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  features,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  features: { label: string; count: number }[];
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Icon className="w-7 h-7 text-brand-500" />
          {title}
        </h1>
        <p className="opacity-70 mt-1 text-sm">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.label} className="card card-hover p-5">
            <div className="text-3xl font-bold text-brand-500">{f.count.toLocaleString()}</div>
            <div className="text-sm opacity-70 mt-1">{f.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-semibold mb-1">{title} — đang phát triển</h2>
        <p className="text-sm opacity-70 max-w-md mx-auto">
          Module này đã có sẵn UI cơ bản, sẵn sàng kết nối Supabase. A muốn em ưu tiên tính năng nào, cứ bảo em nhé.
        </p>
        <div className="flex items-center justify-center gap-2 mt-5">
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-1.5">
            Về Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/lenh-cat" className="btn-secondary">
            Xem Lệnh cắt
          </Link>
        </div>
      </div>
    </div>
  );
}
