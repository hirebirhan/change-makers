import { ApiResponse, CategoryLeaderboard, Nominee } from "@/types/nominee";

const API_URL = "/api/nominees";

export async function fetchNominees(): Promise<ApiResponse> {
  const response = await fetch(API_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch nominees: ${response.statusText}`);
  }
  
  return response.json();
}

export function groupNomineesByCategory(nominees: Nominee[]): CategoryLeaderboard[] {
  const categoryMap = new Map<string, CategoryLeaderboard>();
  
  nominees.forEach((nominee) => {
    nominee.categories.forEach((category) => {
      const votes = nominee.categoryVoteCounts?.[category.id] || 0;
      
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          categoryId: category.id,
          categoryName: category.name,
          totalVotes: 0,
          nominees: [],
        });
      }
      
      const leaderboard = categoryMap.get(category.id)!;
      leaderboard.nominees.push({
        nominee,
        votes,
        rank: 0,
        percentage: 0,
      });
    });
  });
  
  // Sort nominees by votes within each category and assign ranks
  const leaderboards = Array.from(categoryMap.values());
  leaderboards.forEach((leaderboard) => {
    leaderboard.nominees.sort((a, b) => b.votes - a.votes);
    
    // Calculate total votes in category
    const totalVotes = leaderboard.nominees.reduce((sum, entry) => sum + entry.votes, 0);
    leaderboard.totalVotes = totalVotes;
    
    leaderboard.nominees.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.percentage = totalVotes > 0 ? (entry.votes / totalVotes) * 100 : 0;
    });
  });
  
  // Sort categories by name
  leaderboards.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  
  return leaderboards;
}
