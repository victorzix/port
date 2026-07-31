import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black font-sans">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between gap-10 px-6 py-16 sm:items-start sm:gap-16 sm:px-16 sm:py-32">
        <div className="flex w-full items-center justify-between">
          <Image
            className="invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <LocaleSwitcher />
        </div>
        <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:gap-6 sm:text-left">
          <h1 className="max-w-xs text-2xl font-semibold leading-9 tracking-tight text-zinc-50 sm:text-3xl sm:leading-10">
            {t("title")}
          </h1>
          <p className="max-w-md text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
            {t.rich("description", {
              templates: (chunks) => (
                <a
                  href="https://vercel.com/templates?framework=next.js"
                  className="font-medium text-zinc-50"
                >
                  {chunks}
                </a>
              ),
              learn: (chunks) => (
                <a
                  href="https://nextjs.org/learn"
                  className="font-medium text-zinc-50"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 text-base font-medium sm:w-auto sm:flex-row sm:gap-4">
          <Button asChild size="lg" className="w-full rounded-full sm:w-[158px]">
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={16}
                height={16}
              />
              {t("deploy")}
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full rounded-full sm:w-[158px]"
          >
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("docs")}
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
