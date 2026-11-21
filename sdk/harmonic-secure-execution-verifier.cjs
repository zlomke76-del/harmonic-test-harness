const crypto = require("crypto");

function stableSort(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stableSort);
  if (typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stableSort(value[key]);
    return out;
  }
  return value;
}

function canonicalize(value) {
  return JSON.stringify(stableSort(value));
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function computeExecuteHash(execute) {
  return sha256Hex(canonicalize(execute));
}

function decodeReceiptHeader(value) {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(String(value), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function verifyHarmonicExecutionRequest({ receiptHeader, receiptPublicKeyPem, expectedService, execute, now = new Date(), clockSkewSeconds = 10 }) {
  const receipt = decodeReceiptHeader(receiptHeader);
  if (!receipt) return { ok: false, reason: "missing_or_invalid_receipt_header" };
  if (receipt.version !== "1.0.0") return { ok: false, reason: "invalid_receipt_version" };
  if (receipt.decision !== "PERMIT") return { ok: false, reason: "receipt_not_permit" };
  if (receipt.service !== expectedService) return { ok: false, reason: "receipt_service_mismatch" };
  if (!receiptPublicKeyPem) return { ok: false, reason: "missing_receipt_public_key" };
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) || !Number.isFinite(clockSkewSeconds) || clockSkewSeconds < 0) return { ok: false, reason: "invalid_verification_clock" };
  if (!receipt.signature) return { ok: false, reason: "missing_receipt_signature" };

  const issuedAt = new Date(receipt.issued_at);
  const expiresAt = new Date(receipt.expires_at);
  if (Number.isNaN(issuedAt.getTime()) || Number.isNaN(expiresAt.getTime())) return { ok: false, reason: "invalid_receipt_time_fields" };
  if (expiresAt <= issuedAt) return { ok: false, reason: "invalid_receipt_time_fields" };
  if (now.getTime() + clockSkewSeconds * 1000 < issuedAt.getTime()) return { ok: false, reason: "receipt_not_yet_valid" };
  if (now.getTime() - clockSkewSeconds * 1000 > expiresAt.getTime()) return { ok: false, reason: "receipt_expired" };

  const { signature, ...unsigned } = receipt;
  let validSignature;
  try {
  validSignature = crypto.verify(
    null,
    Buffer.from(canonicalize(unsigned), "utf8"),
    receiptPublicKeyPem,
    Buffer.from(signature, "base64")
  );
  } catch { return { ok: false, reason: "invalid_receipt_signature" }; }
  if (!validSignature) return { ok: false, reason: "invalid_receipt_signature" };

  const executeHash = computeExecuteHash(execute);
  if (executeHash !== receipt.execute_hash) return { ok: false, reason: "execute_hash_mismatch" };
  return { ok: true, receipt, executeHash };
}

module.exports = { decodeReceiptHeader, verifyHarmonicExecutionRequest };
