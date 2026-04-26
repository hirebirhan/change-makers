"use client";

import { useState, useEffect } from "react";
import CategoryLeaderboard from "./CategoryLeaderboard";
import { CategoryLeaderboard as CategoryLeaderboardType } from "@/types/nominee";

interface LeaderboardClientProps {
  leaderboards: CategoryLeaderboardType[];
}

export default function LeaderboardClient({ leaderboards }: LeaderboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Check if running in Telegram
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      setIsTelegram(true);
    }

    // Set initial category
    if (leaderboards.length > 0) {
      setSelectedCategory(leaderboards[0].categoryId);
    }
  }, [leaderboards]);

  const selectedLeaderboard = leaderboards.find(
    (lb) => lb.categoryId === selectedCategory
  );

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      {!isTelegram && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src="https://changemakeraward.com/assets/WhatsApp%20Image%202026-04-06%20at%207.31.55%20AM-nWUfYBiO.jpeg"
                alt="Change Maker Awards Logo"
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-bold text-[#0a66c2]">Change Maker Awards</h1>
              <a
                href="https://changemakeraward.com/share/id-mo488udjp-kztnjxev.html?cat=cat_stem_innovation"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto px-4 py-1.5 bg-[#0a66c2] text-white text-sm font-semibold rounded-md hover:bg-[#004182] transition-colors whitespace-nowrap"
              >
                Vote for Birhan N.
              </a>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Dropdown */}
        <div className="mb-6">
          <select
            value={selectedCategory || "all"}
            onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : e.target.value)}
            className="w-full md:w-80 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-[#0a66c2] transition-all"
          >
            <option value="all">All Categories</option>
            {leaderboards.map((leaderboard) => (
              <option key={leaderboard.categoryId} value={leaderboard.categoryId}>
                {leaderboard.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* Leaderboards */}
        {selectedCategory === null ? (
          <div className="space-y-6">
            {leaderboards.map((leaderboard) => (
              <CategoryLeaderboard key={leaderboard.categoryId} leaderboard={leaderboard} />
            ))}
          </div>
        ) : selectedLeaderboard ? (
          <CategoryLeaderboard leaderboard={selectedLeaderboard} />
        ) : null}
      </main>

      {/* Disclaimer */}
      <footer className="max-w-7xl mx-auto px-4 py-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          This leaderboard displays read-only data from the Change Maker Awards API. Vote counts are for informational purposes only.
        </p>
      </footer>
    </div>
  );
}
