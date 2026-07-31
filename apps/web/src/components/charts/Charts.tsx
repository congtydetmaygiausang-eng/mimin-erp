"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#14b8a6", "#0ea5e9", "#a855f7", "#f59e0b", "#ef4444", "#10b981", "#ec4899"];

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  backgroundColor: "rgba(255,255,255,0.95)",
  fontSize: 12,
};

const useMounted = () => {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
};

// 1. Doanh thu & Chi phí (Area Chart)
export function DoanhThuChart({ data }: { data: any[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 flex items-center justify-center opacity-50 text-sm">Đang tải biểu đồ...</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toLocaleString()}đ`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="doanhThu" stroke={COLORS[0]} fill="url(#g1)" strokeWidth={2} name="Doanh thu" />
        <Area type="monotone" dataKey="chiPhi" stroke={COLORS[3]} fill="url(#g2)" strokeWidth={2} name="Chi phí" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// 2. Lợi nhuận (Line Chart với gradient)
export function LoiNhuanChart({ data }: { data: any[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toLocaleString()}đ`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="loiNhuan" stroke={COLORS[4]} strokeWidth={3} dot={{ r: 5, fill: COLORS[4] }} name="Lợi nhuận" />
        <Line type="monotone" dataKey="doanhThu" stroke={COLORS[0]} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Doanh thu" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 3. Top sản phẩm (Bar Chart ngang)
export function TopSanPhamChart({ data }: { data: { ten: string; doanhThu: number; soLuong: number }[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`} />
        <YAxis type="category" dataKey="ten" tick={{ fontSize: 10 }} width={130} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toLocaleString()}đ`} />
        <Bar dataKey="doanhThu" fill={COLORS[0]} radius={[0, 4, 4, 0]} name="Doanh thu" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 4. Phân bổ công nợ (Pie Chart)
export function CongNoPieChart({ data }: { data: { name: string; value: number }[] }) {
  const mounted = useMounted();
  if (!mounted || data.length === 0) return <div className="h-72 flex items-center justify-center opacity-50 text-sm">Chưa có dữ liệu</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={(e: any) => e.name} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toLocaleString()}đ`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 5. Tiến độ KHSX (Horizontal Bar)
export function TienDoChart({ data }: { data: { ten: string; tienDo: number; sanPham: string }[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40 + 60)}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
        <YAxis type="category" dataKey="ten" tick={{ fontSize: 10 }} width={140} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${v}%`} />
        <Bar dataKey="tienDo" radius={[0, 4, 4, 0]} name="Tiến độ %">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.tienDo === 100 ? COLORS[5] : entry.tienDo > 50 ? COLORS[3] : COLORS[0]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 6. Công đoạn đang chạy (Stacked Bar)
export function CongDoanChart({ data }: { data: any[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="congDoan" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="hoanThanh" stackId="a" fill={COLORS[5]} name="Hoàn thành" />
        <Bar dataKey="dangLam" stackId="a" fill={COLORS[3]} name="Đang làm" />
        <Bar dataKey="choGiao" stackId="a" fill={COLORS[6]} name="Chờ giao" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 7. Nhân sự theo bộ phận (Pie)
export function NhanSuPieChart({ data }: { data: { name: string; value: number }[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-72 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e: any) => `${e.name}: ${e.value}`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 8. KPI Stat (mini sparkline)
export function Sparkline({ data, color = COLORS[0] }: { data: number[]; color?: string }) {
  const mounted = useMounted();
  if (!mounted || data.length === 0) return null;
  const chartData = data.map((v, i) => ({ x: i, y: v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sp-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.6} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="y" stroke={color} fill={`url(#sp-${color})`} strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
