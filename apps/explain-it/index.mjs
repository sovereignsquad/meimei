/**
 * Explain It App
 * 
 * URL summarization and structured explanation
 * Issue: #516
 */

import { inferenceCallOllamaJson } from "../../dashboard/lib/meimei-inference-client.mjs";
import brain from "../../dashboard/lib/brain/index.mjs";

const META = {
  id: "explain-it",
  name: "Explain it",
  description: "URL summarization and structured explanation",
  category: "apps",
  issueId: "516"
};

async function handleApi(req, body, repoRoot) {
  const url = String(body.url || "");

  if (!url) {
    return { ok: false, error: "Missing required field: url" };
  }

  try {
    // Build context for tone
    const context = await brain.buildContext(repoRoot, {
      layers: ["identity", "user", "context", "durable"],
      logLimit: 0,
      maxTokens: 6000
    });

    // Fetch URL content
    const fetchResult = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": "agent.meimei/516-url-summarizer" }
    });

    if (!fetchResult.ok) {
      return { ok: false, error: `Could not fetch URL: HTTP ${fetchResult.status}` };
    }

    const contentType = String(fetchResult.headers.get("content-type") || "").toLowerCase();
    let text = "";

    if (contentType.includes("application/pdf")) {
      return { ok: false, error: "PDF summarization not supported in this version" };
    }

    const html = await fetchResult.text();
    // Extract text from HTML (simplified)
    text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 12000);

    if (!text.trim()) {
      return { ok: false, error: "No readable content found on page" };
    }

    // Summarize with LLM
    const prompt = `You are MeiMei, a sharp and dependable AI assistant.
${context ? `\nOperator context:\n${context}` : ""}

Analyze this URL content and return a structured JSON response.

URL: ${url}

Content (first 12000 chars):
${text}

Return ONLY JSON:
{
  "summary": "2-3 sentence summary",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "sentiment": "positive|negative|neutral",
  "category": "news|technical|business|other",
  "audience": "Who should read this",
  "actionItems": ["What OC might do after reading"]
}`;

    const result = await inferenceCallOllamaJson(prompt, {
      model: "llama3:latest",
      taskType: "summarize",
      temperature: 0.3,
      maxTokens: 1024
    });

    await brain.log(repoRoot, `Summarized URL: ${url}`).catch(() => {});

    return {
      ok: true,
      source: { url, type: contentType },
      result: result.data,
      provider: "meimei-inference-route"
    };
  } catch (error) {
    return { ok: false, error: `URL summarization failed: ${error.message}` };
  }
}

export { META, handleApi };
