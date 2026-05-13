import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DateRange } from "./dashboard-metrics";

interface DashboardHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7days", label: "7 Days" },
  { value: "30days", label: "30 Days" },
  { value: "year", label: "Year" },
  { value: "lifetime", label: "Lifetime" },
];

export function DashboardHeader({ dateRange, onDateRangeChange }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Channel performance overview</p>
      </div>

      {/* Dropdown on mobile, tabs on sm+ */}
      <select
        value={dateRange}
        onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
        className="sm:hidden text-xs rounded-md border border-input bg-background px-2.5 py-1.5 text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <Tabs
        value={dateRange}
        onValueChange={(value) => onDateRangeChange(value as DateRange)}
        className="hidden sm:block"
      >
        <TabsList>
          {RANGE_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value} className="text-xs">
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
