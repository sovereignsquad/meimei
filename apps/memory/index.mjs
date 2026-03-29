/**
 * Memory App
 * 
 * Business Brain - MeiMei's identity, mission, values, and operating principles
 * Issue: #601
 */

import brain from "../../dashboard/lib/brain/index.mjs";

const META = {
  id: "memory",
  name: "Memory",
  description: "Business Brain - identity, mission, values, operating principles",
  category: "tools",
  issueId: "601"
};

const LAYER_MAP = {
  "identity": "identity",
  "context": "context",
  "events": "log",
  "skills": "skills",
  "user": "user",
  "durable": "durable"
};

async function handleApi(req, body, repoRoot) {
  let layer = String(body.layer || "all");
  const action = String(body.action || "get");
  const query = String(body.query || "");

  if (LAYER_MAP[layer]) {
    layer = LAYER_MAP[layer];
  }

  try {
    // Brain operations
    if (action === "query" && query) {
      return await brain.getContext(repoRoot, query);
    }

    if (action === "learn" && body.fact) {
      return await brain.learn(repoRoot, body.fact, body.source || "user");
    }

    if (action === "think" && body.question) {
      return await brain.think(repoRoot, body.question, { depth: body.depth || "medium" });
    }

    if (action === "log" && body.activity) {
      return await brain.log(repoRoot, body.activity);
    }

    // Backbone operations
    if (action === "stats") {
      return await brain.getStats(repoRoot);
    }

    if (action === "compact") {
      return await brain.compactLog(repoRoot);
    }

    if (action === "curate") {
      return await brain.curateDurable(repoRoot);
    }

    if (action === "snapshot") {
      return await brain.snapshot(repoRoot, layer || "all");
    }

    // Get layer
    if (action === "get") {
      if (layer === "all") {
        const layers = await brain.readLayers(repoRoot);
        return {
          ok: true,
          layers,
          availableLayers: Object.keys(brain.layers)
        };
      } else {
        const result = await brain.readLayer(repoRoot, layer);
        if (!result.ok) {
          return { ok: false, httpStatus: 404, error: `Layer not found: ${layer}` };
        }

        // Parse markdown for frontend
        let parsedContent;
        try {
          const lines = result.content.split('\n').filter(l => l.trim());
          parsedContent = {};
          let currentKey = null;

          for (const line of lines) {
            if (line.startsWith('#')) continue;
            if (line.startsWith('- ') || line.startsWith('* ')) {
              const item = line.substring(2);
              if (currentKey) {
                if (!Array.isArray(parsedContent[currentKey])) {
                  parsedContent[currentKey] = [];
                }
                parsedContent[currentKey].push(item);
              }
            } else if (line.includes(':')) {
              const [key, ...valueParts] = line.split(':');
              const value = valueParts.join(':').trim();
              parsedContent[key.trim()] = value;
              currentKey = key.trim();
            }
          }

          if (Object.keys(parsedContent).length === 0) {
            parsedContent = { content: result.content.substring(0, 500) };
          }
        } catch {
          parsedContent = { content: result.content.substring(0, 500) };
        }

        return {
          ok: true,
          layer,
          content: parsedContent,
          updatedAt: new Date().toISOString()
        };
      }
    }

    return { ok: false, error: `Unknown action: ${action}. Valid: get, query, learn, think, log, stats, compact, curate, snapshot` };
  } catch (error) {
    return { ok: false, error: `Memory error: ${error.message}` };
  }
}

export { META, handleApi };
