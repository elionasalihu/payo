import type { NextConfig } from "next";

// Payo is a client-rendered app: every page loads the signed-in user's data in the
// browser from Supabase (protected by Row Level Security). Server-side caching features
// (cacheComponents / partialPrefetching from the create-next-app template) are therefore
// not used. Next.js still prerenders each page's HTML shell at build time.
const nextConfig: NextConfig = {
  // Hide the "N" development indicator (only shown in `npm run dev`).
  // Compile and runtime errors are still shown in development.
  devIndicators: false,
  // Supabase settings. The NEXT_PUBLIC_* names are preferred; the old Create React App
  // names (REACT_APP_*) from an existing .env file are accepted as a fallback.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || "",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // The service worker itself must never be cached, so updates are picked up.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
