import { NextRequest, NextResponse } from "next/server";
import { requireHostedAccess } from "./lib/hosted-access";

export function middleware(req: NextRequest) {
  return requireHostedAccess(req) || NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  // The public UI must remain reachable through normal top-level navigation,
  // including links from other origins. Cross-site submission protection belongs
  // on API routes, not on the public page itself.
  matcher: ["/api/:path*"]
};
