import { ArrowRight, ChevronRight, Mail, Signal, Sparkles, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import ChangePasswordForm from "@/components/mypage/ChangePasswordForm";
import EditNicknameForm from "@/components/mypage/EditNicknameForm";
import SavedBenefitsSection from "@/components/mypage/SavedBenefitsSection";
import SignOutButton from "@/components/mypage/SignOutButton";
import { requireUser } from "@/lib/auth/session";
import { CARRIER_LABELS } from "@/lib/carriers";
import { loadDiagnosisHistory } from "@/lib/diagnosisHistory";
import { formatDate } from "@/lib/formatDate";
import { loadSavedBenefits } from "@/lib/savedBenefits";

export const metadata: Metadata = {
  title: "마이페이지 | 티모산",
  description: "가입 정보와 진단 이력을 확인해보세요.",
};

// 로그인 사용자별로 내용이 달라지므로 절대 캐싱하지 않는다.
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await requireUser("/mypage");
  const [history, savedBenefits] = await Promise.all([loadDiagnosisHistory(user.id), loadSavedBenefits(user.id)]);
  const latestDiagnosis = history[0] ?? null;

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader active="mypage" />

      <main className="flex-1 bg-gradient-to-b from-primary-50/60 to-white dark:from-primary-500/5 dark:to-zinc-950">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
            마이페이지
          </span>
          <h1 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {user.nickname}님, 반가워요!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            가입 정보와 지금까지의 진단 이력을 확인할 수 있어요.
          </p>

          {/* 로그인 정보 */}
          <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">로그인 정보</h2>

            <dl className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5 dark:bg-zinc-800/50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">닉네임</dt>
                  <dd className="mt-0.5">
                    <EditNicknameForm nickname={user.nickname} />
                  </dd>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5 dark:bg-zinc-800/50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">가입한 이메일</dt>
                  <dd className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {user.email ?? "이메일 정보 없음"}
                  </dd>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5 dark:bg-zinc-800/50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                  <Signal className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">이용 중인 통신사</dt>
                  <dd className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {user.carrier ? (
                      CARRIER_LABELS[user.carrier]
                    ) : (
                      <span className="font-medium text-zinc-400 dark:text-zinc-500">선택하지 않았어요</span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* 저장한 혜택 (마감 임박순 정렬 + D-day 배지) */}
          <SavedBenefitsSection userId={user.id} items={savedBenefits} />

          {/* 비밀번호 변경 */}
          <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">비밀번호 변경</h2>
            <div className="mt-4">
              <ChangePasswordForm />
            </div>
          </section>

          {/* 최근 진단 결과 */}
          <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">최근 진단 결과</h2>

            {latestDiagnosis ? (
              <>
                <div className="mt-4 rounded-2xl bg-primary-50 p-5 text-center dark:bg-primary-500/10">
                  <p className="inline-flex items-center gap-1.5 text-base font-extrabold text-primary-800 sm:text-lg dark:text-primary-200">
                    <Sparkles className="h-4 w-4" />
                    {latestDiagnosis.personaName}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-primary-700 dark:text-primary-300">예상 연간 절약액</p>
                  <p className="mt-1 text-3xl font-extrabold text-primary-700 sm:text-4xl dark:text-primary-300">
                    약 {latestDiagnosis.totalYearlySaving.toLocaleString()}원
                  </p>
                  <p className="mt-1 text-xs text-primary-600/80 dark:text-primary-400/80">
                    (월 약 {latestDiagnosis.totalMonthlySaving.toLocaleString()}원 절약) · 티끌 모아 태산!
                  </p>
                </div>
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                  {formatDate(latestDiagnosis.createdAt)}에 진단했어요.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    href={`/mypage/diagnosis/${latestDiagnosis.id}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:underline dark:text-primary-400"
                  >
                    자세히 보기
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/diagnosis/chat"
                    className="inline-flex items-center gap-1 text-sm font-bold text-zinc-600 hover:underline dark:text-zinc-300"
                  >
                    다시 진단하기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-8 text-center dark:bg-zinc-800/50">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">아직 진단 이력이 없어요.</p>
                <Link
                  href="/diagnosis/chat"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
                >
                  지금 혜택 진단하기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>

          {/* 전체 진단 이력 — 여러 건이 쌓이면 각각 클릭해 상세로 이동할 수 있다. */}
          {history.length > 0 && (
            <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">전체 진단 이력</h2>
              <ul className="mt-4 space-y-2">
                {history.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/mypage/diagnosis/${item.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3.5 transition hover:bg-primary-50 dark:bg-zinc-800/50 dark:hover:bg-primary-500/10"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {item.personaName}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(item.createdAt)} · 월 {item.totalMonthlySaving.toLocaleString()}원 절약
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8">
            <SignOutButton />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
