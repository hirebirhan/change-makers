export interface Category {
  id: string;
  name: string;
  patternColor: string | null;
}

export interface Nominee {
  id: string;
  fullName: string;
  organization: string | null;
  linkedInProfileUrl: string | null;
  shortBiography: string;
  status: string;
  profileImageUrl: string | null;
  categoryIds: string[];
  categories: Category[];
  categoryVoteCounts: Record<string, number>;
}

export interface ApiResponse {
  success: boolean;
  data: Nominee[];
  cached: boolean;
}

export interface CategoryLeaderboard {
  categoryId: string;
  categoryName: string;
  totalVotes: number;
  nominees: {
    nominee: Nominee;
    votes: number;
    rank: number;
    percentage: number;
  }[];
}
