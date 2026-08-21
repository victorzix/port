"use client";

import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ReleaseDisclosureProps {
  /** Whether the body starts visible (the newest release does). */
  defaultOpen: boolean;
  /** This release's anchor id (e.g. "v2-0-0") — drives hash auto-expand. */
  anchorId: string;
  labels: { expand: string; collapse: string };
  /** Always-visible header (version link + tier tag + date + title). */
  header: ReactNode;
  /** Collapsible body (changes + notes). */
  children: ReactNode;
}

export function ReleaseDisclosure({
  defaultOpen,
  anchorId,
  labels,
  header,
  children,
}: ReleaseDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const openIfTargeted = () => {
      if (window.location.hash === `#${anchorId}`) setOpen(true);
    };
    openIfTargeted();
    window.addEventListener("hashchange", openIfTargeted);
    return () => window.removeEventListener("hashchange", openIfTargeted);
  }, [anchorId]);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={(event) => {
          // Let links inside the header (the version deep-link) work without toggling.
          if ((event.target as HTMLElement).closest("a")) return;
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
        className="group flex cursor-pointer items-start justify-between gap-3"
      >
        <div className="min-w-0 flex-1">{header}</div>
        <span
          aria-hidden="true"
          className={cn(
            "mt-1 shrink-0 font-mono text-[13px] leading-none text-muted-foreground transition-[transform,color] group-hover:text-brand",
            open && "rotate-90",
          )}
        >
          ›
        </span>
        <span className="sr-only">{open ? labels.collapse : labels.expand}</span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}
