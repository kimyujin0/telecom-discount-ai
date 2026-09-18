"use client";

import { Calendar, Coffee, Coins, Film, LogIn, ShoppingBag, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/useAuthUser";

// 카테고리 카드/절약액은 예시용 더미입니다. 실제 로그인 연동 후 사용자별 값으로 대체될 예정입니다.
const CATEGORY_CARDS = [
  { label: "카페", icon: Coffee, discount: "최대 20% 할인" },
  { label: "영화", icon: Film, discount: "최대 3,000원 할인" },
  { label: "외식", icon: Utensils, discount: "최대 5,000원 할인" },
  { label: "쇼핑", icon: ShoppingBag, discount: "최대 10% 할인" },
];

export default function TodayBenefitsSection() {
  // 로그인 판별은 헤더(SiteHeader)와 같은 훅을 그대로 재사용한다 — 로직이 두 곳에서 갈라지지 않게.
  // 세션 확인이 끝나기 전(loading)에는 비로그인 문구를 기본값으로 보여준다.
  const { user, loading } = useAuthUser();
  const isLoggedIn = !loading && !!user;

  return (
    <section className="bg-white py-16 sm:py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 text-white">
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm font-bold text-primary-700 dark:text-primary-400">
            지금, 당신이 받을 수 있는 혜택을 확인해보세요!
          </p>
        </div>

        <div className="mt-6 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl dark:text-zinc-50">
              오늘 받을 수 있는 할인
            </h2>
            <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
              {isLoggedIn
                ? "마이페이지에서 내 통신사 혜택과 진단 결과를 바로 확인해보세요"
                : "로그인하면, 오늘 바로 사용할 수 있는 맞춤 혜택을 알려드려요"}
            </p>
            <Link
              href={isLoggedIn ? "/mypage" : "/login"}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-800"
            >
              {isLoggedIn ? <Sparkles className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {isLoggedIn ? "할인 확인하기" : "로그인하고 확인하기"}
            </Link>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {CATEGORY_CARDS.map((category) => (
                <div
                  key={category.label}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                    <category.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{category.label}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{category.discount}</span>
                </div>
              ))}

              <div className="col-span-2 flex flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm sm:col-span-1 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                  <Coins className="h-5 w-5" />
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">오늘 예상 절약액</span>
                <span className="text-lg font-extrabold text-primary-700 dark:text-primary-400">8,000원</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
              ※ 리서치 · 한국소비자원 조사 기준
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
