import Link from "next/link";

export type SiteNavKey = "carriers" | "mypage";

interface SiteHeaderProps {
  /** 현재 페이지에 해당하는 메뉴를 강조 표시한다. */
  active?: SiteNavKey;
}

export default function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            🎯
          </span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">AI 혜택진단</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          <Link
            href="/carriers"
            className={`transition hover:text-zinc-900 dark:hover:text-white ${
              active === "carriers"
                ? "font-semibold text-indigo-600 dark:text-indigo-400"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            통신사별 혜택
          </Link>
          <Link
            href="#"
            className={`transition hover:text-zinc-900 dark:hover:text-white ${
              active === "mypage"
                ? "font-semibold text-indigo-600 dark:text-indigo-400"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            마이페이지
          </Link>
        </nav>

        <Link
          href="#"
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          로그인
        </Link>
      </div>
    </header>
  );
}
