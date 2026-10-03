import { NextResponse } from "next/server";

// The harness is publicly accessible. Reject cross-site browser submissions
// without requiring credentials from visitors or exposing server API keys.
export function requireHostedAccess(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "cross_origin_request_rejected" }, { status: 403 });
  }
  return null;
}
