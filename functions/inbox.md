# Inbox — Miniapp Contract

Status: Draft  
Miniapp ID: `inbox`  
Issue: `mvp-factory-control#563`

## Product Contract

**What it does:** Gives MeiMei a dedicated email inbox for receiving, reviewing, and acting on email messages.

**Why it matters:** Enables MeiMei to receive work programmatically, making it a real assistant that can handle email as a first-class workflow.

## Input

```json
{
  "required": [],
  "optional": ["action", "messageId", "filter", "limit"],
  "examples": [
    {},
    { "action": "list", "limit": 20 },
    { "action": "read", "messageId": "msg_abc123" },
    { "action": "draft", "to": "john@example.com", "subject": "Follow-up", "body": "Hi John, ..." }
  ]
}
```

### Actions

| Action | Description |
|--------|-------------|
| `list` | Get recent messages |
| `read` | Read a specific message |
| `draft` | Create a draft reply |
| `archive` | Archive a message |

## Output

```json
{
  "ok": true,
  "messages": [
    {
      "id": "msg_abc123",
      "from": "Jane Doe <jane@example.com>",
      "subject": "Meeting tomorrow",
      "preview": "Hi, I wanted to follow up on...",
      "date": "2026-03-27T10:30:00Z",
      "read": false,
      "priority": "normal"
    }
  ],
  "total": 15,
  "unread": 3
}
```

## Safety & Constraints

- `untrustedInput`: false (internal workflow)
- `allowedProtocols`: []
- AppleScript for macOS mail client integration

## Capabilities

- `channels`: ["dashboard", "api"]
- `sideEffects`: ["apple-script", "local-file-write"]
- `requiresApproval`: true (for sending/replying)

## Failure Model

| Failure | Behavior |
|---------|----------|
| Mail not accessible | Clear error with permission instructions |
| Message not found | Return empty with error message |
| Send failed | Return failure with reason |

## Settings

- Inbox email address configuration
- Sync frequency
- Notification preferences
- Auto-archive rules
