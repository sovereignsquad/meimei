/**
 * What Next App
 * 
 * Daily guide with prioritized recommendations
 * Issue: #724
 */

import { inferenceCallOllamaJson } from "../../dashboard/lib/meimei-inference-client.mjs";
import brain from "../../dashboard/lib/brain/index.mjs";
import { getInboxMessages, getUnreadCount, isMailAvailable } from "../../dashboard/lib/mail-adapter.mjs";

const META = {
  id: "what-next",
  name: "What next?",
  description: "Daily guide - prioritized recommendations based on sources and AI",
  category: "apps",
  issueId: "724"
};

async function handleApi(req, body, repoRoot) {
  const sources = Array.isArray(body.sources) ? body.sources : ["tasks", "calendar", "mail"];

  try {
    const context = await brain.buildContext(repoRoot, { includeLog: true, logLimit: 20 });
    const mailAvailable = await isMailAvailable();
    const unreadCount = mailAvailable ? await getUnreadCount() : 0;

    let sourceData = [];
    if (sources.includes("mail") && mailAvailable) {
      try {
        const recentMail = await getInboxMessages({ limit: 5 });
        sourceData.push({ type: "mail", count: unreadCount, recent: recentMail.map(m => m.subject) });
      } catch {
        // Continue without mail data
      }
    }

    const prompt = `You are MeiMei, an AI assistant helping OC prioritize their work.

Context from system:
${context}

Current sources:
${JSON.stringify(sourceData, null, 2)}

Generate 3-5 prioritized recommendations for what OC should do next. Return ONLY a JSON object:
{
  "recommendations": [
    {
      "priority": "high|medium|low",
      "title": "Brief action title",
      "reason": "Why this matters",
      "source": "Which source triggered this"
    }
  ]
}`;

    const result = await inferenceCallOllamaJson(prompt, {
      model: "qwen3.5:0.8b",
      taskType: "generate",
      temperature: 0.3,
      maxTokens: 1024
    });

    const parsed = result.data;
    const recs = parsed.recommendations || parsed.items || [];

    if (!Array.isArray(recs) || recs.length === 0) {
      return { ok: false, error: "Could not parse LLM recommendations" };
    }

    await brain.log(repoRoot, `Generated ${recs.length} recommendations`).catch(() => {});

    return {
      ok: true,
      recommendations: recs,
      sources,
      generatedAt: new Date().toISOString(),
      source: "ollama/qwen3.5:0.8b"
    };
  } catch (error) {
    return { ok: false, error: `AI recommendation failed: ${error.message}` };
  }
}

export { META, handleApi };
