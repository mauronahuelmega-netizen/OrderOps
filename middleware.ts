import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/login",
    "/login/:path*",
    "/admin/:path*",
    "/b/:path*",
    "/commercial",
    "/commercial/:path*",
    "/promoter",
    "/promoter/:path*",
    "/super-admin",
    "/super-admin/:path*"
  ]
};
