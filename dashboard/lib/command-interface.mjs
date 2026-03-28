import { callOllamaJson } from "./llm.mjs";
import brain from "./brain/index.mjs";

const COMMAND_INTENTS = [
  "enrich_lead",
  "lead_outreach",
  "sdr_analytics",
  "supabase_connector",
  "environment_variables",
  "check_inbox", 
  "view_memory",
  "check_status",
  "get_recommendations",
  "summarize_url",
  "learn_fact",
  "query_context",
  "unknown"
];

// Fast keyword-based intent matching — no LLM needed for obvious queries
// Order matters: longer/more-specific phrases FIRST
const KEYWORD_PATTERNS = [
  { intent: "learn_fact", keywords: ["remember that", "learn that", "note that", "save this", "remember this"] },
  { intent: "get_recommendations", keywords: ["what next", "what should", "recommend", "prioritize", "priorities", "next step", "todo"] },
  { intent: "sdr_analytics", keywords: ["sdr analytics", "outreach metrics", "outreach dashboard", "campaign metrics"] },
  { intent: "supabase_connector", keywords: ["supabase connector", "supabase tool"] },
  { intent: "environment_variables", keywords: ["environment variables", "env variables", "api keys", "secrets manager", "vercel env"] },
  { intent: "lead_outreach", keywords: ["outreach", "cold email", "campaign", "sdr", "sequence"] },
  { intent: "check_inbox", keywords: ["inbox", "email", "emails", "mail", "unread", "messages"] },
  { intent: "enrich_lead", keywords: ["enrich", "enrichment", "lead", "linkedin", "contact", "crm"] },
  { intent: "view_memory", keywords: ["memory", "identity", "brain", "what do you know", "who are you"] },
  { intent: "check_status", keywords: ["mission control", "system status", "agents", "gateway", "telemetry"] },
  { intent: "summarize_url", keywords: ["summarize", "summary"] },
];

function matchKeywords(query) {
  const lower = query.toLowerCase().trim();

  // Check for URLs — summarize intent
  if (lower.match(/https?:\/\//)) {
    const urlMatch = query.match(/(https?:\/\/[^\s]+)/);
    return {
      intent: "summarize_url",
      confidence: 0.95,
      entities: { url: urlMatch ? urlMatch[1] : null },
      extracted_query: query
    };
  }

  // Check for email addresses — enrich intent
  const emailMatch = query.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    return {
      intent: "enrich_lead",
      confidence: 0.9,
      entities: { email: emailMatch[0] },
      extracted_query: query
    };
  }

  // Keyword matching
  for (const pattern of KEYWORD_PATTERNS) {
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) {
        return {
          intent: pattern.intent,
          confidence: 0.85,
          entities: {},
          extracted_query: query
        };
      }
    }
  }

  return null; // No keyword match — fall through to LLM
}

async function parseIntentWithLLM(query, context) {
  const prompt = `Classify this query into ONE intent. If the query is not clearly about one of these specific topics, use "query_context". Respond with JSON only.

enrich_lead = enrich a business contact or email
check_inbox = check or read emails
view_memory = view agent identity or stored knowledge
check_status = check MeiMei system health or OpenClaw agents
get_recommendations = ask what to do next or get priorities
sdr_analytics = outbound / SDR metrics and funnel dashboard
supabase_connector = Supabase database connector tool
environment_variables = manage API keys and env vars like Vercel
summarize_url = summarize a webpage
learn_fact = teach the system a new fact
query_context = general question or chitchat
unknown = completely unclear

Query: "${query}"

{"intent":"...","confidence":0.0}`;

  try {
    const result = await callOllamaJson(prompt, {
      model: "qwen3.5:0.8b",
      temperature: 0.1,
      maxTokens: 64
    });

    if (result.data && COMMAND_INTENTS.includes(result.data.intent)) {
      return {
        intent: result.data.intent,
        confidence: result.data.confidence || 0.7,
        entities: result.data.entities || {},
        extracted_query: query
      };
    }
  } catch {
    // LLM failed — fall through
  }

  return { intent: "query_context", confidence: 0.3, entities: {}, extracted_query: query };
}

async function parseIntent(query, context = "") {
  // Step 1: Fast keyword match
  const keywordMatch = matchKeywords(query);
  if (keywordMatch) return keywordMatch;

  // Step 2: LLM for ambiguous queries
  return parseIntentWithLLM(query, context);
}

async function executeCommand(intentData, repoRoot) {
  const { intent, entities, extracted_query } = intentData;
  
  switch (intent) {
    case "enrich_lead": {
      if (entities.email) {
        return { 
          action: "navigate", 
          target: "/649/Lead_enrichment",
          params: { source: "email", sourceData: { email: entities.email } },
          message: "Opening Lead Enrichment for " + entities.email
        };
      }
      return { action: "navigate", target: "/649/Lead_enrichment", message: "Opening Lead Enrichment" };
    }

    case "lead_outreach": {
      return { action: "navigate", target: "/653/Lead_outreach", message: "Opening Lead Outreach" };
    }

    case "sdr_analytics": {
      return { action: "navigate", target: "/651/AI_SDR_analytics", message: "Opening AI SDR analytics" };
    }

    case "supabase_connector": {
      return { action: "navigate", target: "/631/Supabase_connector", message: "Opening Supabase connector" };
    }

    case "environment_variables": {
      return {
        action: "navigate",
        target: "/726/Environment_variables",
        message: "Opening Environment variables"
      };
    }
    
    case "check_inbox": {
      return { action: "navigate", target: "/563/Inbox", message: "Opening Inbox" };
    }
    
    case "view_memory": {
      return { action: "navigate", target: "/601/Memory", message: "Opening Memory" };
    }
    
    case "check_status": {
      return { action: "navigate", target: "/635/Mission_control", message: "Opening Mission Control" };
    }
    
    case "get_recommendations": {
      return { action: "navigate", target: "/724/What_next", message: "Opening What Next" };
    }
    
    case "summarize_url": {
      if (entities.url) {
        return { 
          action: "navigate", 
          target: "/516/Explain_it",
          params: { url: entities.url },
          message: "Summarizing " + entities.url
        };
      }
      return { action: "navigate", target: "/516/Explain_it", message: "Opening Explain It" };
    }
    
    case "learn_fact": {
      await brain.learn(repoRoot, extracted_query, "user_command");
      return { 
        action: "response", 
        message: "Learned. You can view it in Memory.",
        navigateTo: "/601/Memory"
      };
    }
    
    case "query_context": {
      const result = await brain.think(repoRoot, extracted_query, { depth: "fast" });
      if (result.ok) {
        // Strip thinking tags if present
        let response = result.response || "";
        response = response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (!response) response = "I don't have enough context to answer that.";
        return { action: "response", message: response };
      }
      return { action: "response", message: "I'm not sure about that." };
    }
    
    default: {
      return {
        action: "response",
        message: "Try: check inbox, enrich [email], what next, system status, summarize [url], or remember [fact]."
      };
    }
  }
}

async function processNaturalLanguage(query, repoRoot) {
  const context = await brain.buildContext(repoRoot, { includeLog: true, logLimit: 5 });
  const intentData = await parseIntent(query, context);
  const result = await executeCommand(intentData, repoRoot);
  
  return {
    ok: true,
    query,
    intent: intentData.intent,
    confidence: intentData.confidence,
    ...result
  };
}

export {
  parseIntent,
  executeCommand,
  processNaturalLanguage,
  COMMAND_INTENTS
};
