#!/usr/bin/env node

const args = process.argv.slice(2);

function usage() {
  console.error("Usage: web-search <query> [--count N] [--json]");
  process.exit(1);
}

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function parseArgs(argv) {
  const out = { count: 5, json: true, queryParts: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (part === "--count") {
      out.count = Number(argv[++i] || "5");
    } else if (part === "--json") {
      out.json = true;
    } else if (part === "--plain") {
      out.json = false;
    } else {
      out.queryParts.push(part);
    }
  }
  out.query = out.queryParts.join(" ").trim();
  return out;
}

function resolveDuckDuckGoUrl(href) {
  try {
    const url = new URL(href, "https://duckduckgo.com");
    const redirected = url.searchParams.get("uddg");
    if (redirected) return decodeURIComponent(redirected);
    return url.toString();
  } catch {
    return href;
  }
}

function parseResults(html, limit) {
  const results = [];
  const resultBlockRegex = /<div[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
  const blocks = html.match(resultBlockRegex) || [];

  for (const block of blocks) {
    const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
      || block.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    const title = stripTags(titleMatch[2]);
    const url = resolveDuckDuckGoUrl(titleMatch[1]);
    const snippet = snippetMatch ? stripTags(snippetMatch[1]) : "";

    if (!title || !url) continue;
    results.push({ title, url, snippet });
    if (results.length >= limit) break;
  }

  return results;
}

async function main() {
  const { query, count, json } = parseArgs(args);
  if (!query) usage();

  const searchUrl = new URL("https://html.duckduckgo.com/html/");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("kl", "us-en");

  const response = await fetch(searchUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: HTTP ${response.status}`);
  }

  const html = await response.text();
  const results = parseResults(html, Math.max(1, Math.min(10, Number.isFinite(count) ? count : 5)));

  if (json) {
    process.stdout.write(`${JSON.stringify({ query, results }, null, 2)}\n`);
    return;
  }

  for (const [index, result] of results.entries()) {
    process.stdout.write(`${index + 1}. ${result.title}\n${result.url}\n`);
    if (result.snippet) process.stdout.write(`${result.snippet}\n`);
    process.stdout.write("\n");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
