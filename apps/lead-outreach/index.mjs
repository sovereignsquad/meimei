/**
 * Lead outreach — cold email / SDR (#653, #654)
 */

import { inferenceCallOllamaJson } from "../../dashboard/lib/meimei-inference-client.mjs";
import brain from "../../dashboard/lib/brain/index.mjs";
import { isMailAvailable, createOutgoingDraft } from "../../dashboard/lib/mail-adapter.mjs";
import { appendSdrEvent, loadSdrEvents, summarizeSdr } from "../../dashboard/lib/sdr-analytics.mjs";
import { loadRegistrySync, miniappRuntimeConfig } from "../../dashboard/lib/miniapp-registry.mjs";

const META = {
  id: "lead-outreach",
  name: "Lead outreach",
  description: "Hyper-personalized cold email campaigns",
  category: "apps",
  issueId: "653"
};

function catalogLinks() {
  const { routes: R } = miniappRuntimeConfig(loadRegistrySync());
  return {
    leadEnrichment: R["lead-enrichment"]?.cardHref ?? "/649/Lead_enrichment"
  };
}

async function processLeadOutreach(body = {}, repoRoot) {
  const action = String(body.action || "overview");
  const links = catalogLinks();
  if (action === "overview") {
    return {
      ok: true,
      issue: 653,
      title: "Lead outreach",
      summary: "Hyper-personalized cold email campaigns (board #653).",
      addon: {
        issue: 654,
        title: "AI SDR and email engine",
        note: "Delivered: Mail draft compose + outbound log + analytics (actions sdr_send, sdr_analytics, sdr_track)."
      },
      links: {
        leadEnrichment: links.leadEnrichment,
        issue653: "https://github.com/moldovancsaba/mvp-factory-control/issues/653",
        issue654: "https://github.com/moldovancsaba/mvp-factory-control/issues/654"
      },
      nextSteps: [
        "Enrich leads in Lead Enrichment (#649); CRM (#632) or Supabase (#631).",
        "draft_touch — generate subject + body.",
        "sdr_send — open Apple Mail draft (macOS) or log-only; events in data/sdr-outbound.jsonl (gitignored).",
        "Full funnel: AI SDR analytics miniapp (#651). sdr_analytics here — quick counts; sdr_track — outcomes."
      ]
    };
  }
  if (action === "draft_touch") {
    const campaignName = String(body.campaignName || "Outbound").slice(0, 120);
    const leadSummary = String(body.leadSummary || "").slice(0, 2000);
    const tone = String(body.tone || "concise, respectful B2B").slice(0, 200);
    const prompt = `You write one cold email touch for an outbound campaign.

Campaign name: ${campaignName}
Desired tone: ${tone}
Lead / account context (from enrichment or CRM):
${leadSummary || "(none supplied)"}

Return ONLY valid JSON with keys subjectLine (string) and body (string, plain text email). No markdown fences.`;
    const result = await inferenceCallOllamaJson(prompt, {
      model: "qwen3.5:0.8b",
      maxTokens: 600,
      temperature: 0.4
    });
    const draft = result.data && typeof result.data === "object" ? result.data : {};
    return {
      ok: true,
      action: "draft_touch",
      campaignName,
      draft: {
        subjectLine: String(draft.subjectLine || "").trim(),
        body: String(draft.body || "").trim()
      },
      addon: {
        issue: 654,
        note: "Use sdr_send to open Mail draft or log; sdr_analytics for metrics."
      },
      model: result.meta?.modelUsed || null
    };
  }
  if (action === "sdr_send") {
    const root = repoRoot || process.cwd();
    const toEmail = String(body.toEmail || body.to || "").trim();
    const subjectLine = String(body.subjectLine || "").trim();
    const bodyText = String(body.body || "").trim();
    const campaignName = String(body.campaignName || "").slice(0, 120);
    if (!toEmail || !subjectLine) {
      return { ok: false, error: "sdr_send requires toEmail and subjectLine (body recommended)." };
    }
    const eventId = "sdr_" + Math.random().toString(36).slice(2, 12);
    await appendSdrEvent(root, {
      type: "send_attempt",
      eventId,
      issue: 654,
      toEmail,
      subjectLine,
      campaignName: campaignName || undefined,
      bodyChars: bodyText.length
    });
    let mode = "logged_only";
    let detail = "Event recorded. Mail not opened.";
    try {
      const mailUp = await isMailAvailable();
      if (mailUp) {
        await createOutgoingDraft({ to: toEmail, subject: subjectLine, body: bodyText || " " });
        mode = "apple_mail_draft";
        detail = "Apple Mail opened with a new outgoing message — review and send manually.";
        await appendSdrEvent(root, {
          type: "mail_draft_opened",
          eventId,
          issue: 654,
          toEmail,
          subjectLine,
          campaignName: campaignName || undefined
        });
      }
    } catch (e) {
      await appendSdrEvent(root, {
        type: "mail_draft_error",
        eventId,
        issue: 654,
        error: e instanceof Error ? e.message : String(e)
      });
      detail = `Logged; Mail draft failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    await brain.log(root, `SDR #654 ${mode}: ${toEmail} — ${subjectLine.slice(0, 60)}`).catch(() => {});
    return {
      ok: true,
      issue: 654,
      action: "sdr_send",
      eventId,
      mode,
      message: detail
    };
  }
  if (action === "sdr_analytics") {
    const root = repoRoot || process.cwd();
    const events = await loadSdrEvents(root);
    const summary = summarizeSdr(events);
    return {
      ok: true,
      issue: 654,
      action: "sdr_analytics",
      ...summary,
      recent: events.slice(-30).reverse()
    };
  }
  if (action === "sdr_track") {
    const root = repoRoot || process.cwd();
    const trackType = String(body.trackType || "note").slice(0, 64);
    const note = String(body.note || "").slice(0, 2000);
    const relatedEventId = String(body.relatedEventId || "").slice(0, 64);
    const campaignName = String(body.campaignName || "").slice(0, 120);
    if (!note.trim()) {
      return { ok: false, error: "sdr_track requires a note (e.g. replied, booked, bounce)." };
    }
    await appendSdrEvent(root, {
      type: "track",
      issue: 654,
      trackType,
      note,
      relatedEventId: relatedEventId || undefined,
      campaignName: campaignName || undefined
    });
    return { ok: true, issue: 654, action: "sdr_track" };
  }
  return {
    ok: false,
    error: "Unknown action. Use overview, draft_touch, sdr_send, sdr_analytics, or sdr_track."
  };
}

async function handleApi(req, body, repoRoot) {
  return processLeadOutreach(body || {}, repoRoot);
}

export { META, handleApi, processLeadOutreach };
