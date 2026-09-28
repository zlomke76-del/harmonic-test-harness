export type SemanticPreloadFinding = {
  path: string;
  kind: "field" | "value";
  match: string;
};

const BANNED_FIELD_NAMES = new Set([
  "revalidation_required",
  "prior_state_status",
  "standing_status",
  "standing_preserved",
  "standing_defeated",
  "admissibility_status",
  "expected_decision",
  "expected_outcome"
]);

// Examination-only integrity vocabulary. This does not decide governance.
// It prevents the successor specimen from carrying the standing significance
// that the examined boundary is supposed to derive.
const BANNED_VALUE_PATTERNS: Array<[string, RegExp]> = [
  ["standing", /\bstanding\b/i],
  ["revalidation", /\brevalidat(?:e|ed|es|ing|ion|required)\b/i],
  ["superseded", /\bsupersed(?:e|ed|es|ing)\b/i],
  ["material contradiction", /\bmaterial(?:ly)?\s+contradict(?:ion|ory|s|ed|ing)?\b/i],
  ["standing-preserving", /\b(?:preserv(?:e|ed|es|ing)|defeat(?:ed|s|ing)?)\b[\s_-]*(?:the\s+)?\bstanding\b/i],
  ["invalidated reliance", /\binvalidat(?:e|ed|es|ing|ion)\b[\s\S]{0,80}\breliance\b/i],
  ["non-current prior state", /\b(?:non[_ -]?current|not[_ -]?current)\b[\s\S]{0,80}\b(?:prior\s+)?state\b/i]
];

export function auditStandingSemanticPreload(value: unknown): SemanticPreloadFinding[] {
  const findings: SemanticPreloadFinding[] = [];

  function walk(node: unknown, path: string) {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        const childPath = path ? `${path}.${key}` : key;
        if (BANNED_FIELD_NAMES.has(key.toLowerCase())) {
          findings.push({ path: childPath, kind: "field", match: key });
        }
        walk(child, childPath);
      }
      return;
    }
    if (typeof node === "string") {
      for (const [label, pattern] of BANNED_VALUE_PATTERNS) {
        if (pattern.test(node)) findings.push({ path, kind: "value", match: label });
      }
    }
  }

  walk(value, "packet");
  return findings;
}
