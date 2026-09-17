"use client";

import { BadgePercent, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthUser } from "@/lib/auth/useAuthUser";

export type SiteNavKey = "home" | "diagnosis" | "carriers" | "mypage";

interface SiteHeaderProps {
  /** 현재 페이지에 해당하는 메뉴를 강조 표시한다. */
  active?: SiteNavKey;
}

// "마이페이지"는 비로그인 상태에서도 노출하고, 클릭하면 /mypage가 /login으로 리다이렉트한다
// (app/mypage/page.tsx의 requireUser() 참고) — 메뉴가 갑자기 나타나고 사라지는 레이아웃 흔들림이 없다.
const NAV_ITEMS: { key: SiteNavKey; label: string; href: string }[] = [
  { key: "home", label: "홈", href: "/" },
  { key: "diagnosis", label: "혜택 진단", href: "/diagnosis" },
  { key: "carriers", label: "통신사별 비교", href: "/carriers" },
  { key: "mypage", label: "마이페이지", href: "/mypage" },
];

export default function SiteHeader({ active }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuthUser();

  // 세션 확인이 끝나기 전에는 둘 중 아무것도 깜빡이지 않도록 라벨을 비워둔다.
  const accountLabel = loading ? "" : (user?.email ?? "로그인");
  const accountHref = user ? "/mypage" : "/login";

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <BadgePercent className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            하겸이를 위한 혜택
          </span>
        </Link>

        <nav className="hidden h-full items-stretch gap-7 text-sm font-medium sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center border-b-2 transition hover:text-zinc-900 dark:hover:text-white ${
                active === item.key
                  ? "border-primary-600 font-semibold text-primary-600 dark:text-primary-400"
                  : "border-transparent text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={accountHref}
            className="hidden max-w-44 items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 sm:inline-flex dark:text-zinc-300 dark:hover:text-white"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{accountLabel}</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 sm:hidden dark:text-zinc-300 dark:hover:bg-zinc-900"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-zinc-200 bg-white px-4 py-3 sm:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    active === item.key
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={accountHref}
                onClick={() => setMenuOpen(false)}
                className="block truncate rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {accountLabel}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
