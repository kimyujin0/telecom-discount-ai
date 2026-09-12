import { ArrowLeftRight, ArrowRight, BellRing, Lock } from "lucide-react";
import Link from "next/link";
import PhoneMockupIllustration from "./PhoneMockupIllustration";

const HERO_FEATURES = [
  { icon: ArrowLeftRight, label: "통신사별 자동 비교" },
  { icon: Lock, label: "오늘 받을 수 있는 할인(로그인 필요)" },
  { icon: BellRing, label: "혜택 만료 알림" },
];

export default function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            통신비는 그대로, 혜택은 더 크게!
          </span>

          <h1 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-[2.75rem] dark:text-zinc-50">
            매달 낸 통신비,
            <br />
            이제 할인으로 돌려받으세요.
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-500 sm:text-lg dark:text-zinc-400">
            통신사 멤버십 포인트와 제휴 할인을 분석해 지금 받을 수 있는 할인 혜택을 맞춤으로
            추천해드립니다.
          </p>

          <Link
            href="/diagnosis"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-105 active:scale-[0.98]"
          >
            내 할인 혜택 진단하기
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {HERO_FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <feature.icon className="h-4 w-4" />
                </span>
                {feature.label}
              </div>
            ))}
          </div>
        </div>

        <PhoneMockupIllustration />
      </div>
    </section>
  );
}
