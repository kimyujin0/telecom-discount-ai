import { ArrowRight } from "lucide-react";
import Link from "next/link";
import DiagnosisHeroIllustration from "./DiagnosisHeroIllustration";
import RecommendedFor from "./RecommendedFor";

export default function DiagnosisIntro() {
  return (
    <section className="bg-gradient-to-b from-primary-50/60 to-white dark:from-primary-500/5 dark:to-zinc-950">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-14 sm:px-6 sm:pt-16 sm:pb-20">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid min-w-0 items-center gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                혜택 진단
              </span>
              <h1 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-3xl lg:text-[1.7rem] dark:text-zinc-50">
                AI 통신비 상담사가 당신의 라이프스타일을 분석해 맞춤 혜택을 찾아드려요
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                복잡한 설문 없이, 지금의 상황을 자유롭게 말해주세요.
                <br />
                AI가 알아서 분석하고, 가장 잘 맞는 통신 혜택을 추천해드립니다.
              </p>
              <Link
                href="/diagnosis/chat"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-primary-900/15 transition hover:bg-primary-800 active:scale-[0.98]"
              >
                지금 혜택 진단하기
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>

            <DiagnosisHeroIllustration />
          </div>

          <RecommendedFor />
        </div>
      </div>
    </section>
  );
}
