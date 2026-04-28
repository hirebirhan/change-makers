import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import type { Comment } from "@/types/youtube";

interface CommentFiltersProps {
  query: string;
  sentiment: "all" | Comment["sentiment"];
  onQueryChange: (query: string) => void;
  onSentimentChange: (sentiment: "all" | Comment["sentiment"]) => void;
}

export function CommentFilters({ query, sentiment, onQueryChange, onSentimentChange }: CommentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input 
          placeholder="Search comments or authors…" 
          value={query} 
          onChange={(e) => onQueryChange(e.target.value)} 
          className="pl-9 h-9 w-full sm:w-72 text-xs" 
        />
      </div>
      <Tabs value={sentiment} onValueChange={(v) => onSentimentChange(v as typeof sentiment)} className="w-full sm:w-auto">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="positive" className="text-xs">Positive</TabsTrigger>
          <TabsTrigger value="neutral" className="text-xs">Neutral</TabsTrigger>
          <TabsTrigger value="negative" className="text-xs">Negative</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
