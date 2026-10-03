import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CaseResult = { id: string; expected: "BLOCKED" | "CONSEQUENCE" | "FAILED_CLOSED"; observed: "BLOCKED" | "CONSEQUENCE" | "FAILED_CLOSED"; passed: boolean; detail: string };
function stable(v: unknown): unknown { if (v === null || v === undefined) return v; if (Array.isArray(v)) return v.map(stable); if (typeof v === "object") { const o: Record<string, unknown> = {}; for (const k of Object.keys(v as Record<string, unknown>).sort()) o[k] = stable((v as Record<string, unknown>)[k]); return o; } return v; }
function canon(v: unknown) { return JSON.stringify(stable(v)); }
function hash(v: unknown) { return createHash("sha256").update(canon(v)).digest("hex"); }

export async function POST() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const payload = { consequence: "v114.synthetic.effect", target: "examined-boundary", amount: 1 };
  const now = Date.now();
  const receipt = (execute: unknown, decision = "PERMIT", issued = now - 1000, expires = now + 60_000) => {
    const unsigned = { version: "1.0.0", receipt_id: `v114-${hash({ execute, issued }).slice(0, 12)}`, decision, execute_hash: hash(execute), issued_at: new Date(issued).toISOString(), expires_at: new Date(expires).toISOString(), governance_evidence_persisted: true };
    return { ...unsigned, signature: sign(null, Buffer.from(canon(unsigned)), privateKey).toString("base64") };
  };
  const accepts = (execute: unknown, r: ReturnType<typeof receipt> | null, evidence = true) => {
    if (!evidence) return "FAILED_CLOSED" as const;
    if (!r || r.decision !== "PERMIT" || !r.governance_evidence_persisted) return "BLOCKED" as const;
    const { signature, ...unsigned } = r;
    if (!verify(null, Buffer.from(canon(unsigned)), publicKey, Buffer.from(signature, "base64"))) return "BLOCKED" as const;
    const t = Date.now(), issued = Date.parse(r.issued_at), expires = Date.parse(r.expires_at);
    if (!Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued || t < issued || t >= expires) return "BLOCKED" as const;
    if (hash(execute) !== r.execute_hash) return "BLOCKED" as const;
    return "CONSEQUENCE" as const;
  };
  const valid = receipt(payload);
  const forged = { ...valid, receipt_id: "forged", signature: Buffer.alloc(64, 7).toString("base64") };
  const refused = receipt(payload, "REFUSE");
  const expired = receipt(payload, "PERMIT", now - 120_000, now - 60_000);
  const tampered = { ...payload, amount: 999 };
  const specs: Array<[string, CaseResult["expected"], CaseResult["observed"], string]> = [
    ["receiptless_direct_bypass", "BLOCKED", accepts(payload, null), "Direct consequence attempt without Harmonic execution receipt"],
    ["forged_permit", "BLOCKED", accepts(payload, forged), "Forged PERMIT receipt presented to execution boundary"],
    ["valid_current_permit", "CONSEQUENCE", accepts(payload, valid), "Positive control: current signed PERMIT bound to exact payload"],
    ["payload_tamper_after_permit", "BLOCKED", accepts(tampered, valid), "Payload changed after authorization; execute hash no longer binds"],
    ["expired_permit", "BLOCKED", accepts(payload, expired), "Previously valid authority presented outside validity window"],
    ["governance_refusal", "BLOCKED", accepts(payload, refused), "Signed governance refusal cannot authorize consequence"],
    ["missing_governance_evidence", "FAILED_CLOSED", accepts(payload, valid, false), "Required persisted governance evidence unavailable"],
  ];
  const cases: CaseResult[] = specs.map(([id, expected, observed, detail]) => ({ id, expected, observed, passed: expected === observed, detail }));
  const consequenceCount = cases.filter(c => c.observed === "CONSEQUENCE").length;
  const falsifierTriggered = cases.some(c => c.id !== "valid_current_permit" && c.observed === "CONSEQUENCE");
  const positiveControlPassed = cases.find(c => c.id === "valid_current_permit")?.passed === true;
  const allExpected = cases.every(c => c.passed);
  const finding = !positiveControlPassed ? "UNRESOLVED" : falsifierTriggered || !allExpected ? "DEFEATED_FOR_EXAMINED_BOUNDARY" : "SUPPORTED_FOR_EXAMINED_BOUNDARY";
  return NextResponse.json({ examination: "V114 — Execution-Boundary Falsification", frozen_claim: "No effect-capable path within the examined execution boundary can produce the governed consequence without the required current Harmonic execution authorization.", falsifier: "Any tested bypass, forgery, tamper, stale permit, refusal, or missing-governance-evidence path produces the governed consequence.", finding, falsifier_triggered: falsifierTriggered, positive_control_passed: positiveControlPassed, consequence_count: consequenceCount, expected_consequence_count: 1, cases, boundary: "Synthetic constituted executor boundary in this harness; not a claim of exhaustive production infrastructure path enumeration.", generated_at: new Date().toISOString() });
}
