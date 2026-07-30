@AGENTS.md

# Project rules

- **i18n is mandatory.** This portfolio ships in three locales: `en`, `pt`, `es` (config in `src/i18n/routing.ts`, messages in `messages/{locale}.json`, powered by next-intl). Never hardcode user-facing text in a component — every string goes through `useTranslations`/`getTranslations`, and every key added to one locale file must be added to all three (`en.json`, `pt.json`, `es.json`) in the same change. Routes live under `src/app/[locale]/`.
- **Mobile-first and responsive.** Write base Tailwind classes for mobile first, then scale up with `sm:`/`md:`/`lg:`/`xl:` — never the other way around. Every new component or page must be checked at mobile, tablet, and desktop widths before being considered done.
