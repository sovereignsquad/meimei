/**
 * Checklist App
 * 
 * Competitor monitoring and decision-support tool
 * Migrated from Original Checklist standalone app
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseJsonResponse } from "../../dashboard/lib/llm.mjs";
import { inferenceCallOllamaJson } from "../../dashboard/lib/meimei-inference-client.mjs";
import brain from "../../dashboard/lib/brain/index.mjs";

const META = {
  id: "checklist",
  name: "Checklist",
  description: "Competitor monitoring and decision-support tool with AI recommendations",
  category: "apps"
};

// ─── Data helpers ──────────────────────────────────────────

async function getCompetitorsFilePath(repoRoot) {
  return path.join(repoRoot, "apps", "checklist", "data", "competitors.json");
}

async function loadCompetitors(repoRoot) {
  try {
    const filePath = await getCompetitorsFilePath(repoRoot);
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveCompetitors(repoRoot, competitors) {
  const filePath = await getCompetitorsFilePath(repoRoot);
  await writeFile(filePath, JSON.stringify(competitors, null, 2), "utf-8");
  return { ok: true, count: competitors.length };
}

async function getSnapshotsFilePath(repoRoot) {
  return path.join(repoRoot, "apps", "checklist", "data", "snapshots.json");
}

async function loadSnapshots(repoRoot) {
  try {
    const filePath = await getSnapshotsFilePath(repoRoot);
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveSnapshots(repoRoot, snapshots) {
  const filePath = await getSnapshotsFilePath(repoRoot);
  await writeFile(filePath, JSON.stringify(snapshots, null, 2), "utf-8");
  return { ok: true, count: snapshots.length };
}

async function getInsightsFilePath(repoRoot) {
  return path.join(repoRoot, "apps", "checklist", "data", "insights.json");
}

async function loadInsights(repoRoot) {
  try {
    const filePath = await getInsightsFilePath(repoRoot);
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveInsights(repoRoot, insights) {
  const filePath = await getInsightsFilePath(repoRoot);
  await writeFile(filePath, JSON.stringify(insights, null, 2), "utf-8");
  return { ok: true, count: insights.length };
}

async function getChecklistFilePath(repoRoot) {
  return path.join(repoRoot, "apps", "checklist", "data", "checklist.json");
}

async function loadChecklist(repoRoot) {
  try {
    const filePath = await getChecklistFilePath(repoRoot);
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return { active: [], archive: [] };
  }
}

async function saveChecklist(repoRoot, checklist) {
  const filePath = await getChecklistFilePath(repoRoot);
  await writeFile(filePath, JSON.stringify(checklist, null, 2), "utf-8");
  return { ok: true };
}

async function getAnnotationsFilePath(repoRoot) {
  return path.join(repoRoot, "apps", "checklist", "data", "annotations.json");
}

async function loadAnnotations(repoRoot) {
  try {
    const filePath = await getAnnotationsFilePath(repoRoot);
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveAnnotations(repoRoot, annotations) {
  const filePath = await getAnnotationsFilePath(repoRoot);
  await writeFile(filePath, JSON.stringify(annotations, null, 2), "utf-8");
  return { ok: true, count: annotations.length };
}

// ─── Competitor management ─────────────────────────────────

async function handleGetCompetitors(repoRoot) {
  const competitors = await loadCompetitors(repoRoot);
  return { ok: true, competitors };
}

async function handlePostCompetitors(repoRoot, body) {
  const competitors = Array.isArray(body.competitors) ? body.competitors : [];
  
  // Validate
  const valid = competitors.filter(c => c.name && c.url);
  if (valid.length === 0) {
    return { ok: false, error: "Each competitor needs name and url" };
  }
  
  await saveCompetitors(repoRoot, valid);
  await brain.log(repoRoot, `Updated competitors list: ${valid.length} entries`).catch(() => {});
  
  return { ok: true, competitors: valid };
}

// ─── Snapshot capture ──────────────────────────────────────

async function captureSnapshot(repoRoot, competitor) {
  try {
    const response = await fetch(competitor.url, {
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "agent.meimei/checklist-snapshot" }
    });
    
    if (!response.ok) {
      return { competitor: competitor.name, url: competitor.url, status: "error", error: `HTTP ${response.status}` };
    }
    
    const html = await response.text();
    const plainText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 5000);
    
    // Simple hash for change detection
    const hash = Array.from(plainText).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36);
    
    // Extract basic metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    
    const headings = Array.from(html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi))
      .map(m => m[1].trim())
      .slice(0, 10);
    
    const links = Array.from(html.matchAll(/href="([^"]+)"/gi))
      .map(m => m[1])
      .filter(l => l.startsWith("http"))
      .slice(0, 20);
    
    return {
      competitor: competitor.name,
      url: competitor.url,
      title,
      hash,
      metadata: { headings, links },
      plainText: plainText.substring(0, 2000),
      capturedAt: new Date().toISOString(),
      status: "ok"
    };
  } catch (error) {
    return {
      competitor: competitor.name,
      url: competitor.url,
      status: "error",
      error: error.message
    };
  }
}

// ─── Insight generation ────────────────────────────────────

async function generateInsight(repoRoot, competitor, prevSnapshot, currentSnapshot) {
  if (!prevSnapshot || prevSnapshot.hash === currentSnapshot.hash) {
    return null;
  }
  
  const prompt = `You are a competitive intelligence analyst. Compare these two snapshots and identify meaningful changes.

Competitor: ${competitor.name}
URL: ${competitor.url}

PREVIOUS SNAPSHOT:
Title: ${prevSnapshot.title || "(none)"}
Headings: ${(prevSnapshot.metadata?.headings || []).join(", ")}
Links: ${(prevSnapshot.metadata?.links || []).slice(0, 5).join(", ")}

CURRENT SNAPSHOT:
Title: ${currentSnapshot.title || "(none)"}
Headings: ${(currentSnapshot.metadata?.headings || []).join(", ")}
Links: ${(currentSnapshot.metadata?.links || []).slice(0, 5).join(", ")}

Text snippet (previous): ${prevSnapshot.plainText?.substring(0, 300) || "(none)"}
Text snippet (current): ${currentSnapshot.plainText?.substring(0, 300) || "(none)"}

Return ONLY JSON:
{
  "change": "What changed (1 sentence)",
  "meaning": "What this means competitively (1-2 sentences)",
  "tags": ["pricing", "feature", "messaging", "team", "partnership", "other"],
  "severity": "low|medium|high"
}`;

  try {
    const result = await inferenceCallOllamaJson(prompt, {
      model: "qwen3.5:0.8b",
      taskType: "analyze",
      temperature: 0.3,
      maxTokens: 512
    });
    
    const data = result.data;
    return {
      id: "insight_" + Date.now(),
      competitor: competitor.name,
      source: competitor.url,
      change: data.change || "Unknown change detected",
      meaning: data.meaning || "Impact unclear",
      tags: data.tags || ["other"],
      severity: data.severity || "medium",
      createdAt: new Date().toISOString()
    };
  } catch {
    return {
      id: "insight_" + Date.now(),
      competitor: competitor.name,
      source: competitor.url,
      change: "Change detected (hash different)",
      meaning: "Automated detection - review manually",
      tags: ["other"],
      severity: "low",
      createdAt: new Date().toISOString()
    };
  }
}

// ─── Recommendation generation ─────────────────────────────

async function generateRecommendations(repoRoot, competitors, insights, annotations) {
  // Load Brain context
  const context = await brain.buildContext(repoRoot, { layers: ["identity", "user", "context"], logLimit: 10 });
  
  // Get recent decline annotations to suppress similar cards
  const recentDeclines = annotations
    .filter(a => a.type === "decline")
    .slice(-10)
    .map(a => a.text || a.reason || "")
    .filter(Boolean);
  
  // Get recent edits/clarifies for rewrite hints
  const recentEdits = annotations
    .filter(a => a.type === "edit" || a.type === "clarify")
    .slice(-5)
    .map(a => `${a.type}: ${a.text || ""}`)
    .filter(Boolean);
  
  const competitorList = competitors.map(c => `${c.name} (${c.url})`).join(", ");
  const insightSummary = insights.slice(-5).map(i => `- [${i.competitor}] ${i.change} (${i.meaning})`).join("\n");
  
  const prompt = `You are MeiMei, a competitive intelligence assistant.

Operator context:
${context}

Tracked competitors:
${competitorList}

Recent insights:
${insightSummary || "(no recent insights)"}

${recentDeclines.length ? `Previously declined (avoid similar):\n${recentDeclines.join("\n")}\n` : ""}
${recentEdits.length ? `User corrections:\n${recentEdits.join("\n")}\n` : ""}

Generate 1-3 action recommendations. Return ONLY JSON:
{
  "recommendations": [
    {
      "action": "What to do (1 sentence)",
      "meaning": "Why this matters",
      "priority": "high|medium|low",
      "competitor": "Which competitor this relates to",
      "evidence": "Supporting evidence from insights"
    }
  ]
}`;

  try {
    const result = await inferenceCallOllamaJson(prompt, {
      model: "llama3:latest",
      taskType: "generate",
      temperature: 0.4,
      maxTokens: 1024
    });
    
    const recs = result.data.recommendations || [];
    
    // Suppress based on decline annotations
    const filtered = recs.filter(rec => {
      const actionLower = (rec.action || "").toLowerCase();
      return !recentDeclines.some(d => {
        const declineWords = d.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        return declineWords.some(w => actionLower.includes(w));
      });
    });
    
    return filtered.slice(0, 3).map((rec, i) => ({
      id: "rec_" + Date.now() + "_" + i,
      action: rec.action,
      meaning: rec.meaning,
      priority: rec.priority || "medium",
      competitor: rec.competitor || "",
      evidence: rec.evidence || "",
      agentUsed: "ollama/llama3",
      confidence: 0.75,
      createdAt: new Date().toISOString()
    }));
  } catch {
    // Fallback: generate from insights directly
    return insights.slice(-2).map((insight, i) => ({
      id: "rec_" + Date.now() + "_" + i,
      action: `Review ${insight.competitor}: ${insight.change}`,
      meaning: insight.meaning,
      priority: insight.severity || "medium",
      competitor: insight.competitor,
      evidence: `Insight from ${insight.createdAt}`,
      agentUsed: "fallback",
      confidence: 0.5,
      createdAt: new Date().toISOString()
    }));
  }
}

// ─── Checklist management ──────────────────────────────────

async function handleGetChecklist(repoRoot) {
  const checklist = await loadChecklist(repoRoot);
  return { ok: true, active: checklist.active || [], archive: checklist.archive || [] };
}

async function handlePostChecklist(repoRoot, body) {
  const businessName = body.businessName || "Default";
  const competitors = await loadCompetitors(repoRoot);
  const insights = await loadInsights(repoRoot);
  const annotations = await loadAnnotations(repoRoot);
  
  // Generate recommendations
  const recommendations = await generateRecommendations(repoRoot, competitors, insights, annotations);
  
  // Load existing checklist
  const checklist = await loadChecklist(repoRoot);
  
  // Convert recommendations to checklist items
  const newItems = recommendations.map(rec => ({
    id: "item_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    action: rec.action,
    change: rec.meaning,
    meaning: rec.meaning,
    priority: rec.priority,
    source: "recommendation",
    agentUsed: rec.agentUsed,
    reasoning: rec.evidence,
    evidence: rec.evidence,
    confidence: rec.confidence,
    competitor: rec.competitor,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  
  // Merge with existing active items (keep existing, add new)
  const existingIds = new Set((checklist.active || []).map(i => i.id));
  const toAdd = newItems.filter(i => !existingIds.has(i.id));
  checklist.active = [...(checklist.active || []), ...toAdd].slice(0, 3);
  
  await saveChecklist(repoRoot, checklist);
  await brain.log(repoRoot, `Generated ${toAdd.length} checklist items for ${businessName}`).catch(() => {});
  
  return {
    ok: true,
    active: checklist.active,
    archive: checklist.archive || [],
    generated: toAdd.length
  };
}

async function handlePatchChecklist(repoRoot, body) {
  const id = body.id;
  if (!id) return { ok: false, error: "Missing id" };
  
  const checklist = await loadChecklist(repoRoot);
  const item = (checklist.active || []).find(i => i.id === id);
  
  if (!item) return { ok: false, error: "Item not found" };
  
  // Update fields
  const updates = body;
  if (updates.status) item.status = updates.status;
  if (updates.action) item.action = updates.action;
  if (updates.change) item.change = updates.change;
  if (updates.meaning) item.meaning = updates.meaning;
  if (updates.reasoning) item.reasoning = updates.reasoning;
  if (updates.evidence) item.evidence = updates.evidence;
  if (updates.confidence) item.confidence = updates.confidence;
  if (updates.userNote) item.userNote = updates.userNote;
  if (updates.declineReason) item.declineReason = updates.declineReason;
  if (updates.clarificationRequest) item.clarificationRequest = updates.clarificationRequest;
  item.updatedAt = new Date().toISOString();
  
  // Create annotation
  const annotations = await loadAnnotations(repoRoot);
  const annotationType = updates.status === "done" ? "status" :
    updates.status === "declined" ? "decline" :
    updates.status === "clarify" ? "clarify" :
    updates.userNote ? "edit" : "status";
  
  const annotation = {
    id: "ann_" + Date.now(),
    taskId: id,
    type: annotationType,
    text: updates.userNote || updates.declineReason || updates.clarificationRequest || "",
    source: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  annotations.push(annotation);
  await saveAnnotations(repoRoot, annotations);
  
  // Archive completed/declined items
  if (updates.status === "done" || updates.status === "declined") {
    checklist.active = (checklist.active || []).filter(i => i.id !== id);
    checklist.archive = checklist.archive || [];
    checklist.archive.push(item);
    
    // Keep only last 50 archived
    if (checklist.archive.length > 50) {
      checklist.archive = checklist.archive.slice(-50);
    }
  }
  
  await saveChecklist(repoRoot, checklist);
  await brain.log(repoRoot, `Updated checklist item: ${id} → ${updates.status || "modified"}`).catch(() => {});
  
  return { ok: true, item, annotation };
}

// ─── Pipeline (weekly snapshot + insight generation) ───────

async function handleRunPipeline(repoRoot) {
  const competitors = await loadCompetitors(repoRoot);
  if (competitors.length === 0) {
    return { ok: false, error: "No competitors configured. Add competitors first." };
  }
  
  const snapshots = await loadSnapshots(repoRoot);
  const newSnapshots = [];
  const newInsights = [];
  
  for (const competitor of competitors) {
    // Capture new snapshot
    const snapshot = await captureSnapshot(repoRoot, competitor);
    newSnapshots.push(snapshot);
    
    if (snapshot.status === "ok") {
      // Find previous snapshot
      const prevSnapshot = snapshots
        .filter(s => s.competitor === competitor.name)
        .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt))[0];
      
      // Generate insight
      const insight = await generateInsight(repoRoot, competitor, prevSnapshot, snapshot);
      if (insight) {
        newInsights.push(insight);
      }
    }
  }
  
  // Save snapshots and insights
  const allSnapshots = [...snapshots, ...newSnapshots].slice(-200);
  await saveSnapshots(repoRoot, allSnapshots);
  
  const existingInsights = await loadInsights(repoRoot);
  const allInsights = [...existingInsights, ...newInsights].slice(-100);
  await saveInsights(repoRoot, allInsights);
  
  await brain.log(repoRoot, `Pipeline run: ${newSnapshots.length} snapshots, ${newInsights.length} insights`).catch(() => {});
  
  return {
    ok: true,
    snapshots: newSnapshots.map(s => ({ competitor: s.competitor, status: s.status })),
    insights: newInsights.map(i => ({ competitor: i.competitor, change: i.change, severity: i.severity })),
    total: { snapshots: allSnapshots.length, insights: allInsights.length }
  };
}

// ─── Main API handler ──────────────────────────────────────

async function handleApi(req, body, repoRoot) {
  const action = String(body.action || "list");
  
  // Competitor actions
  if (action === "competitors.list") {
    return handleGetCompetitors(repoRoot);
  }
  if (action === "competitors.update") {
    return handlePostCompetitors(repoRoot, body);
  }
  
  // Pipeline actions
  if (action === "pipeline.run") {
    return handleRunPipeline(repoRoot);
  }
  if (action === "pipeline.snapshots") {
    const snapshots = await loadSnapshots(repoRoot);
    return { ok: true, snapshots: snapshots.slice(-20) };
  }
  if (action === "pipeline.insights") {
    const insights = await loadInsights(repoRoot);
    return { ok: true, insights: insights.slice(-20) };
  }
  
  // Checklist actions
  if (action === "checklist.get") {
    return handleGetChecklist(repoRoot);
  }
  if (action === "checklist.generate") {
    return handlePostChecklist(repoRoot, body);
  }
  if (action === "checklist.update") {
    return handlePatchChecklist(repoRoot, body);
  }
  
  // Annotations
  if (action === "annotations.list") {
    const annotations = await loadAnnotations(repoRoot);
    return { ok: true, annotations: annotations.slice(-30) };
  }
  
  // Default: return overview
  const competitors = await loadCompetitors(repoRoot);
  const checklist = await loadChecklist(repoRoot);
  const insights = await loadInsights(repoRoot);
  const snapshots = await loadSnapshots(repoRoot);
  
  return {
    ok: true,
    overview: {
      competitors: competitors.length,
      activeItems: (checklist.active || []).length,
      archivedItems: (checklist.archive || []).length,
      insights: insights.length,
      snapshots: snapshots.length
    },
    active: checklist.active || [],
    recentInsights: insights.slice(-5)
  };
}

export { META, handleApi };
