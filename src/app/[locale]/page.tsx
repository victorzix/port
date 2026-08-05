import { AboutSection } from "@/components/about/about-section";
import { ExperienceSection } from "@/components/experience/experience-section";
import { HeroSection } from "@/components/hero/hero-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* overflow-x-clip contains the hero backdrop's -140px bleed without
          creating a scroll container, so the page never scrolls sideways. */}
      <main className="mx-auto max-w-[1080px] overflow-x-clip px-4 pt-10 pb-18 sm:px-16 sm:pt-16 sm:pb-35">
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <SiteFooter />
      </main>
    </div>
  );
}
