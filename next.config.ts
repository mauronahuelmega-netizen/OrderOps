import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DEV-only: allow HMR /_next/* from LAN phone (restart `npm run dev` after change).
  allowedDevOrigins: ["192.168.100.28"],
  images: {
    // Global custom loader; ProductCard also passes loader={getSupabaseImageLoader}
    // so Supabase render URLs are used even if this config is ignored in dev.
    loader: "custom",
    loaderFile: "./lib/supabase/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**"
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/render/image/public/**"
      }
    ]
  }
};

export default nextConfig;
