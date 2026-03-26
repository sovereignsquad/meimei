# Handoff Artifact Schema and Stage-Gate Enforcement v1

Issue: `mvp-factory-control#706`

## Purpose

Define one structured handoff artifact schema and enforceable stage-gate rules for sovereign delivery flow in `agent.meimei`.

## Required Artifact Shape

Each delivery handoff artifact must conform to this schema:

```json
{
  "version": "v1",
  "workItem": {
    "id": "mvp-factory-control#706",
    "title": "Handoff artifact schema and stage-gate enforcement"
  },
  "fromRole": "implementer",
  "toRole": "reviewer",
  "stage": "review",
  "objective": "One-sentence outcome objective",
  "scope": {
    "in": ["..."],
    "out": ["..."]
  },
  "acceptanceChecks": [
    { "id": "A1", "text": "check text", "status": "pass" }
  ],
  "evidence": {
    "commit": "abcdef1",
    "files": ["README.md"],
    "validation": [
      {
        "command": "npm run handoff:validate -- handoffs/sample.v1.json",
        "result": "pass"
      }
    ]
  },
  "risks": ["residual risk note"],
  "openQuestions": [],
  "gate": {
    "decision": "pass",
    "blockedBy": []
  },
  "timestamp": "2026-03-26T15:00:00Z"
}
```

## Field Rules

- `version` must be `v1`.
- `workItem.id` must be non-empty and include source issue reference.
- `fromRole` and `toRole` must be one of:
  - `planner`
  - `architect`
  - `implementer`
  - `reviewer`
  - `tester`
  - `releaser`
  - `oc`
- `stage` must be one of:
  - `planning`
  - `design`
  - `implementation`
  - `review`
  - `testing`
  - `release`
- `objective` must be non-empty.
- `scope.in` and `scope.out` must be arrays.
- `acceptanceChecks` must include at least one item.
- `acceptanceChecks[].status` must be one of `pass`, `fail`, `pending`.
- `evidence.commit` must be non-empty for implementation/review/testing/release stages.
- `evidence.files` must include all touched surfaces.
- `gate.decision` must be one of `pass`, `fail`, `blocked`.
- `timestamp` must be ISO-like string.

## Stage-Gate Enforcement Rules

Hard rules:

1. `gate.decision=pass` is invalid if any acceptance check is `fail`.
2. `stage=release` requires all acceptance checks `pass`.
3. `stage=release` requires empty `gate.blockedBy`.
4. `fromRole` cannot equal `toRole`.
5. `fromRole=implementer` and `toRole=reviewer` requires non-empty commit and files evidence.
6. If `gate.decision=blocked`, `gate.blockedBy` must be non-empty.

## Validation Command

Run:

- `npm run handoff:validate -- handoffs/sample.stage-gate.v1.json`

## Acceptance Checklist

- [ ] schema is explicit and reusable
- [ ] required fields and enums are deterministic
- [ ] stage-gate rules are machine-checkable
- [ ] validation command is documented
- [ ] sample artifact demonstrates expected shape
