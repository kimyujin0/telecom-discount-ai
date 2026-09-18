import { ChevronRight, Coins, MessageCircleHeart, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HIGHLIGHT_ITEMS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: MessageCircleHeart,
    title: "AI가 분석하는\n개인 맞춤 진단",
    description: "사용자의 대화를 기반으로 통신사, 등급, 사용 패턴을 분석해 나에게 꼭 맞는 혜택을 찾아줘요.",
  },
  {
    icon: Coins,
    title: "놓치고 있던\n혜택까지 한 번에",
    description: "통신사별 할인, 결합 혜택, 제휴 혜택까지 다양한 혜택을 통합해서 알려드려요.",
  },
  {
    icon: UserCheck,
    title: "더 큰 절약,\n더 나은 일상",
    description: "불필요한 요금은 줄이고, 지금 바로 쓸 수 있는 혜택으로 매달 더 큰 절약을 경험하세요.",
  },
];

export default function WhyGoodSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="text-xl font-extrabold text-zinc-900 sm:text-2xl dark:text-zinc-50">
        혜택 진단, 이런 점이 좋아요!
      </h2>

      <div className="mt-8 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        {HIGHLIGHT_ITEMS.map((item, index) => (
          <div key={item.title} className="flex flex-1 items-center gap-3">
            <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-base leading-snug font-extrabold whitespace-pre-line text-zinc-900 dark:text-zinc-50">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
            </div>
            {index < HIGHLIGHT_ITEMS.length - 1 && (
              <ChevronRight className="hidden h-6 w-6 shrink-0 text-primary-300 lg:block dark:text-primary-700" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
