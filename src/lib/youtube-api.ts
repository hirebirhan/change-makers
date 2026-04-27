import { YouTubeApiResponse } from "@/types/youtube";

const API_URL = "/api/youtube";

export async function fetchYouTubeAnalytics(): Promise<YouTubeApiResponse> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube analytics: ${response.statusText}`);
  }

  return response.json();
}
