"use client";

import { Building2, Factory, Mail, MapPin, Phone, Plus, Shirt } from "lucide-react";
import Link from "next/link";
import {
  thuocNhomSanXuatVai,
  type LoaiNccSanXuatVai,
  type NhaCungCapModel,
  useNhaCungCap,
} from "@/lib/data/nha-cung-cap-store";

type NhomDanhBa = {
  key: LoaiNccSanXuatVai;
  title: string;
  desc: string;
  icon: typeof Building2;
  color: string;
  empty: string;
};

const NHOM_DANH_BA: NhomDanhBa[] = [
  {
    key: "soi",
    title: "NCC sợi",
    desc: "Dùng cho bước nhập sợi khi tạo lệnh SX vải",
    icon: Shirt,
    color: "blue",
    empty: "Chưa có nhà cung cấp sợi",
  },
  {
    key: "det",
    title: "NCC dệt",
    desc: "Dùng cho bước giao dệt/gia công vải mộc",
    icon: Factory,
    color: "violet",
    empty: "Chưa có nhà cung cấp dệt",
  },
  {
    key: "nhuom",
    title: "NCC nhuộm",
    desc: "Dùng cho bước giao nhuộm và hoàn tất màu",
    icon: Building2,
    color: "rose",
    empty: "Chưa có nhà cung cấp nhuộm",
  },
];

const colorClass: Record<string, { wrap: string; icon: string; badge: string }> = {
  blue: {
    wrap: "border-blue-200 bg-blue-50",
    icon: "bg-blue-500 text-white",
    badge: "bg-blue-500/10 text-blue-700",
  },
  violet: {
    wrap: "border-violet-200 bg-violet-50",
    icon: "bg-violet-500 text-white",
    badge: "bg-violet-500/10 text-violet-700",
  },
  rose: {
    wrap: "border-rose-200 bg-rose-50",
    icon: "bg-rose-500 text-white",
    badge: "bg-rose-500/10 text-rose-700",
  },
};

function NccCard({ ncc, badgeClass }: { ncc: NhaCungCapModel; badgeClass: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900">{ncc.ten_ncc}</div>
          <div className="mt-0.5 text-[11px] font-mono text-slate-500">{ncc.ma_ncc}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
          {ncc.loai}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-[11px] text-slate-600">
        {ncc.sdt && (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{ncc.sdt}</span>
          </div>
        )}
        {ncc.email && (
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{ncc.email}</span>
          </div>
        )}
        {ncc.dia_chi && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{ncc.dia_chi}</span>
          </div>
        )}
      </div>

      {ncc.danh_muc_chi_tiet && ncc.danh_muc_chi_tiet.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ncc.danh_muc_chi_tiet.map((item) => (
            <span key={item} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function MasterData() {
  const { list, loading } = useNhaCungCap();
  const danhBaSxVai = NHOM_DANH_BA.map((nhom) => ({
    ...nhom,
    items: list.filter((ncc) => thuocNhomSanXuatVai(ncc, nhom.key)),
  }));

  const tong = danhBaSxVai.reduce((sum, nhom) => sum + nhom.items.length, 0);

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Danh bạ NCC sản xuất vải</h2>
          <p className="text-xs text-slate-500">
            Tự cập nhật từ danh sách Nhà cung cấp, dùng cho form Lệnh SX vải.
          </p>
        </div>
        <Link
          href="/nha-cung-cap"
          className="inline-flex items-center gap-1 rounded-lg bg-[#0B4D5D] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0a3f4d]"
        >
          <Plus className="h-3.5 w-3.5" />
          Cập nhật NCC
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {danhBaSxVai.map((nhom) => (
          <div key={nhom.key} className={`rounded-lg border p-2 ${colorClass[nhom.color].wrap}`}>
            <div className="text-xl font-black text-slate-900">{nhom.items.length}</div>
            <div className="text-[11px] font-bold text-slate-600">{nhom.title}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
          Đang tải danh bạ nhà cung cấp...
        </div>
      ) : tong === 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Chưa có NCC thuộc loại sợi, dệt hoặc nhuộm. Anh vào “Cập nhật NCC” để chọn đúng vai trò/chuyên môn.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {danhBaSxVai.map((nhom) => {
            const Icon = nhom.icon;
            const colors = colorClass[nhom.color];
            return (
              <section key={nhom.key} className={`rounded-lg border p-3 ${colors.wrap}`}>
                <div className="mb-3 flex items-start gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">
                      {nhom.title} ({nhom.items.length})
                    </h3>
                    <p className="text-[11px] font-medium text-slate-600">{nhom.desc}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {nhom.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-3 text-center text-xs font-semibold text-slate-500">
                      {nhom.empty}
                    </div>
                  ) : (
                    nhom.items.map((ncc) => <NccCard key={ncc.id} ncc={ncc} badgeClass={colors.badge} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
