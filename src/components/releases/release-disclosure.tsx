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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{header}</div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-brand"
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block font-mono text-[13px] leading-none transition-transform",
              open && "rotate-90",
            )}
          >
            ›
          </span>
          <span className="sr-only">{open ? labels.collapse : labels.expand}</span>
        </button>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}
