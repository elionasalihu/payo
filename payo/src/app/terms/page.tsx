import type { Metadata } from "next";

import StaticPage, { LegalSection } from "@/components/auth/StaticPage";

export const metadata: Metadata = { title: "Terms of use · Payo" };

export default function TermsPage() {
  return (
    <StaticPage
      wide
      eyebrow="TERMS"
      title={
        <>
          Terms of <em>use.</em>
        </>
      }
    >
      <LegalSection title="About Payo">
        Payo is a university degree project for tracking shared expenses. It does not move money; it only records who
        paid what.
      </LegalSection>
      <LegalSection title="Your responsibility">
        You are responsible for the accuracy of the expenses you add and for settling debts with other members outside
        the app.
      </LegalSection>
      <LegalSection title="No warranty">Payo is provided as-is, without guarantees of availability or accuracy.</LegalSection>
    </StaticPage>
  );
}
