import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Enforce inside credential-bearing routes, independently of middleware.
export function requireHostedAccess(req: Request): NextResponse | null {
  const password = process.env.HARNESS_ACCESS_PASSWORD;
  if (!password && process.env.NODE_ENV !== "production") return null;
  if (!password || password.length < 24) {
    return NextResponse.json({ error: "hosted_access_not_configured" }, { status: 503 });
  }
  const header = req.headers.get("authorization") || "";
  let supplied = "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    if (colon >= 0 && decoded.slice(0, colon) === "harness") supplied = decoded.slice(colon + 1);
  }
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!supplied || !timingSafeEqual(digest(supplied), digest(password))) {
    return NextResponse.json({ error: "hosted_access_required" }, {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Harmonic Harness", charset="UTF-8"', "Cache-Control": "no-store" }
    });
  }
  // Cross-origin browser requests must not spend the host's credentials.
  const origin = req.headers.get("origin");
  if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "cross_origin_request_rejected" }, { status: 403 });
  }
  return null;
}
