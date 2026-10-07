"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendSeries } from "@/lib/entries";

const COLORS = [
  "#0d9488",
  "#2563eb",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#65a30d",
  "#0891b2",
];

const tooltipDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

export default function TrendChart({ series }: { series: TrendSeries[] }) {
  if (series.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">No symptom data for this month yet.</p>
      </div>
    );
  }

  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort();
  const data = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const s of series) {
      const point = s.points.find((p) => p.date === date);
      if (point) row[s.name] = point.average;
    }
    return row;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 pb-3 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Severity trend</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => String(Number(v.slice(8, 10)))}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              domain={[1, 10]}
              ticks={[1, 3, 5, 7, 9]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              labelFormatter={(v) =>
                typeof v === "string" ? tooltipDate.format(new Date(`${v}T00:00:00Z`)) : v
              }
              formatter={(value) => [`${value}/10 avg`]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                boxShadow: "0 4px 12px rgb(0 0 0 / 0.06)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                name={s.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                activeDot={{ r: 4.5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
