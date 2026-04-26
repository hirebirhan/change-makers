import LeaderboardClient from "@/components/LeaderboardClient";
import { groupNomineesByCategory } from "@/lib/api";
import { Nominee } from "@/types/nominee";

export default async function Home() {
  const response = await fetch("https://api.changemakeraward.com/api/public/nominees");
  
  if (!response.ok) {
    throw new Error(`Failed to fetch nominees: ${response.statusText}`);
  }
  
  const data = await response.json();
  const leaderboards = groupNomineesByCategory(data.data);

  return <LeaderboardClient leaderboards={leaderboards} />;
}
