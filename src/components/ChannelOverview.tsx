"use client";

import { ChannelStats } from "@/types/youtube";
import { Users, Eye, PlayCircle, Clock } from "lucide-react";

interface ChannelOverviewProps {
  stats: ChannelStats;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

export default function ChannelOverview({ stats }: ChannelOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
          {stats.channelName.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{stats.channelName}</h2>
          <p className="text-sm text-gray-500">{stats.customUrl}</p>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-md">{stats.channelDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Subscribers"
          value={formatNumber(stats.subscriberCount)}
          color="bg-red-600"
        />
        <StatCard
          icon={Eye}
          label="Total Views"
          value={formatNumber(stats.viewCount)}
          color="bg-blue-600"
        />
        <StatCard
          icon={PlayCircle}
          label="Videos"
          value={stats.videoCount.toString()}
          color="bg-green-600"
        />
        <StatCard
          icon={Clock}
          label="Avg Duration"
          value={stats.avgViewDuration}
          color="bg-purple-600"
        />
      </div>
    </div>
  );
}
