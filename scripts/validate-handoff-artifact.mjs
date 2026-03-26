#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const allowedRoles = new Set([
  "planner",
  "architect",
  "implementer",
  "reviewer",
  "tester",
  "releaser",
  "oc"
]);

const allowedStages = new Set([
  "planning",
  "design",
  "implementation",
  "review",
  "testing",
  "release"
]);

const allowedCheckStatus = new Set(["pass", "fail", "pending"]);
const allowedGateDecision = new Set(["pass", "fail", "blocked"]);

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`PASS: ${message}`);
}

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${field} must be a non-empty string`);
    return false;
  }
  return true;
}

function assertArray(value, field, min = 0) {
  if (!Array.isArray(value) || value.length < min) {
    fail(`${field} must be an array with at least ${min} item(s)`);
    return false;
  }
  return true;
}

function validate(data) {
  if (!isObject(data)) {
    fail("artifact must be a JSON object");
    return;
  }

  if (data.version !== "v1") {
    fail('version must be "v1"');
  }

  if (!isObject(data.workItem)) {
    fail("workItem must be an object");
  } else {
    assertNonEmptyString(data.workItem.id, "workItem.id");
    assertNonEmptyString(data.workItem.title, "workItem.title");
  }

  if (!assertNonEmptyString(data.fromRole, "fromRole")) return;
  if (!assertNonEmptyString(data.toRole, "toRole")) return;

  if (!allowedRoles.has(data.fromRole)) {
    fail(`fromRole must be one of: ${Array.from(allowedRoles).join(", ")}`);
  }
  if (!allowedRoles.has(data.toRole)) {
    fail(`toRole must be one of: ${Array.from(allowedRoles).join(", ")}`);
  }
  if (data.fromRole === data.toRole) {
    fail("fromRole cannot equal toRole");
  }

  if (!assertNonEmptyString(data.stage, "stage")) return;
  if (!allowedStages.has(data.stage)) {
    fail(`stage must be one of: ${Array.from(allowedStages).join(", ")}`);
  }

  assertNonEmptyString(data.objective, "objective");

  if (!isObject(data.scope)) {
    fail("scope must be an object");
  } else {
    assertArray(data.scope.in, "scope.in");
    assertArray(data.scope.out, "scope.out");
  }

  if (assertArray(data.acceptanceChecks, "acceptanceChecks", 1)) {
    data.acceptanceChecks.forEach((check, idx) => {
      const base = `acceptanceChecks[${idx}]`;
      if (!isObject(check)) {
        fail(`${base} must be an object`);
        return;
      }
      assertNonEmptyString(check.id, `${base}.id`);
      assertNonEmptyString(check.text, `${base}.text`);
      if (!allowedCheckStatus.has(check.status)) {
        fail(`${base}.status must be one of: pass, fail, pending`);
      }
    });
  }

  if (!isObject(data.evidence)) {
    fail("evidence must be an object");
  } else {
    const needsCommitEvidence = new Set([
      "implementation",
      "review",
      "testing",
      "release"
    ]).has(data.stage);
    if (needsCommitEvidence) {
      assertNonEmptyString(data.evidence.commit, "evidence.commit");
      assertArray(data.evidence.files, "evidence.files", 1);
    }
  }

  if (Array.isArray(data.risks) === false) {
    fail("risks must be an array");
  }
  if (Array.isArray(data.openQuestions) === false) {
    fail("openQuestions must be an array");
  }

  if (!isObject(data.gate)) {
    fail("gate must be an object");
  } else {
    if (!allowedGateDecision.has(data.gate.decision)) {
      fail("gate.decision must be one of: pass, fail, blocked");
    }
    if (!Array.isArray(data.gate.blockedBy)) {
      fail("gate.blockedBy must be an array");
    }
  }

  assertNonEmptyString(data.timestamp, "timestamp");

  // Stage-gate enforcement rules.
  const checks = Array.isArray(data.acceptanceChecks) ? data.acceptanceChecks : [];
  const hasFailingCheck = checks.some((c) => c?.status === "fail");
  const allChecksPass = checks.length > 0 && checks.every((c) => c?.status === "pass");
  const blockedBy = Array.isArray(data?.gate?.blockedBy) ? data.gate.blockedBy : [];

  if (data?.gate?.decision === "pass" && hasFailingCheck) {
    fail('gate.decision "pass" is invalid when any acceptanceChecks.status is "fail"');
  }
  if (data.stage === "release" && !allChecksPass) {
    fail('stage "release" requires all acceptanceChecks.status values to be "pass"');
  }
  if (data.stage === "release" && blockedBy.length > 0) {
    fail('stage "release" requires gate.blockedBy to be empty');
  }
  if (data?.gate?.decision === "blocked" && blockedBy.length === 0) {
    fail('gate.decision "blocked" requires non-empty gate.blockedBy');
  }
  if (
    data.fromRole === "implementer" &&
    data.toRole === "reviewer" &&
    (!assertNonEmptyString(data?.evidence?.commit, "evidence.commit") ||
      !assertArray(data?.evidence?.files, "evidence.files", 1))
  ) {
    fail("implementer -> reviewer handoff requires commit and file evidence");
  }
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/validate-handoff-artifact.mjs <path-to-artifact.json>");
    process.exit(1);
  }

  const targetPath = path.isAbsolute(arg) ? arg : path.resolve(repoRoot, arg);
  const raw = await readFile(targetPath, "utf8");
  const data = JSON.parse(raw);

  validate(data);
  if (process.exitCode) return;
  ok(`Validated handoff artifact: ${path.relative(repoRoot, targetPath)}`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
