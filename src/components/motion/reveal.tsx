"use client";

import type { ElementType, ReactNode } from "react";

import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  /** Element to render — keeps the wrapper semantic instead of adding a div. */
  as?: ElementType;
  /** Anchor target, for sections linked from the nav. */
  id?: string;
  className?: string;
  /** Stagger in ms, usually derived from the item index. */
  delay?: number;
}

export function Reveal({ children, as: Tag = "div", id, className, delay = 0 }: RevealProps) {
  const ref = useReveal<HTMLElement>();

  return (
    <Tag
      ref={ref}
      id={id}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.3,1)]",
        "data-[reveal=hidden]:translate-y-5 data-[reveal=hidden]:opacity-0",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
