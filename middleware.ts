import { NextRequest, NextResponse } from "next/server";
import { requireHostedAccess } from "./lib/hosted-access";

export function middleware(req: NextRequest) {
  return requireHostedAccess(req) || NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/", "/api/:path*"]
};
