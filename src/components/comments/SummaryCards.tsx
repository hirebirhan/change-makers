import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle, SmilePlus, Meh, Frown } from "lucide-react";

interface CommentSummary {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positiveRate: number;
}

interface SummaryCardsProps {
  summary: CommentSummary;
}

const summaryItems = [
  { 
    key: "total" as const,
    label: "Total", 
    icon: MessageCircle, 
    bg: "bg-muted", 
    iconCn: "text-muted-foreground", 
    valueCn: "text-foreground" 
  },
  { 
    key: "positive" as const,
    label: "Positive", 
    icon: SmilePlus, 
    bg: "bg-chart-1/10", 
    iconCn: "text-chart-1", 
    valueCn: "text-chart-1" 
  },
  { 
    key: "neutral" as const,
    label: "Neutral", 
    icon: Meh, 
    bg: "bg-muted", 
    iconCn: "text-muted-foreground", 
    valueCn: "text-muted-foreground" 
  },
  { 
    key: "negative" as const,
    label: "Negative", 
    icon: Frown, 
    bg: "bg-destructive/10", 
    iconCn: "text-destructive", 
    valueCn: "text-destructive" 
  },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {summaryItems.map(({ key, label, icon: Icon, bg, iconCn, valueCn }) => {
        const value = summary[key];
        const percent = key !== "total" ? Math.round((value / summary.total) * 100) : null;
        
        return (
          <Card key={label} size="sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`size-3.5 ${iconCn}`} />
                </div>
                <CardDescription className="text-xs">{label}</CardDescription>
              </div>
              <CardTitle className={`text-xl tabular-nums ${valueCn}`}>
                {value.toLocaleString()} {percent !== null && <span className="text-xs font-normal text-muted-foreground">({percent}%)</span>}
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
