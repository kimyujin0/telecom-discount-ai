import type { Metadata } from "next";
import DiagnosisIntro from "@/components/diagnosis/DiagnosisIntro";
import HowItWorksSteps from "@/components/diagnosis/HowItWorksSteps";
import WhyGoodSection from "@/components/diagnosis/WhyGoodSection";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "혜택 진단 | 티모산",
  description: "AI 통신비 상담사가 당신의 라이프스타일을 분석해 맞춤 통신 혜택을 찾아드려요.",
};

export default function DiagnosisPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active="diagnosis" />
      <main className="flex-1">
        <DiagnosisIntro />
        <WhyGoodSection />
        <HowItWorksSteps />
      </main>
      <SiteFooter />
    </div>
  );
}
