import { NextResponse } from "next/server";
import { buildAdminWebAppManifest } from "@/lib/admin/pwa-manifest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const manifest = buildAdminWebAppManifest();
    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control":
          "public, max-age=300, s-maxage=300, stale-while-revalidate=86400"
      }
    });
  } catch {
    return NextResponse.json(
      { error: "manifest_unavailable" },
      { status: 500 }
    );
  }
}