/**
 * Lead Enrichment App — single-shot enrich + workflow queue (#649, #650)
 */

import { inferenceCallOllamaJson } from "../../dashboard/lib/meimei-inference-client.mjs";
import brain from "../../dashboard/lib/brain/index.mjs";
import { supabaseSelectRows } from "../../dashboard/lib/supabase-connector.mjs";
import {
  enqueueWorkflowItem,
  listWorkflowItems,
  removeWorkflowItem,
  skipWorkflowItem,
  runWorkflowItem
} from "../../dashboard/lib/lead-enrichment-workflow.mjs";
import { loadRegistrySync, miniappRuntimeConfig } from "../../dashboard/lib/miniapp-registry.mjs";

const META = {
  id: "lead-enrichment",
  name: "Lead Enrichment",
  description: "Enrich contacts and companies with structured sales data",
  category: "apps",
  issueId: "649"
};

function catalogLinks() {
  const { routes: R } = miniappRuntimeConfig(loadRegistrySync());
  return {
    leadEnrichment: R["lead-enrichment"]?.cardHref ?? "/649/Lead_enrichment",
    leadOutreach: R["lead-outreach"]?.cardHref ?? "/653/Lead_outreach"
  };
}

/**
 * @param {{ source: string, sourceData: object, enrichmentLevel?: string, priority?: string }} opts
 * @param {string} repoRoot
 */
