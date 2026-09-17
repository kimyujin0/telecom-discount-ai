import { ArrowRight, Mail, Signal, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import SignOutButton from "@/components/mypage/SignOutButton";
import { requireUser } from "@/lib/auth/session";
import { CARRIER_LABELS } from "@/lib/carriers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "마이페이지 | 하겸이를 위한 혜택",
  description: "가입 정보와 가장 최근 진단 결과를 확인해보세요.",
};

// 로그인 사용자별로 내용이 달라지므로 절대 캐싱하지 않는다.
export const dynamic = "force-dynamic";

interface LatestDiagnosis {
  personaName: string;
  totalMonthlySaving: number;
  totalYearlySaving: number;
  createdAt: string;
}

/**
 * 가장 최근 진단 결과 1건을 가져온다.
 *
 * diagnosis_* 테이블은 RLS deny-all이라(0001_init_schema.sql) anon 키로는 읽을 수 없다. 이 페이지는
 * requireUser()로 본인 확인을 먼저 끝냈으므로 service role 클라이언트로 조회하되, 반드시
 * diagnosis_sessions.user_id = 본인 id 조건을 걸어 남의 진단 이력이 섞이지 않게 한다.
 */
async function loadLatestDiagnosis(userId: string): Promise<LatestDiagnosis | null> {
  try {
    const supabase = getSupabaseServerClient();

    const { data: result, error } = await supabase
      .from("diagnosis_results")
      .select("id, created_at, personas!inner(name), diagnosis_sessions!inner(user_id)")
      .eq("diagnosis_sessions.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[mypage] failed to load latest diagnosis", error);
      return null;
    }
    if (!result) return null;

    // 절감액은 진단 시점 스냅샷을 합산해둔 뷰에서 읽는다 (diagnosis_result_savings, 0001_init_schema.sql).
    const { data: savings, error: savingsError } = await supabase
      .from("diagnosis_result_savings")
      .select("total_monthly_saving, total_yearly_saving")
      .eq("diagnosis_result_id", result.id)
      .maybeSingle();

    if (savingsError) console.error("[mypage] failed to load savings", savingsError);

    // to-one 임베드는 객체로 오지만, 생성된 DB 타입이 없어 추론이 배열로 잡히는 경우가 있어 둘 다 받는다.
    const persona = result.personas as { name?: string } | { name?: string }[] | null;
    const personaName = (Array.isArray(persona) ? persona[0]?.name : persona?.name) ?? "밸런스형";

    return {
      personaName,
      totalMonthlySaving: savings?.total_monthly_saving ?? 0,
      totalYearlySaving: savings?.total_yearly_saving ?? 0,
      createdAt: result.created_at as string,
    };
  } catch (error) {
    console.error("[mypage] unexpected error loading latest diagnosis", error);
    return null;
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default async function MyPage() {
  const user = await requireUser("/mypage");
  const latestDiagnosis = await loadLatestDiagnosis(user.id);

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
            가입 정보와 가장 최근 진단 결과를 확인할 수 있어요.
          </p>

          {/* 로그인 정보 */}
          <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">로그인 정보</h2>

            <dl className="mt-4 space-y-3">
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
                <Link
                  href="/diagnosis/chat"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:underline dark:text-primary-400"
                >
                  다시 진단하기
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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

          <div className="mt-8">
            <SignOutButton />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
