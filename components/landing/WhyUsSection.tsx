import { ArrowLeftRight, RefreshCw, ShieldCheck, Target } from "lucide-react";

const WHY_US_ITEMS = [
  { icon: ArrowLeftRight, label: "3사 통신사 한 번에 비교" },
  { icon: Target, label: "나에게 딱 맞는 맞춤형 추천" },
  { icon: RefreshCw, label: "실시간 업데이트" },
  { icon: ShieldCheck, label: "안전한 개인정보 보호" },
];

export default function WhyUsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="text-center text-2xl font-extrabold text-zinc-900 sm:text-3xl dark:text-zinc-50">
        이런 점이 좋아요!
      </h2>

      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {WHY_US_ITEMS.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 text-emerald-600 dark:from-teal-500/10 dark:to-emerald-500/10 dark:text-emerald-400">
              <item.icon className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
