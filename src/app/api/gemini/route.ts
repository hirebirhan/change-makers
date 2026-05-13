import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

type Mode = "analyze" | "topics" | "description" | "title" | "script" | "comment-reply";

const MODEL_PRIORITY = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-flash',
  'gemini-pro'
];

let workingModel: string | null = null;

function buildPrompt(mode: Mode, payload: Record<string, unknown>): string {
  const { channel, videos, trends, keyword, existingTitle, existingDescription, keyPoints, format, commentText, videoTitle } = payload as {
    channel: { channelName: string; channelDescription: string; subscriberCount: number; viewCount: number; videoCount: number };
    videos: { title: string; viewCount: number; likeCount: number; commentCount: number; tags: string[]; description: string }[];
    trends: string[];
    keyword: string;
    existingTitle: string;
    existingDescription: string;
    keyPoints: string[];
    format: string;
    commentText: string;
    videoTitle: string;
  };

  if (mode === "analyze") {
    const topVideos = videos.slice(0, 5).map((v) => `- "${v.title}" (${v.viewCount.toLocaleString()} views, ${v.likeCount} likes)`).join("\n");
    const allTags = [...new Set(videos.flatMap((v) => v.tags))].slice(0, 20).join(", ");
    return `You are a YouTube growth strategist. Analyze this channel and provide actionable insights.

Channel: ${channel.channelName}
Description: ${channel.channelDescription}
Subscribers: ${channel.subscriberCount.toLocaleString()}
Total Views: ${channel.viewCount.toLocaleString()}
Videos: ${channel.videoCount}

Top performing videos:
${topVideos}

Common tags: ${allTags}

Provide a structured analysis with:
1. Channel strengths (2-3 points)
2. Content gaps and opportunities (2-3 points)  
3. Audience insights based on the data (2-3 points)
4. Growth recommendations (3-4 actionable steps)
5. Content pillars to focus on (3 pillars)

Be specific, data-driven, and concise. Format with clear headings.`;
  }

  if (mode === "topics") {
    const topTitles = videos.slice(0, 10).map((v) => `"${v.title}" (${v.viewCount.toLocaleString()} views)`).join("\n");
    const trendList = trends.slice(0, 10).join(", ");
    return `You are a YouTube content strategist. Suggest next video topics for this channel.

Channel: ${channel.channelName}
Niche/Description: ${channel.channelDescription}

Best performing videos:
${topTitles}

Current trending topics: ${trendList}

Generate 8 specific video topic ideas that:
- Align with the channel's existing successful content
- Tap into current trends where relevant
- Have strong search potential
- Would appeal to the existing audience

For each topic provide:
- Title (compelling, SEO-optimized, 50-65 chars)
- Hook (one sentence why viewers will click)
- Key points to cover (3 bullet points)
- Estimated audience (who this targets)

Format clearly with numbered topics.`;
  }

  if (mode === "description") {
    return `You are a YouTube SEO expert. Write an optimized video description.

Video title: ${existingTitle}
Channel: ${channel.channelName}
Channel niche: ${channel.channelDescription}

Write a YouTube video description that:
- Opens with a compelling 2-sentence hook (most important for SEO)
- Includes a brief overview of what viewers will learn (3-4 sentences)
- Has a timestamps section placeholder (e.g. 00:00 Intro)
- Includes 3-5 relevant hashtags at the end
- Is between 200-400 words
- Naturally incorporates the main keyword from the title

Return only the description text, ready to copy-paste.`;
  }

  if (mode === "title") {
    return `You are a YouTube title optimization expert.

Original title: "${existingTitle}"
Channel: ${channel.channelName}
Channel niche: ${channel.channelDescription}
${keyword ? `Target keyword: ${keyword}` : ""}
${existingDescription ? `Video context: ${existingDescription.slice(0, 300)}` : ""}

Generate 6 optimized title variations that:
- Are 50-65 characters long
- Include the target keyword naturally
- Use proven high-CTR patterns (numbers, questions, "how to", power words)
- Are accurate and not clickbait
- Vary in style (question, list, how-to, statement, curiosity gap)

For each title, add a one-line note on why it works.
Format: "Title" — reason`;
  }

  if (mode === "script") {
    const points = (keyPoints ?? []).filter(Boolean).map((p, i) => `${i + 1}. ${p}`).join("\n");
    return `You are a YouTube script writer for educational/tech content.

Channel: ${channel?.channelName ?? ""}
Niche: ${channel?.channelDescription ?? ""}
Video title: "${existingTitle}"
Format: ${format ?? "educational"}
Key points to cover:
${points}

Write a complete, ready-to-record YouTube video script with these sections:

**HOOK (0:00–0:30)**
An attention-grabbing opening that speaks directly to the viewer's pain point or curiosity. Do NOT start with "Hey guys" or generic intros.

**INTRO (0:30–1:30)**
Briefly introduce yourself, what this video covers, and why the viewer should keep watching.

**MAIN CONTENT**
One section per key point above. Each section should have:
- A clear heading with approximate timestamp
- 3–5 natural-sounding talking points (written as spoken sentences, not bullet fragments)
- A smooth transition to the next section

**OUTRO & CTA (last 60 seconds)**
Summarise the key takeaways, ask a specific question in the comments, plug subscribe, and tease the next video.

Write in a conversational, first-person tone. Use plain spoken English — contractions, short sentences. Do not use filler phrases like "In this video we will…". Mark on-screen text suggestions with [ON SCREEN: …].`;
  }

  if (mode === "comment-reply") {
    return `You are a friendly, professional YouTube creator replying to a comment on your channel.

Channel: ${channel?.channelName ?? ""}
Video: "${videoTitle ?? ""}"
Comment: "${commentText}"

Write a single, genuine reply (2–4 sentences max) that:
- Directly addresses what the commenter said
- Is warm and personal, not corporate
- Adds a small piece of extra value where possible
- Ends with an engaging follow-up question if natural

Return only the reply text, no labels or quotes.`;
  }

  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, ...payload } = body as { mode: Mode } & Record<string, unknown>;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured in .env.local" }, { status: 400 });
    }

    const prompt = buildPrompt(mode, payload);
    const modelsToTry = workingModel ? [workingModel, ...MODEL_PRIORITY] : MODEL_PRIORITY;
    
    let lastError: Error | null = null;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        workingModel = modelName;
        return NextResponse.json({ result: text, mode, modelUsed: modelName });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    return NextResponse.json(
      { error: `All models failed. Last error: ${lastError?.message}` },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gemini request failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ model: workingModel || MODEL_PRIORITY[0] });
}
