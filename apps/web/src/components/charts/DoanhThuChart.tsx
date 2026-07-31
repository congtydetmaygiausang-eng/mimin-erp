"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useEffect, useState } from "react";

const COLORS = ["#14b8a6", "#0ea5e9", "#a855f7", "#f59e0b", "#ef4444", "#10b981"];

export function DoanhThuChart({ data, type = "line" }: { data: any[]; type?: "line" | "area" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-64 flex items-center justify-center opacity-50 text-sm">Đang tải biểu đồ...</div>;

  const Chart = type === "area" ? AreaChart : LineChart;
  const DataComp = type === "area" ? Area : Line;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Chart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="colorDt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorCp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.8} />
            <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(v: any) => `${Number(v).toLocaleString()}đ`}
        />
        <Legend />
        <DataComp type="monotone" dataKey="doanhThu" stroke={COLORS[0]} fillOpacity={1} fill="url(#colorDt)" strokeWidth={2} name="Doanh thu" />
        <DataComp type="monotone" dataKey="chiPhi" stroke={COLORS[3]} fillOpacity={1} fill="url(#colorCp)" strokeWidth={2} name="Chi phí" />
      </Chart>
    </ResponsiveContainer>
  );
}

export function LoiNhuanChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-64 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
        <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}đ`} contentStyle={{ borderRadius: 8 }} />
        <Legend />
        <Line type="monotone" dataKey="loiNhuan" stroke={COLORS[4]} strokeWidth={3} dot={{ r: 5, fill: COLORS[4] }} name="Lợi nhuận" />
        <Line type="monotone" dataKey="doanhThu" stroke={COLORS[0]} strokeWidth={2} strokeDasharray="5 5" name="DT (tham chiếu)" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarChartCustom({ data, dataKey, name, color = COLORS[1] }: { data: any[]; dataKey: string; name: string; color?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-64 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>  // Reuse LineChart
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="ten" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`} />
        <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}đ`} contentStyle={{ borderRadius: 8 }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} name={name} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CongNoPieChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || data.length === 0) return <div className="h-64 flex items-center justify-center opacity-50 text-sm">Chưa có dữ liệu</div>;
  
  // Import dynamically
  const { PieChart, Pie, Cell } = require("recharts");
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
          label={(entry: any) => `${entry.name}: ${(entry.value / 1_000_000).toFixed(1)}tr`}
          labelLine={false}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()}đ`} contentStyle={{ borderRadius: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TienDoChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-64 flex items-center justify-center opacity-50 text-sm">Đang tải...</div>;
  
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = require("recharts");
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
        <YAxis type="category" dataKey="ten" tick={{ fontSize: 11 }} width={120} />
        <Tooltip contentStyle={{ borderRadius: 8 }} />
        <Bar dataKey="tienDo" radius={[0, 4, 4, 0]}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.tienDo === 100 ? COLORS[5] : entry.tienDo > 50 ? COLORS[3] : COLORS[0]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
