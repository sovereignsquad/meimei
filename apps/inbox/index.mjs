/**
 * Inbox App
 * 
 * Email inbox for receiving and acting on messages
 * Issue: #563
 */

import { parseJsonResponse } from "../../dashboard/lib/llm.mjs";
import { inferenceCallOllama, inferenceSummarize } from "../../dashboard/lib/meimei-inference-client.mjs";
import brain from "../../dashboard/lib/brain/index.mjs";
import {
  getInboxMessages,
  getMessageById,
  markAsRead,
  flagMessage,
  getUnreadCount,
  isMailAvailable
} from "../../dashboard/lib/mail-adapter.mjs";

const META = {
  id: "inbox",
  name: "Inbox",
  description: "MeiMei's email inbox for receiving and acting on messages",
  category: "apps",
  issueId: "563"
};

async function handleApi(req, body, repoRoot) {
  const action = String(body.action || "list");
  const filter = String(body.filter || "all");
  const limit = Math.min(parseInt(body.limit) || 20, 100);
  const useAI = Boolean(body.useAI);

  if (action === "list") {
    return await listMessages(limit, filter, useAI, repoRoot);
  }

  if (action === "read") {
    return await readMessage(body.messageId, useAI, repoRoot);
  }

  if (action === "markRead") {
    return await markAsRead(body.messageId);
  }

  if (action === "flag") {
    return await flagMessage(body.messageId, Boolean(body.flagged !== false));
  }

  if (action === "status") {
    return await getMailStatus();
  }

  return { ok: false, error: `Unknown action: ${action}. Valid: list, read, markRead, flag, status` };
}

async function listMessages(limit, filter, useAI, repoRoot) {
  try {
    const mailAvailable = await isMailAvailable();

    if (mailAvailable) {
      const messages = await getInboxMessages({ limit, filter, includeBody: false });
      const unreadCount = await getUnreadCount();

      let prioritizedMessages = messages;

      if (useAI && messages.length > 0) {
        const messageSummaries = messages.slice(0, 5).map(m =>
          `From: ${m.from}\nSubject: ${m.subject}`
        ).join("\n\n");

        try {
          const priorityResult = await inferenceCallOllama(
            `Analyze these emails and suggest priorities. Return JSON with 'priorityOrder' array of indexes (0-4) from highest to lowest priority.\n\n${messageSummaries}`,
            { model: "qwen3.5:0.8b", maxTokens: 128, taskType: "classify" }
          );

          const parsed = parseJsonResponse(priorityResult.response);
          if (parsed && parsed.priorityOrder) {
            prioritizedMessages = [...messages].sort((a, b) => {
              const aIdx = messages.indexOf(a) % 5;
              const bIdx = messages.indexOf(b) % 5;
              const aPriority = parsed.priorityOrder.indexOf(aIdx);
              const bPriority = parsed.priorityOrder.indexOf(bIdx);
              return aPriority - bPriority;
            });
          }
        } catch {
          // Continue with default order
        }
      }

      await brain.log(repoRoot, `Fetched ${messages.length} emails from Mail`).catch(() => {});

      return {
        ok: true,
        messages: prioritizedMessages,
        total: messages.length,
        unread: unreadCount,
        source: "mail",
        aiEnhanced: useAI
      };
    } else {
      return {
        ok: true,
        messages: [],
        total: 0,
        unread: 0,
        source: "none",
        warning: "Mail app is not running. Open Mail.app to see real emails."
      };
    }
  } catch (error) {
    return {
      ok: false,
      messages: [],
      total: 0,
      unread: 0,
      source: "none",
      error: "Could not fetch emails: " + error.message
    };
  }
}

async function readMessage(messageId, useAI, repoRoot) {
  try {
    const mailAvailable = await isMailAvailable();

    if (mailAvailable && messageId && messageId.includes("@")) {
      const message = await getMessageById(messageId);
      if (message) {
        await markAsRead(messageId);

        let summary = null;
        if (useAI && message.body) {
          try {
            const summaryResult = await inferenceSummarize(message.body.substring(0, 2000));
            summary = summaryResult.response;
          } catch {
            // Continue without summary
          }
        }

        return { ok: true, message, summary, source: "mail" };
      }
    }
  } catch {
    // Fall through to error
  }

  return { ok: false, error: "Could not read message" };
}

async function getMailStatus() {
  const mailAvailable = await isMailAvailable();
  const unread = mailAvailable ? await getUnreadCount() : -1;
  return {
    ok: true,
    available: mailAvailable,
    unreadCount: unread
  };
}

export { META, handleApi };
