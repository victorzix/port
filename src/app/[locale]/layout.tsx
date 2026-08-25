import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import "../globals.css";
import { Providers } from "../providers";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/locales";

// Self-hosted (latin subset, downloaded from Google Fonts) so the production
// build never reaches the network — the Coolify build stage has none, and
// next/font/google fetches at build time. Keep the weights in sync with the
// tracking values used across the components.
const spaceGrotesk = localFont({
  variable: "--font-space-grotesk",
  display: "swap",
  src: [
    { path: "../fonts/space-grotesk-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/space-grotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/space-grotesk-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/space-grotesk-700.woff2", weight: "700", style: "normal" },
  ],
});

const jetBrainsMono = localFont({
  variable: "--font-jetbrains-mono",
  display: "swap",
  src: [
    { path: "../fonts/jetbrains-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jetbrains-mono-500.woff2", weight: "500", style: "normal" },
  ],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const siteUrl = "https://portfolio.victoraphael.com";
  const ogTitle = t("ogTitle");
  const ogDescription = t("ogDescription");

  return {
    metadataBase: new URL(siteUrl),
    title: t("title"),
    description: t("description"),
    openGraph: {
      type: "website",
      url: "/",
      siteName: t("title"),
      title: ogTitle,
      description: ogDescription,
      locale,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ["/og.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
