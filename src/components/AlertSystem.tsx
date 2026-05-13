"use client";

import { useState, useEffect } from "react";
import { Bell, X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ChannelStats } from "@/types/youtube";

const ALERTS_KEY = "channel-alerts-v1";
const FIRED_KEY  = "channel-alerts-fired-v1";

type MetricKey = "subscriberCount" | "viewCount" | "videoCount";

interface AlertRule {
  id: string;
  metric: MetricKey;
  threshold: number;
  label: string;
}

interface FiredRecord {
  [id: string]: number; // threshold value at which it last fired
}

const METRIC_OPTIONS: { value: MetricKey; label: string }[] = [
  { value: "subscriberCount", label: "Subscribers" },
  { value: "viewCount",       label: "Total Views"  },
  { value: "videoCount",      label: "Videos"       },
];

function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(() => {
    try { return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? "[]"); } catch { return []; }
  });
  function save(next: AlertRule[]) {
    setRules(next);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
  }
  function add(rule: Omit<AlertRule, "id">) {
    save([...rules, { ...rule, id: Math.random().toString(36).slice(2) }]);
  }
  function remove(id: string) { save(rules.filter((r) => r.id !== id)); }
  return { rules, add, remove };
}

// ── Inline alert banner (shown in the page) ──────────────────────────────────

interface AlertBannerProps { stats: ChannelStats }

export function AlertBanner({ stats }: AlertBannerProps) {
  const { rules } = useAlertRules();
  const [triggered, setTriggered] = useState<AlertRule[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const fired: FiredRecord = (() => {
      try { return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}"); } catch { return {}; }
    })();

    const newly = rules.filter((r) => {
      const current = stats[r.metric] ?? 0;
      if (current < r.threshold) return false;          // not yet reached
      if (fired[r.id] >= r.threshold) return false;     // already notified for this threshold
      return true;
    });

    if (newly.length) {
      // Record all newly triggered so we don't fire again
      const next = { ...fired };
      newly.forEach((r) => { next[r.id] = r.threshold; });
      localStorage.setItem(FIRED_KEY, JSON.stringify(next));
      setTriggered(newly);
    }
  }, [rules, stats]);

  const visible = triggered.filter((r) => !dismissed.includes(r.id));
  if (!visible.length) return null;

  return (
    <div className="space-y-2 px-4 md:px-6 pt-4">
      {visible.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm"
        >
          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
          <span className="flex-1">
            <span className="font-medium">{r.label}</span>
            <span className="text-muted-foreground ml-1">
              — {METRIC_OPTIONS.find((m) => m.value === r.metric)?.label} reached {r.threshold.toLocaleString()}
            </span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => setDismissed((d) => [...d, r.id])}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ── Alert settings panel (embedded in a page or modal) ───────────────────────

export function AlertSettings() {
  const { rules, add, remove } = useAlertRules();
  const [metric, setMetric] = useState<MetricKey>("subscriberCount");
  const [threshold, setThreshold] = useState("");
  const [label, setLabel] = useState("");

  function handleAdd() {
    const t = parseInt(threshold.replace(/,/g, ""), 10);
    if (!t || !label.trim()) return;
    add({ metric, threshold: t, label: label.trim() });
    setThreshold("");
    setLabel("");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <div>
            <CardTitle className="text-base">Alerts</CardTitle>
            <CardDescription className="text-xs">Get notified when your channel hits a milestone</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing rules */}
        {rules.length > 0 && (
          <div className="space-y-1.5">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs">
                <span className="font-medium">{r.label}</span>
                <span className="text-muted-foreground mx-2">
                  {METRIC_OPTIONS.find((m) => m.value === r.metric)?.label} ≥ {r.threshold.toLocaleString()}
                </span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => remove(r.id)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new rule */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
              className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {METRIC_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">When ≥</label>
            <Input placeholder="e.g. 1000" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="h-8 text-xs w-28" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Alert label</label>
            <Input placeholder="e.g. Hit 1K subs!" value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-xs" />
          </div>
          <Button size="sm" className="h-8 gap-1.5" onClick={handleAdd} disabled={!threshold || !label.trim()}>
            <Plus className="size-3.5" />Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
