"use client";

import { useState } from "react";
import { ThumbsUp, MessageCircle, Sparkles, Copy, Check, RefreshCw, Send } from "lucide-react";
import type { Comment } from "@/types/youtube";
import { CommentAvatar } from "./CommentAvatar";
import { SentimentBadge } from "./SentimentBadge";
import { Button } from "@/components/ui/button";

interface CommentCardProps {
  comment: Comment & { videoTitle?: string };
  showVideoTitle?: boolean;
  avatarSize?: number;
  isOAuthConnected?: boolean;
}

function timeAgo(dateString: string) {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function CommentCard({ comment, showVideoTitle = false, avatarSize = 32, isOAuthConnected = false }: CommentCardProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<"idle" | "success" | "error">("idle");

  async function draftReply() {
    setLoading(true);
    setDraft(null);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "comment-reply",
          commentText: comment.text,
          videoTitle: comment.videoTitle ?? "",
        }),
      });
      const json = await res.json();
      setDraft(json.result ?? null);
    } catch {
      setDraft("Failed to generate reply. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function postReply() {
    if (!draft) return;
    setPosting(true);
    setPostStatus("idle");
    try {
      const res = await fetch("/api/comments/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: comment.id, text: draft }),
      });
      setPostStatus(res.ok ? "success" : "error");
    } catch {
      setPostStatus("error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card hover:bg-muted/30 p-3 transition-colors">
      <div className="flex gap-3">
        <CommentAvatar src={comment.authorProfileImageUrl} alt={comment.author} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className="text-xs font-semibold">{comment.author}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.publishedAt)}</span>
            <SentimentBadge sentiment={comment.sentiment} />
          </div>
          <p className="text-xs text-foreground leading-relaxed mb-2">{comment.text}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />{comment.likeCount.toLocaleString()}
            </span>
            {comment.replyCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />{comment.replyCount}
              </span>
            )}
            {showVideoTitle && comment.videoTitle && (
              <span className="truncate max-w-xs text-muted-foreground/60 italic text-xs">
                {comment.videoTitle}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
              onClick={draftReply}
              disabled={loading}
            >
              {loading
                ? <><RefreshCw className="size-3 animate-spin" />Drafting…</>
                : <><Sparkles className="size-3" />Draft Reply</>
              }
            </Button>
          </div>

          {/* Draft reply output */}
          {draft && (
            <div className="mt-2.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-primary uppercase tracking-wide">AI Draft</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] gap-1" onClick={copy}>
                    {copied ? <><Check className="size-3 text-green-500" />Copied</> : <><Copy className="size-3" />Copy</>}
                  </Button>
                  {isOAuthConnected && postStatus !== "success" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] gap-1 text-primary"
                      onClick={postReply}
                      disabled={posting}
                    >
                      {posting
                        ? <><RefreshCw className="size-3 animate-spin" />Posting…</>
                        : <><Send className="size-3" />Post Reply</>
                      }
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{draft}</p>
              {postStatus === "success" && (
                <p className="text-[10px] text-green-500 flex items-center gap-1">
                  <Check className="size-3" />Reply posted to YouTube
                </p>
              )}
              {postStatus === "error" && (
                <p className="text-[10px] text-destructive">Failed to post — try again</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
