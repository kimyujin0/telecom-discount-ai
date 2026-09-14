import { ArrowLeftRight, ArrowRight, BellRing, Lock } from "lucide-react";
import Link from "next/link";
import PhoneMockupIllustration from "./PhoneMockupIllustration";

const HERO_FEATURES = [
  { icon: ArrowLeftRight, label: "통신사별\n자동 비교" },
  { icon: Lock, label: "오늘 받을 수 있는 할인\n(로그인 필요)" },
  { icon: BellRing, label: "혜택 만료 알림" },
];

export default function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-bold text-primary-700 dark:text-primary-400">
            통신비는 그대로, 혜택은 더 크게!
          </p>

          <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-[2.75rem] dark:text-zinc-50">
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
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-primary-900/15 transition hover:bg-primary-800 active:scale-[0.98]"
          >
            내 할인 혜택 진단하기
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>

          <div className="mt-8 flex flex-wrap gap-3">
            {HERO_FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="flex w-[104px] flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <feature.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <span className="text-[11px] leading-tight font-medium whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <PhoneMockupIllustration />
      </div>
    </section>
  );
}
