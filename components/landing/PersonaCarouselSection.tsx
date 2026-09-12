"use client";

import { Car, Coffee, Film, Plane, Scale, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { getPersonaByKey, type PersonaKey } from "@/lib/chat/personas";

// 목업에 지정된 카드 순서 (실제 서비스의 6종 페르소나 key 기준).
const CAROUSEL_ORDER: PersonaKey[] = [
  "caffeine_charger",
  "media_lover",
  "practical_living",
  "mobility",
  "travel_nomad",
  "balance",
];

const PERSONA_ICONS: Record<PersonaKey, LucideIcon> = {
  caffeine_charger: Coffee,
  media_lover: Film,
  practical_living: Wallet,
  mobility: Car,
  travel_nomad: Plane,
  balance: Scale,
};

// 페르소나별 예상 절감액은 실제 집계 로직 연결 전까지 플레이스홀더로 표시합니다.
const SAVING_PLACEHOLDER = "연 ??,???원 절감";

export default function PersonaCarouselSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardStep = () => {
    const el = scrollerRef.current;
    return el ? el.scrollWidth / CAROUSEL_ORDER.length : 0;
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    const step = cardStep();
    if (!el || !step) return;
    const index = Math.round(el.scrollLeft / step);
    setActiveIndex(Math.min(CAROUSEL_ORDER.length - 1, Math.max(0, index)));
  };

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    const step = cardStep();
    if (!el || !step) return;
    el.scrollTo({ left: step * index, behavior: "smooth" });
  };

  return (
    <section className="bg-zinc-50 py-16 sm:py-20 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
          당신은 어떤 할인 타입인가요?
        </p>
        <h2 className="mt-2 text-center text-2xl font-extrabold text-zinc-900 sm:text-3xl dark:text-zinc-50">
          6가지 유형으로 진단하고 1년에 받을 수 있는 할인 혜택을 확인해보세요
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          간단한 질문에 답하면 나에게 맞는 할인 유형을 알려드려요
        </p>

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CAROUSEL_ORDER.map((key, index) => {
            const persona = getPersonaByKey(key);
            if (!persona) return null;
            const Icon = PERSONA_ICONS[key];
            const highlighted = index === 0;

            return (
              <Link
                key={key}
                href="/diagnosis"
                className={`flex w-56 shrink-0 snap-start flex-col items-center gap-3 rounded-3xl border p-6 text-center shadow-sm transition hover:-translate-y-1 ${
                  highlighted
                    ? "border-transparent bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-lg"
                    : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                }`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    highlighted ? "bg-white/20" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <span className="text-base font-bold">{persona.name}</span>
                <span className={`text-sm font-semibold ${highlighted ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {SAVING_PLACEHOLDER}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {CAROUSEL_ORDER.map((key, index) => (
            <button
              key={key}
              type="button"
              aria-label={`${index + 1}번째 카드로 이동`}
              onClick={() => scrollToIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? "w-5 bg-emerald-600 dark:bg-emerald-400" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
