"use client";

import { DailyMetric } from "@/types/youtube";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsChartProps {
  data: DailyMetric[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Views (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(value) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(value) => [Number(value).toLocaleString(), "Views"]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="#dc2626"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorViews)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
