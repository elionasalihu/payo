import type { Metadata } from "next";

import StaticPage from "@/components/auth/StaticPage";

export const metadata: Metadata = { title: "Offline · Payo" };

// Shown by the service worker (public/sw.js) when a page that was never
// cached is opened without a connection.
export default function OfflinePage() {
  return (
    <StaticPage
      eyebrow="OFFLINE"
      title={
        <>
          You’re <em>offline.</em>
        </>
      }
      subtitle="This page hasn’t been opened on this device before, so it isn’t available offline. Reconnect to load your groups and balances; adding or changing expenses needs a connection."
    />
  );
}
