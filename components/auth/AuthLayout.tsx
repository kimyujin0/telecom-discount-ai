import { BadgePercent } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader, { type SiteNavKey } from "@/components/layout/SiteHeader";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** 카드 아래 "계정이 없으신가요? 회원가입" 같은 전환 링크. */
  footer: { prompt: string; linkLabel: string; href: string };
  active?: SiteNavKey;
}

/** /login, /signup 공통 페이지 골격 — 청록 톤 그라데이션 배경 위에 카드 하나. */
export default function AuthLayout({ title, subtitle, children, footer, active }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active={active} />

      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary-50/60 to-white px-4 py-12 sm:px-6 dark:from-primary-500/5 dark:to-zinc-950">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-900/15">
              <BadgePercent className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {footer.prompt}{" "}
            <Link href={footer.href} className="font-bold text-primary-700 hover:underline dark:text-primary-400">
              {footer.linkLabel}
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
