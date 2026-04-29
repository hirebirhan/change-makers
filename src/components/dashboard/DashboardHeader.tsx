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
        <p className="text-xs text-muted-foreground leading-none">Channel performance overview</p>
      </div>
      <Tabs value={dateRange} onValueChange={(value) => onDateRangeChange(value as DateRange)}>
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
