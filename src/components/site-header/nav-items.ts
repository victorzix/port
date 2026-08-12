/**
 * Nav entries in display order. Labels live in `Nav.items` in the message
 * files and are matched to these by index — keep the two in the same order.
 * Both kinds render through the locale-aware Link: `route` entries use
 * `href` as-is, `anchor` entries are rendered root-relative (`/#about`) so
 * they resolve to the home page's sections from any route.
 */
export interface NavItem {
  href: string;
  kind: "anchor" | "route";
  /** Dimmed and unclickable — the section does not exist yet. */
  disabled?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "#about", kind: "anchor" },
  { href: "#experience", kind: "anchor" },
  { href: "/projects", kind: "route" },
  { href: "#contact", kind: "anchor", disabled: true },
];
