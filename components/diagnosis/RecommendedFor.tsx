import { HelpCircle, Plane, Receipt, Tv } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Receipt,
    title: "통신비가 너무 많이 나오는 것 같아요",
    description: "지금보다 더 저렴한 요금제를 찾고 싶어요.",
  },
  {
    icon: HelpCircle,
    title: "어떤 혜택을 받을 수 있는지 모르겠어요",
    description: "내가 받을 수 있는 할인/포인트가 궁금해요.",
  },
  {
    icon: Plane,
    title: "가끔 해외를 가요",
    description: "해외 로밍 혜택도 알고 싶어요.",
  },
  {
    icon: Tv,
    title: "OTT, 구독 서비스도 이용해요",
    description: "결합 할인이나 제휴 혜택이 있는지 알고 싶어요.",
  },
];

export default function RecommendedFor() {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">이런 분들께 추천해요</p>
      <ul className="mt-4 space-y-4">
        {ITEMS.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <item.icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
