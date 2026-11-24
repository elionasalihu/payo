import Link from "next/link";

// Shared by client pages (login, register...) and server pages (legal, 404, offline),
// so this file must NOT be a "use client" module.

/** Classes shared by the login, register, password, legal and 404 pages. */
export const auth = {
  page: "grid min-h-screen grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-payo-bg font-sans text-payo-ink max-[900px]:grid-cols-1",
  pageSingle: "grid min-h-screen grid-cols-1 bg-payo-bg font-sans text-payo-ink",
  formSide: "flex flex-col px-10 pt-7 pb-8 max-[900px]:px-4 max-[900px]:pt-[22px] max-[900px]:pb-7",
  top: "flex h-11 items-center",
  card: "m-auto w-full max-w-[420px] py-10 max-[480px]:py-7",
  eyebrow: "mb-3 block text-[11px] font-extrabold tracking-[0.13em] text-payo-green",
  h1: "m-0 text-[clamp(30px,3.4vw,40px)] leading-[1.05] font-medium tracking-[-0.05em] [&_em]:font-display [&_em]:font-semibold [&_em]:text-payo-green [&_em]:not-italic",
  subtitle: "mt-3 mb-0 text-sm leading-[1.55] font-medium text-payo-muted",
  form: "mt-[30px] flex flex-col gap-4",
  field: "flex flex-col gap-[7px]",
  fieldLabel: "text-xs font-bold text-payo-text",
  input:
    "h-[46px] w-full rounded-[10px] border border-payo-border bg-white px-3.5 text-sm font-medium text-payo-ink outline-none transition-[border-color,box-shadow] duration-[160ms] placeholder:text-[#b4bcc8] focus:border-payo-green focus:shadow-[0_0_0_3px_rgba(32,184,107,0.14)]",
  grid: "grid grid-cols-2 gap-3 max-[480px]:grid-cols-1",
  passwordToggle:
    "absolute top-1/2 right-1.5 flex size-[34px] -translate-y-1/2 items-center justify-center rounded-lg text-payo-light hover:bg-[#f5f6f4] hover:text-payo-ink",
  inlineLink: "text-xs font-semibold text-payo-muted no-underline hover:text-payo-green-dark",
  submit:
    "mt-1.5 inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-payo-ink text-sm font-bold text-white no-underline transition-[background,transform] duration-[180ms] enabled:hover:-translate-y-px enabled:hover:bg-[#1d2636] disabled:cursor-progress disabled:opacity-65",
  fineprint: "m-0 text-center text-[11px] font-medium text-payo-light",
  success: "mt-[26px] flex gap-3.5 rounded-xl border border-payo-border bg-white p-[18px] [&>p]:m-0 [&>p]:text-sm [&>p]:leading-[1.55] [&>p]:text-payo-text",
  successIcon: "flex size-[42px] flex-[0_0_42px] items-center justify-center rounded-[10px] bg-payo-green-soft text-payo-green-dark",
};


export function PayoWordmark({ to = "/" }: { to?: string }) {
  return (
    <Link
      href={to}
      className="inline-flex items-baseline font-display text-[22px] leading-none font-semibold tracking-[-0.055em] text-payo-ink no-underline"
      aria-label="Payo home"
    >
      <span>pay</span>
      <span className="font-bold text-payo-green">o</span>
      <span>.</span>
    </Link>
  );
}

