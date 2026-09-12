import { Construction } from "lucide-react";
import Link from "next/link";
import SiteFooter from "./SiteFooter";
import SiteHeader, { type SiteNavKey } from "./SiteHeader";

interface ComingSoonPageProps {
  title: string;
  active?: SiteNavKey;
}

/** "이용방법", "자주 묻는 질문" 등 아직 실제 콘텐츠가 없는 메뉴가 404 대신 연결되는 플레이스홀더. */
export default function ComingSoonPage({ title, active }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active={active} />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Construction className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-xl font-extrabold text-zinc-900 sm:text-2xl dark:text-zinc-50">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          아직 준비 중인 페이지예요. 조금만 기다려주세요!
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          홈으로 돌아가기
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
