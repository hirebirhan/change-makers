"use client";

import { MonthlyReport } from "@/types/youtube";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ReportsSectionProps {
  reports: MonthlyReport[];
}

export default function ReportsSection({ reports }: ReportsSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Reports</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-gray-500 font-medium">Month</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium">Views</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium">Watch Time (h)</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium">New Subs</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium">Engagement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reports.map((report) => (
              <tr key={report.month} className="hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">{report.month}</td>
                <td className="py-2 px-2 text-right text-gray-700">{report.totalViews.toLocaleString()}</td>
                <td className="py-2 px-2 text-right text-gray-700">{report.totalWatchTimeHours.toLocaleString()}</td>
                <td className="py-2 px-2 text-right text-green-600 font-medium">+{report.newSubscribers.toLocaleString()}</td>
                <td className="py-2 px-2 text-right text-gray-700">{report.engagementRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Views by Month</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={reports.slice().reverse()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
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
            />
            <Bar dataKey="totalViews" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
