"use client";

import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";

const axis = { stroke: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "var(--font-mono)" };
const grid = "rgba(255,255,255,0.06)";

function tip(formatter?: (v: number) => string) {
  return (
    <Tooltip
      contentStyle={{
        background: "rgba(12,12,18,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        fontSize: 12,
      }}
      labelStyle={{ color: "#8A8A99" }}
      formatter={(v: number | string) => (formatter ? formatter(Number(v)) : v)}
    />
  );
}

export function SavingsAreaChart({
  data,
}: {
  data: { date: string; actual: number; target: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="finSav" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        {tip((v) => `$${v.toLocaleString()}`)}
        <Area type="monotone" dataKey="target" stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" fill="none" />
        <Area type="monotone" dataKey="actual" stroke="#7C5CFF" strokeWidth={2} fill="url(#finSav)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function IncomeBarChart({
  data,
}: {
  data: { label: string; luis: number; delia: number; shared: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
        {tip((v) => `$${v.toLocaleString()}`)}
        <Bar dataKey="luis" stackId="a" fill="#7C5CFF" radius={[0, 0, 0, 0]} />
        <Bar dataKey="delia" stackId="a" fill="#22D3EE" radius={[0, 0, 0, 0]} />
        <Bar dataKey="shared" stackId="a" fill="#34D399" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CreditLineChart({
  data,
  people,
}: {
  data: Record<string, number | string>[];
  people: { key: string; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} domain={[300, 850]} />
        {tip()}
        {people.map((p) => (
          <Line key={p.key} type="monotone" dataKey={p.key} stroke={p.color} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function UtilizationBars({
  data,
}: {
  data: { name: string; util: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 52)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid stroke={grid} horizontal={false} />
        <XAxis type="number" {...axis} domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" {...axis} width={110} tickLine={false} axisLine={false} />
        {tip((v) => `${v.toFixed(0)}%`)}
        <ReferenceLine x={10} stroke="#34D399" strokeDasharray="4 4" label={{ value: "10%", fill: "#34D399", fontSize: 11 }} />
        <Bar dataKey="util" radius={[0, 6, 6, 0]} fill="#F472B6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
