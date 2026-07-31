import type { Locale } from "@/i18n/locales";

interface LocaleFlagProps {
  locale: Locale;
  size?: number;
}

export function LocaleFlag({ locale, size = 18 }: LocaleFlagProps) {
  const clipId = `locale-flag-${locale}`;

  let shapes: React.ReactNode;
  if (locale === "pt") {
    shapes = (
      <>
        <rect width={24} height={24} fill="#1E9B4B" />
        <path d="M12 3.6 21.4 12 12 20.4 2.6 12Z" fill="#F5DC2F" />
        <circle cx={12} cy={12} r={4.3} fill="#1B3A8C" />
      </>
    );
  } else if (locale === "es") {
    shapes = (
      <>
        <rect width={24} height={24} fill="#C8102E" />
        <rect y={6.5} width={24} height={11} fill="#F1BF00" />
      </>
    );
  } else {
    shapes = (
      <>
        <rect width={24} height={24} fill="#0A2A66" />
        <path d="M0 0 24 24M24 0 0 24" stroke="#fff" strokeWidth={5} />
        <path d="M0 0 24 24M24 0 0 24" stroke="#C8102E" strokeWidth={2.4} />
        <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth={7} />
        <path d="M12 0v24M0 12h24" stroke="#C8102E" strokeWidth={4} />
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className="block shrink-0 rounded-full"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={12} cy={12} r={12} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{shapes}</g>
    </svg>
  );
}
