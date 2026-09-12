import { Coffee, Film, LogIn, ShoppingBag, Utensils } from "lucide-react";
import Link from "next/link";

// 카테고리 카드/절약액은 예시용 더미입니다. 실제 로그인 연동 후 사용자별 값으로 대체될 예정입니다.
const CATEGORY_CARDS = [
  { label: "카페", icon: Coffee },
  { label: "영화", icon: Film },
  { label: "외식", icon: Utensils },
  { label: "쇼핑", icon: ShoppingBag },
];

export default function TodayBenefitsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl dark:text-zinc-50">
            지금, 당신이 받을 수 있는 혜택을 확인해보세요!
          </h2>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
            로그인하면, 오늘 바로 사용할 수 있는 맞춤 혜택을 알려드려요
          </p>
          <Link
            href="#"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <LogIn className="h-4 w-4" />
            로그인하고 확인하기
          </Link>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORY_CARDS.map((category) => (
              <div
                key={category.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <category.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{category.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 p-4 text-white shadow-md">
            <p className="text-xs font-medium text-emerald-50">오늘 예상 절약액</p>
            <p className="mt-1 text-2xl font-extrabold">8,000원</p>
          </div>
        </div>
      </div>
    </section>
  );
}
