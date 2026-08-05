"use client";

import { useTypewriter } from "@/hooks/use-typewriter";

interface TypedKickerProps {
  words: string[];
}

export function TypedKicker({ words }: TypedKickerProps) {
  const text = useTypewriter(words);
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className="relative inline-flex">
      {/* Invisible sizer reserves the width of the longest word (plus the
          cursor) so typing/deleting never reflows the surrounding layout. */}
      <span aria-hidden className="invisible pr-[10px] whitespace-nowrap">
        {longest}
      </span>
      <span className="absolute inset-y-0 left-0 inline-flex items-center whitespace-nowrap">
        <span>{text}</span>
        <span className="ml-[3px] inline-block h-[1.05em] w-[7px] animate-[dc-blink_1s_step-end_infinite] bg-brand" />
      </span>
    </span>
  );
}
