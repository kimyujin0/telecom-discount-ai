import { Percent } from "lucide-react";

/** 목업의 SKT/KT/U+ 카드 일러스트를 CSS만으로 재현한 버전. */
export default function CarrierHeroIllustration() {
  return (
    <div className="relative mx-auto flex h-64 w-full max-w-md items-center justify-center sm:h-72">
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary-50 via-primary-100/60 to-primary-200/40 dark:from-primary-500/5 dark:via-primary-500/10 dark:to-primary-500/5" />

      <div className="absolute top-2 right-2 rotate-3 rounded-2xl rounded-br-sm bg-white px-3 py-2 text-center text-xs leading-snug font-semibold text-primary-700 shadow-md sm:right-6 dark:bg-zinc-800 dark:text-primary-300">
        통신사별 혜택을
        <br />
        한눈에!
      </div>

      <div className="relative h-40 w-72">
        <div className="absolute top-3 left-2 h-36 w-24 -rotate-6 rounded-2xl bg-red-500 p-3 text-white shadow-xl">
          <p className="text-xs font-bold opacity-80">SKT</p>
          <p className="mt-9 text-lg font-extrabold">T</p>
        </div>
        <div className="absolute top-0 left-1/2 h-36 w-24 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-900 shadow-xl">
          <p className="text-xs font-bold text-zinc-400">KT</p>
          <p className="mt-9 text-lg font-extrabold">kt</p>
        </div>
        <div className="absolute top-3 right-2 h-36 w-24 rotate-6 rounded-2xl bg-fuchsia-600 p-3 text-white shadow-xl">
          <p className="text-xs font-bold opacity-80">U+</p>
          <p className="mt-9 text-lg font-extrabold">U+</p>
        </div>
      </div>

      <span className="absolute bottom-6 left-6 flex h-11 w-11 -rotate-6 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-lg sm:left-10">
        <Percent className="h-5 w-5" />
      </span>
      <span className="absolute right-6 bottom-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-700 shadow-lg sm:right-10 dark:bg-primary-500/20 dark:text-primary-300">
        P
      </span>
    </div>
  );
}
