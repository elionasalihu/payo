import StaticPage from "@/components/auth/StaticPage";

export default function NotFound() {
  return (
    <StaticPage
      eyebrow="ERROR 404"
      title={
        <>
          This page doesn’t <em>exist.</em>
        </>
      }
      subtitle="The link may be broken, or the page may have moved."
    />
  );
}
