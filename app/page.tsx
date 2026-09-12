import Link from "next/link";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { PERSONAS } from "@/lib/chat/personas";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <PersonaSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-24 sm:pb-20">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        AI 소비 성향 진단
      </span>

      <h1 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight dark:text-zinc-50">
        당신은 어떤
        <br className="sm:hidden" /> 혜택형 인간일까?
      </h1>

      <p className="mt-4 text-base text-zinc-500 sm:text-lg dark:text-zinc-400">
        놓치고 있는 통신사 혜택, 얼마나 될까요?
      </p>

      <div className="mt-9 flex flex-col items-center gap-3">
        <Link
          href="/diagnosis"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          내 유형 찾으러 가기
          <span aria-hidden>→</span>
        </Link>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          1분이면 충분해요 · 티끌모아 태산, 내 혜택부터 확인해보세요
        </p>
      </div>
    </section>
  );
}

function PersonaSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28">
      <p className="text-center text-xs font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
        6가지 혜택형 인간
      </p>
      <h2 className="mt-2 text-center text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
        나는 이 중에 어떤 유형일까?
      </h2>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
        {PERSONAS.map((persona) => (
          <Link
            key={persona.key}
            href="/diagnosis"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-50 text-2xl transition group-hover:bg-indigo-50 dark:bg-zinc-800 dark:group-hover:bg-indigo-500/10">
              {persona.emoji}
            </span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {persona.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
