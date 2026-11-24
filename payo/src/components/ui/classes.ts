// Reusable Tailwind class strings for Payo's shared UI primitives
// (buttons, form controls, panels, badges...). Components combine them with `cx`.
// Breakpoints mirror the original design: max-[760px] = phone, max-[560px] = small phone.

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* Buttons
 * Size and colour are separate class groups so they never conflict:
 * use btn.primary (normal size) or btnSm.primary (small size). */
const btnShape =
  "inline-flex items-center justify-center gap-[7px] whitespace-nowrap border font-sans font-bold no-underline transition-[background,color,transform,border-color] duration-[160ms] ease-in-out disabled:cursor-not-allowed disabled:opacity-60";
const sizeMd = "h-[42px] rounded-[10px] px-4 text-[13px]";
const sizeSm = "h-[34px] rounded-lg px-3 text-xs";

const btnColors = {
  primary: "border-transparent bg-payo-ink text-white enabled:hover:-translate-y-px enabled:hover:bg-[#1d2636]",
  green: "border-transparent bg-payo-green text-white enabled:hover:bg-payo-green-dark",
  ghost: "border-payo-border bg-white text-payo-text enabled:hover:bg-[#f7f8f6]",
  danger: "border-[#f0d2d2] bg-white text-[#b84343] enabled:hover:bg-payo-red-soft",
  dangerSolid: "border-transparent bg-[#c94a4a] text-white hover:bg-[#b23d3d]",
};
type BtnVariant = keyof typeof btnColors;

const makeButtons = (size: string) =>
  Object.fromEntries(
    Object.entries(btnColors).map(([k, colors]) => [k, `${btnShape} ${size} ${colors}`])
  ) as Record<BtnVariant, string>;

export const btn = makeButtons(sizeMd);
export const btnSm = makeButtons(sizeSm);

/* Form controls */
export const form = {
  form: "flex flex-col gap-4",
  row: "grid grid-cols-2 gap-3 max-[560px]:grid-cols-1",
  field: "flex min-w-0 flex-col gap-[7px]",
  label: "text-xs font-bold text-payo-text",
  hint: "text-xs font-medium text-payo-light",
  input:
    "h-11 w-full rounded-[10px] border border-payo-border bg-white px-[13px] text-sm font-medium text-payo-ink outline-none transition-[border-color,box-shadow] duration-[160ms] focus:border-payo-green focus:shadow-[0_0_0_3px_rgba(32,184,107,0.14)] disabled:bg-[#f7f8f6] disabled:text-payo-muted",
  select:
    "h-11 w-full appearance-none rounded-[10px] border border-payo-border bg-white bg-select-arrow bg-[position:right_11px_center] bg-no-repeat pr-[34px] pl-[13px] text-sm font-medium text-payo-ink outline-none transition-[border-color,box-shadow] duration-[160ms] focus:border-payo-green focus:shadow-[0_0_0_3px_rgba(32,184,107,0.14)]",
  /** Wrapper for an input with a currency sign in front. */
  money: "relative",
  moneySign: "absolute top-1/2 left-[13px] -translate-y-1/2 text-sm font-bold text-payo-muted",
  moneyInput: "!pl-7 !font-bold",
  error: "rounded-[10px] border border-[#f6d4d4] bg-payo-red-soft px-[13px] py-[11px] text-[13px] font-semibold text-[#a33a3a]",
  segment: "inline-flex rounded-[10px] bg-[#f2f3f1] p-[3px]",
  segmentBtn: "h-8 rounded-lg px-3.5 text-xs font-bold text-payo-muted",
  segmentBtnActive: "bg-white !text-payo-ink shadow-[0_1px_3px_rgba(17,24,39,0.08)]",
  checkbox: "size-[17px] accent-payo-green",
  code: "font-mono !text-lg tracking-[0.2em] uppercase",
  confirmText: "m-0 text-sm leading-[1.55] text-payo-text",
};

/* Avatars */
export const avatar =
  "flex size-[30px] flex-[0_0_30px] items-center justify-center rounded-lg bg-[#eef1ee] text-[11px] font-extrabold text-[#475467]";

/* Pastel tones for group avatars (toneFor in lib/format) */
export const toneClass: Record<string, string> = {
  green: "!bg-[#e6f6ed] !text-[#15804b]",
  blue: "!bg-[#e8f0fd] !text-[#2f5fb3]",
  orange: "!bg-[#fdf0e3] !text-[#b0631b]",
  violet: "!bg-[#f0ebfb] !text-[#6943b8]",
  rose: "!bg-[#fcebef] !text-[#b23e5c]",
  teal: "!bg-[#e3f5f4] !text-[#1f7f7a]",
};

/* Badges */
const badgeBase = "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold";
export const badge = {
  green: cx(badgeBase, "bg-payo-green-soft text-payo-green-dark"),
  muted: cx(badgeBase, "bg-[#f2f3f1] text-payo-muted"),
  red: cx(badgeBase, "bg-payo-red-soft text-[#b84343]"),
};

/* Panels (white cards with a header row) */
export const panel = {
  panel: "overflow-hidden rounded-xl border border-payo-border bg-white",
  /** For panels that contain popover menus. */
  panelVisible: "overflow-visible rounded-xl border border-payo-border bg-white",
  header:
    "flex min-h-[78px] flex-wrap items-center justify-between gap-3 border-b border-payo-border-soft px-[19px] py-[17px] max-[760px]:p-[15px]",
  title: "m-0 flex items-center gap-[7px] text-sm font-[750] tracking-[-0.02em] text-payo-ink",
  subtitle: "mt-[5px] mb-0 text-[11.5px] font-medium text-payo-light",
  headerLink:
    "inline-flex items-center gap-0.5 text-xs font-bold text-payo-muted no-underline transition-colors duration-[180ms] hover:text-payo-green",
};

/* Small square icon buttons */
export const iconBtn =
  "flex size-[30px] flex-[0_0_30px] items-center justify-center rounded-[7px] text-payo-light hover:bg-payo-red-soft hover:text-[#b84343]";

/* Generic "data-tip" tooltip (CSS-only, shown on hover/focus) */
export const tip =
  "relative hover:after:pointer-events-none hover:after:absolute hover:after:bottom-[calc(100%+8px)] hover:after:left-1/2 hover:after:z-20 hover:after:-translate-x-1/2 hover:after:rounded-lg hover:after:bg-payo-ink hover:after:px-2.5 hover:after:py-[7px] hover:after:text-xs hover:after:leading-[1.3] hover:after:font-semibold hover:after:whitespace-nowrap hover:after:text-white hover:after:shadow-[0_8px_20px_rgba(17,24,39,0.18)] hover:after:content-[attr(data-tip)] focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:bottom-[calc(100%+8px)] focus-visible:after:left-1/2 focus-visible:after:z-20 focus-visible:after:-translate-x-1/2 focus-visible:after:rounded-lg focus-visible:after:bg-payo-ink focus-visible:after:px-2.5 focus-visible:after:py-[7px] focus-visible:after:text-xs focus-visible:after:font-semibold focus-visible:after:whitespace-nowrap focus-visible:after:text-white focus-visible:after:content-[attr(data-tip)]";