async function enrichLead(
  { source, sourceData, enrichmentLevel = "standard", priority = "medium" },
  repoRoot
) {
  const leadId = "enriched_" + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  let input = "";
  let prompt = "";

  if (source === "linkedin") {
    const profileUrl = sourceData.profileUrl || "";
    input = profileUrl;
    prompt = `You are a lead enrichment AI. Given a LinkedIn profile URL or username, generate a realistic professional profile.

Input: ${input}

Respond ONLY with a JSON object in this exact format:
{
  "name": "Full Name",
  "title": "Job Title",
  "company": "Company Name",
  "companySize": "51-200",
  "industry": "Technology",
  "location": "City, State",
  "linkedin": "${profileUrl.startsWith("http") ? profileUrl : "https://linkedin.com/in/" + profileUrl}"
}

Make the data realistic and professional. No extra text, just JSON.`;
  } else if (source === "email") {
    const email = sourceData.email || "";
    input = email;
    const domain = email.split("@")[1] || "";
    prompt = `You are a lead enrichment AI. Given an email address, generate a realistic professional profile.

Input: ${input}
Domain: ${domain}

Respond ONLY with a JSON object in this exact format:
{
  "name": "Full Name",
  "title": "Job Title",
  "company": "${domain}",
  "location": "City, State",
  "email": "${email}"
}

Infer the name from the email prefix. Make data realistic. No extra text, just JSON.`;
  } else if (source === "company") {
    const domain = sourceData.domain || sourceData.company || "";
    input = domain;
    prompt = `You are a lead enrichment AI. Given a company domain, generate a realistic company profile.

Input: ${input}

Respond ONLY with a JSON object in this exact format:
{
  "company": "Company Name",
  "domain": "${domain}",
  "industry": "Technology",
  "companySize": "51-200"
}

Make data realistic. No extra text, just JSON.`;
  } else if (source === "phone") {
    input = sourceData.phone || "";
    prompt = `You are a lead enrichment AI. Given a phone number, generate a realistic profile.

Input: ${input}

Respond ONLY with a JSON object in this exact format:
{
  "phone": "${input}",
  "location": "City, State"
}

No extra text, just JSON.`;
  } else if (source === "crm") {
    const crmProvider = String(sourceData.crmProvider || "crm").replace(/"/g, "'");
    const externalId = String(sourceData.externalId || sourceData.recordId || "").replace(/"/g, "'");
    const email = String(sourceData.email || "").trim();
    const notes = String(sourceData.notes || "").slice(0, 2000);
    let customBlock = "";
    if (sourceData.customFields != null) {
      try {
        customBlock =
          typeof sourceData.customFields === "object"
            ? JSON.stringify(sourceData.customFields).slice(0, 4000)
            : String(sourceData.customFields).slice(0, 4000);
      } catch {
        customBlock = "";
      }
    }
    input = JSON.stringify({ crmProvider, externalId, email, notesLen: notes.length });
    prompt = `You are a lead enrichment AI. The operator supplied fields from a CRM or CRM-style connector (issue #632). Expand into a single professional profile JSON. Treat provided fields as facts; infer only reasonable missing fields and keep confidence honest.

CRM provider: ${crmProvider}
External / record id: ${externalId}
Email: ${email}
Notes: ${notes}
Custom fields (JSON or text): ${customBlock || "(none)"}

Respond ONLY with JSON:
{
  "name": "Full name or best guess from email",
  "title": "Job title if known or inferred weakly",
  "company": "Company",
  "companySize": "e.g. 51-200",
  "industry": "Industry",
  "location": "City, Region",
  "email": "${email}",
  "linkedin": "https://linkedin.com/in/... if unknown use empty string",
  "crmProvider": "${crmProvider}",
  "crmExternalId": "${externalId}"
}
No markdown, no commentary.`;
  } else if (source === "supabase") {
    let rows;
    try {
      rows = await supabaseSelectRows({
        table: sourceData.table,
        id: sourceData.id,
        idColumn: sourceData.idColumn,
        match: sourceData.match,
        limit: sourceData.limit || 1
      });
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : String(e)
      };
    }
    if (!rows.length) {
      return { ok: false, error: "Supabase query returned no rows (#631)." };
    }
    const row = rows[0];
    input = JSON.stringify({ table: sourceData.table, row }).slice(0, 4000);
    prompt = `You are a lead enrichment AI. The operator loaded a row from Supabase (connector #631). Treat JSON fields as facts; infer missing fields conservatively.

Row JSON:
${input}

Respond ONLY with JSON:
{
  "name": "Full name or best guess",
  "title": "Role",
  "company": "Company",
  "companySize": "e.g. 51-200",
  "industry": "Industry",
  "location": "City, Region",
  "email": "email if present in row",
  "linkedin": "URL or empty string",
  "supabaseSource": "table ${String(sourceData.table || "").replace(/"/g, "'")}"
}
No markdown, no commentary.`;
  }

  if (!prompt.trim()) {
    return { ok: false, error: "Unknown or unsupported lead source." };
  }

  try {
    const result = await inferenceCallOllamaJson(prompt, { model: "qwen3.5:0.8b" });
    const profile = result.data;

    if (!profile || Object.keys(profile).length === 0) {
      return {
        ok: false,
        error: "Failed to parse LLM response as JSON. Raw response: " + result.raw.substring(0, 200)
      };
    }

    await brain.log(repoRoot, `Enriched lead: ${source} -> ${JSON.stringify(profile).substring(0, 50)}...`).catch(
      () => {}
    );

    const signals = [{ type: "ai_enriched", confidence: 0.78, detail: "Profile via MeiMei inference plane (qwen3.5)" }];

    if (source === "crm") {
      signals.unshift({
        type: "crm_connector",
        confidence: 0.92,
        detail: `CRM-style seed (#632) — provider ${String(sourceData.crmProvider || "unknown")}`
      });
    }
    if (source === "supabase") {
      signals.unshift({
        type: "supabase_connector",
        confidence: 0.9,
        detail: `Supabase row (#631) — table ${String(sourceData.table || "unknown")}`
      });
    }

    if (enrichmentLevel === "full") {
      signals.push({ type: "full_enrichment", confidence: 0.85, detail: "Full enrichment with AI" });
    }

    const companySize = profile.companySize || "";
    const computedPriority = companySize.includes("1000") || companySize.includes("+") ? "high" : priority;

    return {
      ok: true,
      lead: {
        id: leadId,
        source,
        sourceData,
        profile,
        signals,
        priority: computedPriority,
        enrichedAt: now
      },
      audit: {
        enrichmentSources:
          source === "crm"
            ? [source, "crm-connector#632", "inference-route/qwen3.5:0.8b"]
            : source === "supabase"
              ? [source, "supabase-connector#631", "inference-route/qwen3.5:0.8b"]
              : [source, "inference-route/qwen3.5:0.8b"],
        confidence: enrichmentLevel === "full" ? 0.85 : 0.78,
        expiresAt
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: `LLM enrichment failed: ${error.message}`
    };
  }
}

async function processLeadEnrichmentWorkflow(body = {}, repoRoot) {
  const action = String(body.action || "");
  const links = catalogLinks();
  if (action === "workflow_overview" || action === "workflow_list") {
    if (action === "workflow_overview") {
      return {
        ok: true,
        issue: 650,
        title: "Lead enrichment workflow",
        summary:
          "Queue leads on disk, run the same enrich pipeline as #649 per item, then hand off to Lead outreach (#653).",
        stages: [
          { id: "queued", label: "Queued — waiting for enrich" },
          { id: "enriched", label: "Enriched — ready for outreach" },
          { id: "failed", label: "Failed — fix data and Run again" },
          { id: "skipped", label: "Skipped — intentionally passed" }
        ],
        storeFile: "data/lead-enrichment-workflow.v1.json",
        links: {
          leadEnrichment: links.leadEnrichment,
          leadOutreach: links.leadOutreach,
          issue650: "https://github.com/moldovancsaba/mvp-factory-control/issues/650"
        }
      };
    }
    return listWorkflowItems(repoRoot);
  }
  if (action === "workflow_enqueue") {
    return enqueueWorkflowItem(repoRoot, {
      source: body.source,
      sourceData: body.sourceData,
      enrichmentLevel: body.enrichmentLevel,
      priority: body.priority,
      label: body.label
    });
  }
  if (action === "workflow_remove") {
    return removeWorkflowItem(repoRoot, body.workflowId || body.id);
  }
  if (action === "workflow_skip") {
    return skipWorkflowItem(repoRoot, body.workflowId || body.id);
  }
  if (action === "workflow_run") {
    return runWorkflowItem(repoRoot, body.workflowId || body.id, (opts) => enrichLead(opts, repoRoot));
  }
  return {
    ok: false,
    error:
      "Unknown workflow action. Use workflow_overview, workflow_list, workflow_enqueue, workflow_run, workflow_skip, or workflow_remove."
  };
}

async function handleApi(req, body, repoRoot) {
  const b = body || {};
  const action = String(b.action || "");
  if (action.startsWith("workflow_")) {
    return processLeadEnrichmentWorkflow(b, repoRoot);
  }

  const source = String(b.source || "");
  const sourceData = b.sourceData || {};
  const enrichmentLevel = String(b.enrichmentLevel || "standard");
  const priority = String(b.priority || "medium");

  if (!source || !sourceData || Object.keys(sourceData).length === 0) {
    return { ok: false, error: "Missing required fields: source and sourceData" };
  }

  return enrichLead({ source, sourceData, enrichmentLevel, priority }, repoRoot);
}

export { META, handleApi, enrichLead, processLeadEnrichmentWorkflow };
