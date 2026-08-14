"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

import { ReleaseChangeList } from "@/components/releases/release-change-list";
import { versionAnchor } from "@/lib/version-key";
import { cn } from "@/lib/utils";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleasePatchGroupProps {
  patches: ReleaseView[];
}

export function ReleasePatchGroup({ patches }: ReleasePatchGroupProps) {
  const t = useTranslations("ReleaseBump");
  const format = useFormatter();
  const [open, setOpen] = useState(false);

  if (patches.length === 0) return null;

  return (
    <div className="mt-5 ml-2 border-l border-border pl-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-brand"
      >
        <span
          aria-hidden="true"
          className={cn("text-[11px] transition-transform", open && "rotate-90")}
        >
          ›
        </span>
        {t("patchesToggle", { count: patches.length })}
        <span className="sr-only">
          {open ? t("patchesCollapse") : t("patchesExpand")}
        </span>
      </button>

      {open && (
        <ul className="mt-4 flex flex-col gap-5">
          {patches.map((patch) => (
            <li
              key={patch.id}
              id={versionAnchor(patch.version)}
              className="relative scroll-mt-28 before:absolute before:left-[-23px] before:top-[7px] before:size-1.5 before:rounded-full before:bg-muted-foreground"
            >
              <div className="flex items-baseline justify-between gap-4">
                <a
                  href={`#${versionAnchor(patch.version)}`}
                  className="font-mono text-[13px] text-muted-foreground transition-opacity hover:opacity-70"
                >
                  v{patch.version}
                </a>
                <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                  {format.dateTime(patch.releasedAt, "long")}
                </span>
              </div>
              <ReleaseChangeList changes={patch.changes} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
