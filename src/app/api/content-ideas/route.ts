import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface CommentInput {
  text?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { comments?: unknown };
    const comments = Array.isArray(body.comments) ? body.comments as CommentInput[] : [];

    if (!comments || comments.length === 0) {
      return NextResponse.json({ ideas: [] });
    }

    const commentTexts = comments
      .map((comment) => comment.text)
      .filter((text): text is string => typeof text === "string" && text.length > 10)
      .slice(0, 100);

    if (commentTexts.length === 0) {
      return NextResponse.json({ ideas: [] });
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `Analyze these YouTube comments and suggest 5-8 video content ideas based on:
- Questions viewers are asking
- Topics viewers want to learn about
- Problems viewers are facing
- Requests for specific content

Comments:
${commentTexts.join("\n---\n")}

Provide 5-8 specific, actionable video ideas that would address viewer needs. Format each idea as a clear, concise video title or topic (one line each). Focus on the most requested or discussed topics.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const ideas = text
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .filter((line) => !line.match(/^(Here|Based|Analysis|Video|Content|Ideas?:|Topics?:)/i))
          .map((line) => line.replace(/^[\d\.\-\*\•]\s*/, "").trim())
          .filter((line) => line.length > 20 && line.length < 200)
          .slice(0, 8);

        if (ideas.length > 0) {
          return NextResponse.json({ ideas });
        }
      } catch {
        // Fall back to local keyword extraction when Gemini is unavailable.
      }
    }

    const ideas = generateKeywordBasedIdeas(commentTexts);
    return NextResponse.json({ ideas });
  } catch {
    return NextResponse.json({ ideas: [] });
  }
}

function generateKeywordBasedIdeas(commentTexts: string[]): string[] {
  const ideas: string[] = [];
  const allText = commentTexts.join(" ");

  const questionPatterns = [
    { regex: /how (do|to|can|does|did|should|would) (i |you |we |they )?([^?.!]+)/gi, template: "How to" },
    { regex: /what (is|are|does|do|was|were) ([^?.!]+)/gi, template: "Understanding" },
    { regex: /why (is|are|does|do|did|should) ([^?.!]+)/gi, template: "Why" },
    { regex: /can you (make|do|show|explain|teach|create) (a |an )?([^?.!]+)/gi, template: "Tutorial:" },
    { regex: /tutorial (on|for|about|of) ([^?.!]+)/gi, template: "Complete Tutorial:" },
    { regex: /please (make|do|show|create|explain) (a |an )?([^?.!]+)/gi, template: "How to" },
    { regex: /could you (make|do|show|explain|teach) ([^?.!]+)/gi, template: "Guide:" },
    { regex: /would love to see ([^?.!]+)/gi, template: "Video idea:" },
    { regex: /want to (learn|know|see|understand) (about |how )?([^?.!]+)/gi, template: "Learning" },
  ];

  const foundIdeas = new Set<string>();

  for (const comment of commentTexts) {
    for (const pattern of questionPatterns) {
      const matches = [...comment.matchAll(pattern.regex)]; // ✅ Correct
      for (const match of matches) {
        const topic = match[match.length - 1]
          .trim()
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .replace(/\s+/g, " ")
          .toLowerCase();
        
        if (topic.length > 5 && topic.length < 80 && !topic.includes("video") && !topic.includes("comment")) {
          const idea = `${pattern.template} ${topic}`;
          if (!foundIdeas.has(idea.toLowerCase())) {
            foundIdeas.add(idea.toLowerCase());
            ideas.push(idea.charAt(0).toUpperCase() + idea.slice(1));
          }
        }
      }
    }
  }

  const stopWords = new Set(["this", "that", "with", "from", "have", "been", "were", "their", "would", "there", "could", "about", "which", "these", "those", "very", "more", "some", "just", "like", "good", "great", "nice", "thanks", "thank", "please", "video", "videos", "channel", "comment", "comments"]);
  
  const words = allText.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopWords.has(w));
  
  const wordCount = new Map<string, number>();
  words.forEach(w => wordCount.set(w, (wordCount.get(w) || 0) + 1));
  
  const topWords = [...wordCount.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  if (topWords.length >= 2 && ideas.length < 6) {
    ideas.push(`Deep dive: ${topWords[0]} and ${topWords[1]}`);
  }
  if (topWords.length >= 1 && ideas.length < 6) {
    ideas.push(`Complete guide to ${topWords[0]}`);
  }
  if (topWords.length >= 3 && ideas.length < 6) {
    ideas.push(`${topWords[2]} explained for beginners`);
  }

  if (ideas.length === 0) {
    ideas.push("Q&A: Answering your most asked questions");
    ideas.push("Behind the scenes: How I create content");
    ideas.push("Tips and tricks based on viewer feedback");
  }

  return ideas.slice(0, 8);
}
