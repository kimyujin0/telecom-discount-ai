import HeroSection from "@/components/landing/HeroSection";
import PersonaCarouselSection from "@/components/landing/PersonaCarouselSection";
import ProblemSection from "@/components/landing/ProblemSection";
import TodayBenefitsSection from "@/components/landing/TodayBenefitsSection";
import WhyUsSection from "@/components/landing/WhyUsSection";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active="home" />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <TodayBenefitsSection />
        <PersonaCarouselSection />
        <WhyUsSection />
      </main>
      <SiteFooter />
    </div>
  );
}
