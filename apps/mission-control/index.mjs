/**
 * Mission Control App
 * 
 * Live board of MeiMei activity and state
 * Issue: #635
 */

import brain from "../../dashboard/lib/brain/index.mjs";
import { getOpenClawHealth, getTelemetry, getAgentLogs } from "../../dashboard/lib/telemetry.mjs";

const META = {
  id: "mission-control",
  name: "Mission Control",
  description: "Live board of MeiMei activity and state",
  category: "tools",
  issueId: "635"
};

async function handleApi(req, body, repoRoot) {
  const filter = String(body.filter || "all");
  const action = String(body.action || "overview");

  try {
    if (action === "logs" && body.agentId) {
      return await getAgentLogs(body.agentId, parseInt(body.limit) || 20);
    }

    if (action === "health") {
      return await getOpenClawHealth();
    }

    const telemetry = await getTelemetry();

    await brain.log(repoRoot, `Mission control viewed (filter: ${filter})`).catch(() => {});

    // Ensure overview has safe defaults
    const overview = telemetry.overview || {};
    const safeOverview = {
      totalRuns: overview.totalRuns || 0,
      successRate: overview.successRate != null ? overview.successRate :
        (overview.totalRuns > 0 ? Math.round((overview.successRuns || 0) / overview.totalRuns * 100) : 100),
      avgDuration: overview.avgDuration || "N/A",
      activeAgents: overview.activeAgents || 0
    };

    return {
      ok: true,
      overview: safeOverview,
      recentRuns: filter === "errors" ? [] : telemetry.recentRuns || [],
      errors: filter === "runs" ? [] : telemetry.errors || [],
      agentStatus: telemetry.agentStatus || [],
      gatewayStatus: telemetry.health?.gateway || { running: false },
      source: telemetry.source || "openclaw",
      timestamp: telemetry.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return { ok: false, httpStatus: 500, error: `Failed to get telemetry: ${error.message}` };
  }
}

export { META, handleApi };
