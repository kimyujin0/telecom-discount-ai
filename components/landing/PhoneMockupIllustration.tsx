import { Percent, User } from "lucide-react";

/** 실제 스마트폰 스크린샷 대신, CSS만으로 만든 "멤버십 카드 + 코인/퍼센트" 목업 일러스트. */
export default function PhoneMockupIllustration() {
  return (
    <div className="relative mx-auto flex h-72 w-full max-w-md items-center justify-center sm:h-80">
      {/* 배경 웨이브 블롭 */}
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary-50 via-primary-100/60 to-primary-200/40 dark:from-primary-500/5 dark:via-primary-500/10 dark:to-primary-500/5" />

      {/* 말풍선: 놓치고 있는 혜택을 찾아드려요! */}
      <div className="absolute top-2 right-2 -rotate-3 rounded-2xl rounded-br-sm bg-white px-3 py-2 text-center text-xs leading-snug font-semibold text-primary-700 shadow-md sm:right-6 dark:bg-zinc-800 dark:text-primary-300">
        놓치고 있는
        <br />
        혜택을 찾아드려요!
      </div>

      {/* 멤버십 카드 */}
      <div className="relative w-64 -rotate-2 rounded-2xl border border-primary-100 bg-white p-4 shadow-2xl shadow-primary-900/15 sm:w-72 dark:border-primary-500/20 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-dashed border-zinc-200 pb-3 dark:border-zinc-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <User className="h-5 w-5" />
          </span>
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <span className="text-red-500">SKT</span>
            <span className="text-emerald-600">KT</span>
            <span className="text-pink-500">LG U+</span>
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
          멤버십 제휴 할인
        </p>
        <p className="mt-1 text-2xl font-extrabold text-primary-700 dark:text-primary-400">-20%</p>
      </div>

      {/* 코인(P) 배지 */}
      <span className="absolute top-6 left-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-extrabold text-primary-700 shadow-lg sm:left-8 dark:bg-primary-500/20 dark:text-primary-300">
        P
      </span>
      <span className="absolute bottom-10 left-8 flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-700 shadow-lg dark:bg-primary-500/20 dark:text-primary-300">
        P
      </span>

      {/* 퍼센트 배지 */}
      <span className="absolute right-4 bottom-4 flex h-12 w-12 -rotate-6 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-lg sm:right-10">
        <Percent className="h-6 w-6" />
      </span>
    </div>
  );
}
