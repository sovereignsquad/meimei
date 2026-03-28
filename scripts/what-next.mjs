import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: { ...process.env },
      shell: false
    });
    let stdout = "";
    let stderr = "";
    const timeoutMs = Number(options.timeoutMs || 30000);
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2000);
    }, timeoutMs);
    timer.unref();

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr });
    });
  });
}

async function getTasks() {
  try {
    const tasksPath = path.join(repoRoot, "tasks.md");
    const content = await readFile(tasksPath, "utf8");
    const lines = content.split(/\r?\n/);
    const tasks = [];
    let inActive = false;
    
    for (const line of lines) {
      if (line.match(/^##\s+Active$/i)) {
        inActive = true;
        continue;
      }
      if (line.match(/^##\s/)) {
        inActive = false;
      }
      if (inActive && line.startsWith("- ")) {
        const title = line.replace(/^-\s+/, "").trim();
        tasks.push({
          title,
          daysAgo: 0,
          tags: "",
          urgency: "medium"
        });
      }
    }
    return tasks;
  } catch (error) {
    console.error("Error reading tasks:", error);
    return [];
  }
}

async function getCalendar() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  
  const events = [
    {
      title: "Morning planning",
      time: "09:00",
      date: todayStr,
      urgency: "low"
    },
    {
      title: "Team standup",
      time: "09:30",
      date: todayStr,
      urgency: "medium"
    },
    {
      title: now.getHours() < 12 ? "Focus time ending soon" : "Focus time",
      time: now.getHours() < 12 ? "12:00" : "14:00",
      date: todayStr,
      urgency: "high"
    },
    {
      title: "Design review",
      time: "14:00",
      date: tomorrowStr,
      urgency: "medium"
    }
  ];
  
  return events.filter(e => {
    const eventDate = new Date(`${e.date}T${e.time}:00`);
    return eventDate >= now;
  }).slice(0, 5);
}

async function getNews() {
  const sources = [
    { name: "Hacker News", url: "https://news.ycombinator.com/rss" },
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" }
  ];
  
  const items = [
    {
      title: "AI regulation developments",
      source: "Industry News",
      summary: "New policy proposals could impact AI deployments",
      urgency: "medium",
      action: "Read more"
    },
    {
      title: "Competitor product launch",
      source: "Competitor Watch",
      summary: "New feature release in your space",
      urgency: "medium",
      action: "Review"
    },
    {
      title: "Industry trend: autonomous agents",
      source: "Tech News",
      summary: "Major adoption of multi-agent systems",
      urgency: "low",
      action: "Monitor"
    }
  ];
  
  return items;
}

async function getEmail() {
  const appleScript = `
    tell application "Mail"
      set unreadMessages to {}
      set theDate to (current date) - (1 * days)
      try
        set recentUnread to (messages of inbox whose read status is false and date received > theDate)
        repeat with msg in recentUnread
          set msgSubject to subject of msg
          set msgSender to sender of msg
          set msgDate to date received of msg
          copy {subject:msgSubject, sender:msgSender, date:msgDate as text} to end of unreadMessages
          if (count of unreadMessages) ≥ 5 then exit repeat
        end repeat
      on error
        return "[]"
      end try
      return unreadMessages
    end tell
  `;
  
  try {
    const result = await runCommand("osascript", ["-e", appleScript], { timeoutMs: 10000 });
    if (result.code !== 0 || !result.stdout.trim()) {
      return [];
    }
    
    const messages = [];
    const lines = result.stdout.trim().split(/\r?\n/);
    for (const line of lines) {
      if (line.includes("subject:")) {
        const subjectMatch = line.match(/subject:\s*(.+?)(?:,\s*sender:|$)/i);
        const senderMatch = line.match(/sender:\s*(.+?)(?:,\s*date:|$)/i);
        if (subjectMatch) {
          messages.push({
            subject: subjectMatch[1].trim(),
            sender: senderMatch ? senderMatch[1].trim() : "Unknown",
            urgency: line.toLowerCase().includes("urgent") ? "high" : "medium"
          });
        }
      }
    }
    return messages.slice(0, 5);
  } catch {
    return [];
  }
}

function generateRecommendations({ tasks, calendar, news = [], email = [] }) {
  const recommendations = [];
  let rank = 1;
  
  if (email && email.length > 0) {
    for (const msg of email.slice(0, 2)) {
      recommendations.push({
        rank: rank++,
        title: `Email: ${msg.subject.slice(0, 50)}${msg.subject.length > 50 ? "..." : ""}`,
        reasoning: `From ${msg.sender}`,
        source: "email",
        urgency: msg.urgency,
        action: "Reply"
      });
    }
  }
  
  const urgentTasks = (tasks || []).filter(t => t.urgency === "high").slice(0, 2);
  for (const task of urgentTasks) {
    recommendations.push({
      rank: rank++,
      title: task.title,
      reasoning: `${task.daysAgo} days old — needs attention`,
      source: "tasks",
      urgency: task.urgency,
      action: "Start"
    });
  }
  
  if (calendar && calendar.length > 0) {
    const nextEvent = calendar[0];
    recommendations.push({
      rank: rank++,
      title: nextEvent.title,
      reasoning: `At ${nextEvent.time}`,
      source: "calendar",
      urgency: nextEvent.urgency,
      action: "Prepare"
    });
  }
  
  const mediumTasks = (tasks || []).filter(t => t.urgency === "medium").slice(0, 2);
  for (const task of mediumTasks) {
    recommendations.push({
      rank: rank++,
      title: task.title,
      reasoning: `${task.daysAgo} days old`,
      source: "tasks",
      urgency: task.urgency,
      action: "Schedule"
    });
  }
  
  if (news && news.length > 0 && rank <= 5) {
    recommendations.push({
      rank: rank,
      title: news[0].title,
      reasoning: news[0].summary.slice(0, 60) + "...",
      source: "news",
      urgency: news[0].urgency,
      action: news[0].action
    });
  }
  
  recommendations.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
  
  return recommendations.map((r, i) => ({ ...r, rank: i + 1 }));
}

async function main() {
  const sources = process.argv.slice(2);
  const enabledSources = sources.length > 0 ? sources : ["tasks", "calendar"];
  
  const data = {};
  
  if (enabledSources.includes("tasks")) {
    data.tasks = await getTasks();
  }
  if (enabledSources.includes("calendar")) {
    data.calendar = await getCalendar();
  }
  if (enabledSources.includes("news")) {
    data.news = await getNews();
  }
  if (enabledSources.includes("email")) {
    try {
      data.email = await getEmail();
    } catch (e) {
      data.email = [];
    }
  }
  
  const recommendations = generateRecommendations(data);
  const enabledSourceNames = Object.keys(data).filter(k => Array.isArray(data[k]));
  
  console.log(JSON.stringify({
    ok: true,
    sources: enabledSourceNames,
    recommendations,
    generatedAt: new Date().toISOString()
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }));
  process.exit(1);
});
