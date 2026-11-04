import type { MetadataRoute } from "next";

// Web app manifest, served by Next.js at /manifest.webmanifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    short_name: "Payo",
    name: "Payo — Shared expenses",
    description: "Split shared expenses with family, flatmates and small groups. See balances and settle up.",
    lang: "en",
    dir: "ltr",
    start_url: "/client?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    theme_color: "#111827",
    background_color: "#f8f9f7",
    categories: ["finance", "productivity", "lifestyle"],
    icons: [
      { src: "/favicon.ico", sizes: "64x64 48x48 32x32 16x16", type: "image/x-icon" },
      { src: "/logo192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Add expense", short_name: "Add", url: "/client?add=expense", icons: [{ src: "/logo192.png", sizes: "192x192" }] },
      { name: "Monthly summary", short_name: "Summary", url: "/client/summary", icons: [{ src: "/logo192.png", sizes: "192x192" }] },
      { name: "Groups", url: "/client/groups", icons: [{ src: "/logo192.png", sizes: "192x192" }] },
    ],
  };
}
