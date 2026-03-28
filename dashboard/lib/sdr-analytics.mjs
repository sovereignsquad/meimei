import path from "node:path";
import { mkdir, appendFile, readFile } from "node:fs/promises";

/** Append-only log for SDR (#654): sends, Mail drafts, manual tracking. */
export function sdrLogPath(repoRoot) {
  return path.join(repoRoot, "data", "sdr-outbound.jsonl");
}

export async function appendSdrEvent(repoRoot, event) {
  const p = sdrLogPath(repoRoot);
  await mkdir(path.dirname(p), { recursive: true });
  const line = JSON.stringify({ t: new Date().toISOString(), ...event }) + "\n";
  await appendFile(p, line, "utf8");
}

export async function loadSdrEvents(repoRoot) {
  try {
    const raw = await readFile(sdrLogPath(repoRoot), "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

export function summarizeSdr(events) {
  let mailDraftOpened = 0;
  let sendAttempt = 0;
  let trackNote = 0;
  const byCampaign = {};
  for (const e of events) {
    if (e.type === "mail_draft_opened") mailDraftOpened += 1;
    if (e.type === "send_attempt") sendAttempt += 1;
    if (e.type === "track") trackNote += 1;
    const c = e.campaignName || "(none)";
    byCampaign[c] = (byCampaign[c] || 0) + 1;
  }
  return {
    totalEvents: events.length,
    mailDraftOpened,
    sendAttempt,
    trackNote,
    byCampaign
  };
}
