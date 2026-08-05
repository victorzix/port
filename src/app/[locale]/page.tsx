import { ExperienceSection } from "@/components/experience/experience-section";
import { HeroSection } from "@/components/hero/hero-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1080px] px-4 pt-10 pb-18 sm:px-16 sm:pt-16 sm:pb-35">
        <HeroSection />
        <ExperienceSection />
        <SiteFooter />
      </main>
    </div>
  );
}
