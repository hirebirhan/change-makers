"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Video } from "@/types/youtube";

interface UploadCalendarProps {
  videos: Video[];
}

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKS = 52;

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function cellColor(count: number) {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-chart-1/40";
  if (count === 2) return "bg-chart-1/70";
  return "bg-chart-1";
}

export function UploadCalendar({ videos }: UploadCalendarProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; titles: string[] } | null>(null);

  // Build date → videos map
  const uploadMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const v of videos) {
      const key = toYMD(new Date(v.publishedAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v.title);
    }
    return map;
  }, [videos]);

  // Build 52-week grid starting from the Sunday 52 weeks ago
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // roll back to Sunday
    startDate.setDate(startDate.getDate() - WEEKS * 7);          // go back 52 weeks

    const weeks: { date: Date; ymd: string }[][] = [];
    const labels: { month: string; col: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: Date; ymd: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        const ymd = toYMD(date);
        week.push({ date, ymd });

        if (d === 0 && date.getMonth() !== lastMonth) {
          labels.push({ month: MONTHS[date.getMonth()], col: w });
          lastMonth = date.getMonth();
        }
      }
      weeks.push(week);
    }

    return { weeks, monthLabels: labels };
  }, []);

  const totalUploads = uploadMap.size;
  const activeWeeks = useMemo(() => {
    return weeks.filter((w) => w.some((d) => (uploadMap.get(d.ymd)?.length ?? 0) > 0)).length;
  }, [weeks, uploadMap]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Upload Calendar</CardTitle>
            <CardDescription className="text-xs">
              {totalUploads} upload days · {activeWeeks} active weeks in the past year
            </CardDescription>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className={`w-3 h-3 rounded-sm ${cellColor(n)}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-max">
            {/* Month labels */}
            <div className="flex mb-1 ml-7">
              {monthLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-[10px] text-muted-foreground"
                  style={{ marginLeft: i === 0 ? `${label.col * 14}px` : `${(label.col - (monthLabels[i - 1]?.col ?? 0)) * 14 - 24}px`, minWidth: 24 }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1">
                {DAYS.map((d, i) => (
                  <div key={i} className="w-5 h-3 text-[9px] text-muted-foreground flex items-center justify-end pr-0.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map(({ date, ymd }) => {
                    const titles = uploadMap.get(ymd) ?? [];
                    const count = titles.length;
                    const isFuture = date > new Date();
                    return (
                      <div
                        key={ymd}
                        className={`w-3 h-3 rounded-sm cursor-default transition-opacity ${
                          isFuture ? "opacity-0 pointer-events-none" : cellColor(count)
                        }`}
                        onMouseEnter={() => setTooltip({ date: ymd, count, titles })}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2 text-xs">
            <span className="font-medium">{tooltip.date}</span>
            {tooltip.count === 0
              ? <span className="text-muted-foreground ml-2">No uploads</span>
              : (
                <span className="ml-2">
                  {tooltip.count} upload{tooltip.count > 1 ? "s" : ""}{" "}
                  <span className="text-muted-foreground">— {tooltip.titles.slice(0, 2).join(", ")}{tooltip.titles.length > 2 ? ` +${tooltip.titles.length - 2} more` : ""}</span>
                </span>
              )
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}
