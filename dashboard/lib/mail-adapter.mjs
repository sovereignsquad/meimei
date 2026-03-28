import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function runAppleScript(script) {
  try {
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 30000
    });
    return stdout.trim();
  } catch (error) {
    throw new Error(`AppleScript error: ${error.message}`);
  }
}

async function getMailAccounts() {
  const script = `
    tell application "Mail"
      set accountList to {}
      repeat with acc in accounts
        set end of accountList to name of acc
      end repeat
      return accountList as string
    end tell
  `;
  
  try {
    const result = await runAppleScript(script);
    return result ? result.split(", ") : [];
  } catch {
    return [];
  }
}

async function getInboxMessages(options = {}) {
  const { 
    limit = 20, 
    filter = "all",
    account = null,
    includeBody = false 
  } = options;
  
  const messages = [];
  
  try {
    let script = `
      tell application "Mail"
        set msgCount to 0
        set msgList to {}
    `;
    
    if (account) {
      script += `
        set targetAccount to mailbox "${account}" of account "${account}"
      `;
    } else {
      script += `
        set targetAccount to inbox
      `;
    }
    
    script += `
        repeat with msg in (every message of targetAccount)
          set msgCount to msgCount + 1
          if msgCount > ${limit} then exit repeat
          
          set msgRead to read status of msg
          set msgFlagged to flagged status of msg
          
          if (("${filter}" is "unread" and msgRead is true) or ("${filter}" is "flagged" and msgFlagged is false)) then
            set msgCount to msgCount - 1
          else
            set msgSender to sender of msg
            set msgSubject to subject of msg
            set msgDate to date received of msg
            set msgID to message id of msg
            ${includeBody ? 'set msgContent to content of msg' : 'set msgContent to ""'}
            
            set msgEntry to msgID & "|||" & msgSender & "|||" & msgSubject & "|||" & msgDate as string
            set end of msgList to msgEntry
          end if
        end repeat
        
        return msgList as string
      end tell
    `;
    
    const result = await runAppleScript(script);
    
    if (!result) return messages;
    
    const entries = result.includes("|||") ? result.split("|||") : [];
    
    for (let i = 0; i < entries.length; i += 4) {
      if (i + 3 < entries.length) {
        messages.push({
          id: entries[i],
          from: entries[i + 1],
          subject: entries[i + 2],
          date: entries[i + 3],
          read: true,
          flagged: false,
          body: includeBody ? entries[i + 4] || "" : ""
        });
      }
    }
    
    return messages;
  } catch (error) {
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

async function getMessageById(messageId) {
  try {
    const script = `
      tell application "Mail"
        set targetMsg to message id "${messageId}"
        set msgSender to sender of targetMsg
        set msgSubject to subject of targetMsg
        set msgDate to date received of targetMsg
        set msgContent to content of targetMsg
        set msgRead to read status of targetMsg
        set msgFlagged to flagged status of targetMsg
        
        return msgSender & "|||" & msgSubject & "|||" & msgDate & "|||" & msgRead & "|||" & msgFlagged & "|||" & msgContent
      end tell
    `;
    
    const result = await runAppleScript(script);
    const parts = result.split("|||");
    
    if (parts.length >= 6) {
      return {
        id: messageId,
        from: parts[0],
        subject: parts[1],
        date: parts[2],
        read: parts[3] === "true",
        flagged: parts[4] === "true",
        body: parts.slice(5).join("|||")
      };
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to fetch message: ${error.message}`);
  }
}

async function markAsRead(messageId) {
  try {
    const script = `
      tell application "Mail"
        set targetMsg to message id "${messageId}"
        set read status of targetMsg to true
      end tell
    `;
    
    await runAppleScript(script);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function flagMessage(messageId, flagged = true) {
  try {
    const script = `
      tell application "Mail"
        set targetMsg to message id "${messageId}"
        set flagged status of targetMsg to ${flagged}
      end tell
    `;
    
    await runAppleScript(script);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function deleteMessage(messageId) {
  try {
    const script = `
      tell application "Mail"
        set targetMsg to message id "${messageId}"
        delete targetMsg
      end tell
    `;
    
    await runAppleScript(script);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function getUnreadCount() {
  try {
    const script = `
      tell application "Mail"
        return (unread count of inbox) as string
      end tell
    `;
    
    const result = await runAppleScript(script);
    return parseInt(result) || 0;
  } catch {
    return 0;
  }
}

async function isMailAvailable() {
  try {
    const script = `
      tell application "System Events"
        return (exists (process "Mail")) as string
      end tell
    `;
    
    const result = await runAppleScript(script);
    return result === "true";
  } catch {
    return false;
  }
}

function appleScriptEscapeLine(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, " ");
}

/** AppleScript expression for email body (concat lines with return). */
function appleScriptMultilineBody(body) {
  const lines = String(body || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .slice(0, 120);
  if (lines.length === 0) return '""';
  return lines.map((line) => `"${appleScriptEscapeLine(line)}"`).join(" & return & ");
}

/**
 * Open Apple Mail with a new outgoing message (operator reviews and sends). SDR #654.
 */
async function createOutgoingDraft({ to, subject, body }) {
  const email = String(to || "").trim();
  const subj = String(subject || "").trim().slice(0, 998);
  const bod = String(body || "").trim().slice(0, 32000);
  if (!email || !subj) {
    throw new Error("Recipient and subject are required.");
  }
  const subjLit = `"${appleScriptEscapeLine(subj)}"`;
  const bodyExpr = appleScriptMultilineBody(bod || " ");
  const toLit = `"${appleScriptEscapeLine(email)}"`;
  const script = `
tell application "Mail"
  set theSubj to ${subjLit}
  set theBody to ${bodyExpr}
  set m to make new outgoing message with properties {subject:theSubj, content:theBody, visible:true}
  tell m
    make new to recipient at end of to recipients with properties {address:${toLit}}
  end tell
  activate
end tell
`;
  await runAppleScript(script);
  return { ok: true };
}

export {
  getMailAccounts,
  getInboxMessages,
  getMessageById,
  markAsRead,
  flagMessage,
  deleteMessage,
  getUnreadCount,
  isMailAvailable,
  createOutgoingDraft
};
