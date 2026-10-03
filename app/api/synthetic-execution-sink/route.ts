import { createHash, verify } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stableSort(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stableSort);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) out[key] = stableSort((value as Record<string, unknown>)[key]);
    return out;
  }
  return value;
}
function canonicalize(value: unknown) { return JSON.stringify(stableSort(value)); }
function sha256(value: string) { return createHash("sha256").update(value, "utf8").digest("hex"); }
function decodeReceipt(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  }
  catch { return null; }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { intent?: unknown; execute?: unknown } | null;
  if (!body || !body.execute) return NextResponse.json({ error: "missing_execute_payload" }, { status: 400 });

  const receiptHeader = req.headers.get("x-harmonic-execution-receipt") || req.headers.get("x-solace-receipt");
  const receipt = decodeReceipt(receiptHeader);
  if (!receipt) return NextResponse.json({ error: "missing_or_invalid_harmonic_execution_receipt" }, { status: 401 });

  const publicKey = process.env.HARMONIC_SECURE_EXECUTION_PUBLIC_KEY_PEM;
  if (!publicKey) return NextResponse.json({ error: "sink_receipt_public_key_not_configured" }, { status: 503 });
  if (receipt.version !== "1.0.0" || receipt.decision !== "PERMIT" || !receipt.signature) {
    return NextResponse.json({ error: "receipt_not_execution_permit" }, { status: 403 });
  }

  const issuedAt = new Date(String(receipt.issued_at || ""));
  const expiresAt = new Date(String(receipt.expires_at || ""));
  const now = Date.now();
  if (!Number.isFinite(issuedAt.getTime()) || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= issuedAt.getTime() || now < issuedAt.getTime() || now >= expiresAt.getTime()) {
    return NextResponse.json({ error: "receipt_outside_validity_window" }, { status: 403 });
  }

  const { signature, ...unsigned } = receipt;
  let signatureValid = false;
  try {
    signatureValid = verify(null, Buffer.from(canonicalize(unsigned), "utf8"), publicKey, Buffer.from(String(signature), "base64"));
  } catch {
    return NextResponse.json({ error: "invalid_receipt_signature" }, { status: 403 });
  }
  if (!signatureValid) return NextResponse.json({ error: "invalid_receipt_signature" }, { status: 403 });

  const executeHash = sha256(canonicalize(body.execute));
  if (executeHash !== receipt.execute_hash) return NextResponse.json({ error: "execute_hash_mismatch" }, { status: 403 });

  const effect = {
    effect_observed: true,
    effect_type: "synthetic_successor_consequence",
    execute_hash: executeHash,
    receipt_id: receipt.receipt_id || null,
    observed_at: new Date().toISOString()
  };
  return NextResponse.json({ ok: true, ...effect, effect_receipt_hash: sha256(canonicalize(effect)) });
}
