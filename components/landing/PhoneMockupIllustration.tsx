import { Coins, Percent, Sparkles } from "lucide-react";

const PROVIDER_CARDS = [
  { label: "SKT", rotate: "-rotate-6", offset: "top-0" },
  { label: "KT", rotate: "rotate-0", offset: "top-8" },
  { label: "LG U+", rotate: "rotate-6", offset: "top-16" },
];

/** 실제 스마트폰 스크린샷 대신, CSS만으로 만든 "제휴 혜택 카드 + 코인/퍼센트" 목업 일러스트. */
export default function PhoneMockupIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-xs pb-10 sm:max-w-sm">
      <div className="relative aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-teal-600 to-emerald-400 p-2 shadow-2xl shadow-emerald-900/20">
        <div className="flex h-full w-full flex-col rounded-[2rem] bg-white/95 p-5 dark:bg-zinc-900/95">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-bold">오늘의 맞춤 혜택</span>
          </div>

          <div className="relative mt-4 flex-1">
            {PROVIDER_CARDS.map((card, index) => (
              <div
                key={card.label}
                className={`absolute left-1/2 w-40 -translate-x-1/2 ${card.offset} ${card.rotate} rounded-2xl border border-emerald-100 bg-white p-4 shadow-md dark:border-emerald-500/20 dark:bg-zinc-800`}
                style={{ zIndex: index }}
              >
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">{card.label}</p>
                <p className="mt-2 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">-20%</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">멤버십 제휴 할인</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="absolute -left-3 top-8 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg">
        <Coins className="h-6 w-6" />
      </span>
      <span className="absolute -right-2 top-1/3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
        <Percent className="h-5 w-5" />
      </span>

      <div className="absolute bottom-0 left-1/2 w-60 -translate-x-1/2 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-700 shadow-xl dark:bg-zinc-800 dark:text-zinc-100">
        놓치고 있는 혜택을 찾아드려요!
      </div>
    </div>
  );
}
