import { NextResponse } from "next/server";

// The harness is publicly accessible. Safe top-level/browser reads must remain
// reachable from links on other sites. Reject only cross-site state-changing
// submissions, without requiring visitor credentials or exposing server API keys.
export function requireHostedAccess(req: Request): NextResponse | null {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = req.headers.get("origin");
  if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "cross_origin_request_rejected" }, { status: 403 });
  }
  return null;
}
