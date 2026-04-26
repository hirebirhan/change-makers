"use client";

import { useState, useEffect } from "react";
import CategoryLeaderboard from "@/components/CategoryLeaderboard";
import { fetchNominees, groupNomineesByCategory } from "@/lib/api";
import { CategoryLeaderboard as CategoryLeaderboardType } from "@/types/nominee";

export default function Home() {
  const [leaderboards, setLeaderboards] = useState<CategoryLeaderboardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchNominees();
        const grouped = groupNomineesByCategory(response.data);
        setLeaderboards(grouped);
        if (grouped.length > 0) {
          setSelectedCategory(grouped[0].categoryId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-zinc-600">Loading nominees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  const selectedLeaderboard = leaderboards.find(
    (lb) => lb.categoryId === selectedCategory
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src="https://changemakeraward.com/assets/WhatsApp%20Image%202026-04-06%20at%207.31.55%20AM-nWUfYBiO.jpeg"
            alt="Change Maker Awards Logo"
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-bold text-[#0a66c2]">Change Maker Awards</h1>
        </div>
      </header>

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
