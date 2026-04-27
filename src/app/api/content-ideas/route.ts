import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    console.log("[Content Ideas] Starting generation...");
    const { comments } = await request.json();
    console.log("[Content Ideas] Received comments:", comments?.length);

    if (!comments || comments.length === 0) {
      console.log("[Content Ideas] No comments provided");
      return NextResponse.json({ ideas: [] });
    }

    // Extract comment texts and identify questions/requests
    const commentTexts = comments
      .map((c: any) => c.text)
      .filter((text: string) => text && text.length > 10)
      .slice(0, 100);

    console.log("[Content Ideas] Filtered comment texts:", commentTexts.length);

    if (commentTexts.length === 0) {
      console.log("[Content Ideas] No valid comment texts after filtering");
      return NextResponse.json({ ideas: [] });
    }

    // Try Gemini API if available
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log("[Content Ideas] Calling Gemini API...");
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
        console.log("[Content Ideas] Gemini response:", text.substring(0, 200));

        // Parse the response into individual ideas
        const ideas = text
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .filter((line) => !line.match(/^(Here|Based|Analysis|Video|Content|Ideas?:|Topics?:)/i))
          .map((line) => line.replace(/^[\d\.\-\*\•]\s*/, "").trim())
          .filter((line) => line.length > 20 && line.length < 200)
          .slice(0, 8);

        console.log("[Content Ideas] Parsed ideas:", ideas.length);
        if (ideas.length > 0) {
          return NextResponse.json({ ideas });
        }
      } catch (error: any) {
        console.error("[Content Ideas] Gemini error:", error?.message);
        // Fall through to keyword-based approach
      }
    }

    // Fallback: Keyword-based content idea generation
    console.log("[Content Ideas] Using keyword-based generation...");
    const ideas = generateKeywordBasedIdeas(commentTexts);
    console.log("[Content Ideas] Generated ideas:", ideas.length);
    return NextResponse.json({ ideas });
  } catch (error: any) {
    console.error("[Content Ideas] Error:", error?.message || error);
    return NextResponse.json({ ideas: [] });
  }
}

function generateKeywordBasedIdeas(commentTexts: string[]): string[] {
  const ideas: string[] = [];
  const allText = commentTexts.join(" ");
  
  console.log("[Content Ideas] Sample comments:", commentTexts.slice(0, 3));

  // Extract questions with better context
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
      const matches = [...comment.matchAll(pattern)];
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
            console.log("[Content Ideas] Found:", idea);
          }
        }
      }
    }
  }

  // Extract frequently mentioned technical terms/topics
  const stopWords = new Set(["this", "that", "with", "from", "have", "been", "were", "their", "would", "there", "could", "about", "which", "these", "those", "very", "more", "some", "just", "like", "good", "great", "nice", "thanks", "thank", "please", "video", "videos", "channel", "comment", "comments"]);
  
  const words = allText.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopWords.has(w));
  
  const wordCount = new Map<string, number>();
  words.forEach(w => wordCount.set(w, (wordCount.get(w) || 0) + 1));
  
  const topWords = [...wordCount.entries()]
    .filter(([word, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  console.log("[Content Ideas] Top words:", topWords);

  if (topWords.length >= 2 && ideas.length < 6) {
    ideas.push(`Deep dive: ${topWords[0]} and ${topWords[1]}`);
  }
  if (topWords.length >= 1 && ideas.length < 6) {
    ideas.push(`Complete guide to ${topWords[0]}`);
  }
  if (topWords.length >= 3 && ideas.length < 6) {
    ideas.push(`${topWords[2]} explained for beginners`);
  }

  // Only add generic ideas if we found absolutely nothing
  if (ideas.length === 0) {
    ideas.push("Q&A: Answering your most asked questions");
    ideas.push("Behind the scenes: How I create content");
    ideas.push("Tips and tricks based on viewer feedback");
  }

  console.log("[Content Ideas] Total ideas generated:", ideas.length);
  return ideas.slice(0, 8);
}
