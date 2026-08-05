"use client";

import { useTypewriter } from "@/hooks/use-typewriter";

interface TypedKickerProps {
  words: string[];
}

export function TypedKicker({ words }: TypedKickerProps) {
  const text = useTypewriter(words);

  return (
    <span className="inline-flex min-h-[1.2em] items-center">
      <span>{text}</span>
      <span className="ml-[3px] inline-block h-[1.05em] w-[7px] animate-[dc-blink_1s_step-end_infinite] bg-brand" />
    </span>
  );
}
