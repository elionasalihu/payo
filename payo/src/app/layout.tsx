import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import Providers from "./providers";
import "./globals.css";

// Fonts are self-hosted (src/app/fonts) so they also load offline.
const manrope = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-space-grotesk",
  weight: "300 700",
  display: "swap",
});
const plusJakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-plus-jakarta",
  weight: "200 800",
  display: "swap",
});
const dmMono = localFont({
  src: [
    { path: "./fonts/dm-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/dm-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Payo — Shared expenses, kept simple",
  description: "Payo helps families, flatmates and small groups split shared expenses, see balances and settle up.",
  applicationName: "Payo",
  appleWebApp: { capable: true, title: "Payo", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Capture the browser's install prompt as early as possible
// (it can fire before React has hydrated). Read by PwaProvider.
const installPromptScript = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__payoInstallPrompt=e;window.dispatchEvent(new Event("payo:installable"));});`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} ${plusJakarta.variable} ${dmMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: installPromptScript }} />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run Payo.</noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
