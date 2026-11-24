import type { Metadata } from "next";

import StaticPage, { LegalSection } from "@/components/auth/StaticPage";

export const metadata: Metadata = { title: "Privacy policy · Payo" };

export default function PrivacyPage() {
  return (
    <StaticPage
      wide
      eyebrow="PRIVACY"
      title={
        <>
          Privacy <em>policy.</em>
        </>
      }
    >
      <LegalSection title="What we store">
        Your name, email address, and the groups, expenses and payments you and your group members add. Passwords are
        handled by Supabase Auth and are never visible to Payo.
      </LegalSection>
      <LegalSection title="Who can see it">
        Only members of a group can see that group’s expenses, balances and members. Platform administrators can view
        data to keep the service running.
      </LegalSection>
      <LegalSection title="Deleting your data">
        You can leave any group at any time. To delete your account entirely, contact the project team.
      </LegalSection>
    </StaticPage>
  );
}
