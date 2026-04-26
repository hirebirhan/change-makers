import NomineeCard from "./NomineeCard";
import { CategoryLeaderboard as CategoryLeaderboardType } from "@/types/nominee";

interface CategoryLeaderboardProps {
  leaderboard: CategoryLeaderboardType;
}

export default function CategoryLeaderboard({ leaderboard }: CategoryLeaderboardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-[#0a66c2] text-white px-4 py-3">
        <h2 className="text-lg font-semibold">{leaderboard.categoryName}</h2>
        <div className="flex items-center gap-3 mt-1 text-sm text-blue-100">
          <span>{leaderboard.nominees.length} nominees</span>
          <span>•</span>
          <span>{leaderboard.totalVotes.toLocaleString()} votes</span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {leaderboard.nominees.map((entry) => (
          <NomineeCard
            key={entry.nominee.id}
            nominee={entry.nominee}
            votes={entry.votes}
            rank={entry.rank}
            percentage={entry.percentage}
          />
        ))}
      </div>
    </div>
  );
}
