"use client";

import { Calendar, Car, ChevronLeft, ChevronRight, Coffee, Film, Plane, Scale, Wallet } from "lucide-react";
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

// 카드 소개 문구 — 목업의 "~하는 당신!" 톤을 실제 6종 페르소나 정의에 맞춰 재구성.
const PERSONA_BLURBS: Record<PersonaKey, string> = {
  caffeine_charger: "카페·편의점 혜택을 많이 사용하는 당신!",
  media_lover: "OTT·콘텐츠 혜택을 많이 사용하는 당신!",
  practical_living: "생활비·공과금 혜택을 많이 사용하는 당신!",
  mobility: "대중교통·차량 혜택을 많이 사용하는 당신!",
  travel_nomad: "여행·로밍 혜택을 많이 사용하는 당신!",
  balance: "다양한 혜택을 골고루 사용하는 당신!",
};

// 페르소나별 예상 절감액은 실제 집계 로직 연결 전까지 플레이스홀더로 표시합니다.
const SAVING_PLACEHOLDER = "????원";

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
    const clamped = Math.min(CAROUSEL_ORDER.length - 1, Math.max(0, index));
    el.scrollTo({ left: step * clamped, behavior: "smooth" });
  };

  return (
    <section className="bg-white py-16 sm:py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 text-white">
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm font-bold text-primary-700 dark:text-primary-400">
            당신은 어떤 할인 타입인가요?
          </p>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-2xl leading-snug font-extrabold text-zinc-900 dark:text-zinc-50">
              6가지 유형으로 진단하고 1년에 받을 수 있는 할인 혜택을 확인해보세요.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              지금 당신의 소비 패턴에 맞는 맞춤형 할인 혜택을 찾아드립니다.
              <br />
              지금 바로 진단하고, 숨은 혜택을 확인해보세요!
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="이전 카드"
              onClick={() => scrollToIndex(activeIndex - 1)}
              className="absolute top-1/2 -left-3 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-800 sm:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="다음 카드"
              onClick={() => scrollToIndex(activeIndex + 1)}
              className="absolute top-1/2 -right-3 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-800 sm:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    className={`flex shrink-0 snap-start flex-col overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-1 ${
                      highlighted
                        ? "w-40 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                        : "w-32 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <div className="flex flex-1 flex-col items-center gap-2 px-4 pt-5 pb-3 text-center">
                      <span
                        className={`flex items-center justify-center rounded-2xl ${
                          highlighted
                            ? "h-14 w-14 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
                            : "h-11 w-11 bg-primary-700 text-white"
                        }`}
                      >
                        <Icon className={highlighted ? "h-7 w-7" : "h-5 w-5"} />
                      </span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{persona.name}</span>
                      <span className="text-[11px] leading-tight text-zinc-400 dark:text-zinc-500">
                        {PERSONA_BLURBS[key]}
                      </span>
                    </div>

                    {highlighted ? (
                      <div className="m-2 mt-0 rounded-full bg-primary-700 px-3 py-2 text-center">
                        <p className="text-[10px] text-primary-100">1년 예상 할인혜택</p>
                        <p className="text-sm font-extrabold text-white">{SAVING_PLACEHOLDER}</p>
                      </div>
                    ) : (
                      <div className="m-2 mt-0 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-center text-xs font-bold text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400">
                        {SAVING_PLACEHOLDER}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 flex justify-center gap-2">
              {CAROUSEL_ORDER.map((key, index) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`${index + 1}번째 카드로 이동`}
                  onClick={() => scrollToIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeIndex === index ? "w-5 bg-primary-600 dark:bg-primary-400" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
