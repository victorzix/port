import { HeroSection } from "@/components/hero/hero-section";
import { SiteHeader } from "@/components/site-header/site-header";
import { WorkSection } from "@/components/work/work-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1320px] px-4 pt-10 pb-18 sm:px-16 sm:pt-16 sm:pb-35">
        <HeroSection />
        <WorkSection />
      </main>
    </div>
  );
}
