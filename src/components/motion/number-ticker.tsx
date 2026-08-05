"use client";

import { useCountUp } from "@/hooks/use-count-up";

interface NumberTickerProps {
  value: string;
  className?: string;
}

export function NumberTicker({ value, className }: NumberTickerProps) {
  const ref = useCountUp<HTMLSpanElement>(value);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
