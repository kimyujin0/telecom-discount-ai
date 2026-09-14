import { ArrowRight, Bell, FileCheck2, Heart, ShieldCheck } from "lucide-react";

const WHY_US_ITEMS = [
  {
    icon: FileCheck2,
    title: "3사 통신사 한 번에 비교",
    description: "통신사별 혜택을 비교하고 가장 유리한 혜택을 추천해드려요.",
  },
  {
    icon: Heart,
    title: "나에게 딱 맞는 맞춤형 추천",
    description: "소비 패턴을 분석해 개인별 최적의 혜택을 찾아드려요.",
  },
  {
    icon: Bell,
    title: "실시간 업데이트",
    description: "새로운 할인, 이벤트 소식을 빠르게 알려드려요.",
  },
  {
    icon: ShieldCheck,
    title: "안전한 개인정보 보호",
    description: "신뢰할 수 있는 보안 시스템으로 안전하게 이용할 수 있어요.",
  },
];

export default function WhyUsSection() {
  return (
    <section className="bg-primary-50/60 py-16 sm:py-20 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">지금 바로 시작해보세요!</p>
            <h2 className="mt-1 flex items-center gap-1.5 text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              이런 점이 좋아요!
              <ArrowRight className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {WHY_US_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col items-start gap-3 text-left">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400">
                  <item.icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{item.title}</p>
                <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
