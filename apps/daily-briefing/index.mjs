/**
 * Daily Briefing App
 *
 * AI-powered daily business briefing
 */

import path from "node:path";
import { inferenceCallOllamaJson } from "../../dashboard/lib/meimei-inference-client.mjs";
import brain from "../../dashboard/lib/brain/index.mjs";
import { getInboxMessages, getUnreadCount, isMailAvailable } from "../../dashboard/lib/mail-adapter.mjs";
import { createRuntimeHelpers } from "../../dashboard/lib/runtime.mjs";

const META = {
  id: "daily-briefing",
  name: "Daily Briefing",
  description: "AI-powered daily business briefing",
  category: "apps"
};

async function handleApi(req, body, repoRoot) {
  const sink = String(body.sink || "apple-notes").trim() === "markdown" ? "markdown" : "apple-notes";

  try {
    const context = await brain.buildContext(repoRoot, { includeLog: true, logLimit: 30 });
    const mailAvailable = await isMailAvailable();
    const unreadCount = mailAvailable ? await getUnreadCount() : 0;

    let recentEmails = [];
    if (mailAvailable) {
      try {
        const messages = await getInboxMessages({ limit: 5 });
        recentEmails = messages.map(m => ({ from: m.from, subject: m.subject }));
      } catch {
        // Continue without email data
      }
    }

    const prompt = `You are MeiMei, creating a daily briefing for OC.

Context:
${context}

Current Status:
- Unread emails: ${unreadCount}
- Recent emails: ${JSON.stringify(recentEmails)}

Generate a concise daily briefing. Return ONLY JSON:
{
  "headline": "One-line summary of the day",
  "sections": [
    {
      "title": "Section name",
      "items": ["bullet point 1", "bullet point 2"]
    }
  ],
  "priorities": ["top priority 1", "top priority 2"],
  "insights": "Brief strategic insight"
}`;

    const result = await inferenceCallOllamaJson(prompt, {
      model: "gemma3:1b",
      taskType: "generate",
      temperature: 0.4,
      maxTokens: 2048
    });

    const parsed = result.data;

    if (!parsed || !parsed.headline) {
      return { ok: false, error: "Could not generate briefing structure" };
    }

    // Format as markdown
    let markdown = `# Daily Briefing: ${parsed.headline}\n\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (parsed.sections) {
      for (const section of parsed.sections) {
        markdown += `## ${section.title}\n\n`;
        for (const item of section.items || []) {
          markdown += `- ${item}\n`;
        }
        markdown += "\n";
      }
    }

    if (parsed.priorities?.length) {
      markdown += "## Today's Priorities\n\n";
      for (const p of parsed.priorities) {
        markdown += `- **${p}**\n`;
      }
      markdown += "\n";
    }

    if (parsed.insights) {
      markdown += `## Insight\n\n${parsed.insights}\n`;
    }

    // Write to file if markdown sink
    let markdownPath = null;
    if (sink === "markdown") {
      const { writeFile } = await import("node:fs/promises");
      const path = await import("node:path");
      markdownPath = path.join(repoRoot, "briefing.md");
      await writeFile(markdownPath, markdown, "utf-8");
    }

    await brain.log(repoRoot, `Generated daily briefing: ${parsed.headline}`).catch(() => {});

    return {
      ok: true,
      headline: parsed.headline,
      sections: parsed.sections || [],
      priorities: parsed.priorities || [],
      insights: parsed.insights || "",
      markdown,
      markdownPath: sink === "markdown" ? markdownPath : null,
      sink,
      generatedAt: new Date().toISOString(),
      source: "ollama/gemma3:1b"
    };
  } catch (error) {
    return { ok: false, error: `Daily briefing generation failed: ${error.message}` };
  }
}

/** POST …/daily-briefing/open — open Notes or a markdown file (was inline in server.mjs). */
async function handleOpenPost(req, body, repoRoot) {
  const { runScript } = createRuntimeHelpers(repoRoot);
  const target = String(body.target || "").trim();
  if (target === "notes") {
    const opened = await runScript("open", ["-a", "Notes"], { timeoutMs: 8000 });
    if (opened.code !== 0) {
      return { ok: false, error: opened.stderr || "Could not open Notes." };
    }
    return { ok: true, target: "notes" };
  }
  if (target === "markdown") {
    const markdownPath = String(body.markdownPath || "").trim();
    if (!markdownPath || !path.isAbsolute(markdownPath)) {
      return { ok: false, error: "Missing or invalid markdownPath." };
    }
    const opened = await runScript("open", [markdownPath], { timeoutMs: 8000 });
    if (opened.code !== 0) {
      return { ok: false, error: opened.stderr || "Could not open markdown file." };
    }
    return { ok: true, target: "markdown", markdownPath };
  }
  return { ok: false, error: "Unknown open target." };
}

export { META, handleApi, handleOpenPost };
