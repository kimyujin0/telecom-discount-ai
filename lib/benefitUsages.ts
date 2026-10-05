import { todayInSeoul } from "@/lib/dday";
import { createSupabaseAuthClient } from "@/lib/supabase/auth";

// 마이페이지 "혜택 사용 체크 + 누적 절감액" 기능의 서버 전용 조회 계층.
//
// saved_benefits/lib/savedBenefits.ts와 같은 이유로 service role이 아니라 "로그인 사용자 세션"
// 클라이언트를 쓴다 — benefit_usages는 RLS로 본인 행만 보인다(0011_create_benefit_usages.sql).
// 창(이번 주기) 계산은 여기서 하지 않는다 — lib/benefitUsageQuota.ts가 혜택마다 다른 주기를
// 계산하므로, 이 파일은 "유저의 사용 기록 전체"만 평평하게 돌려주고 호출부가 필요한 창으로 거른다.

export interface BenefitUsageRow {
  id: string;
  benefitId: string;
  /** 사용 시각(ISO, UTC) — 한국 날짜로 비교할 때는 todayInSeoul(new Date(usedAt))을 쓴다. */
  usedAt: string;
  savedAmount: number;
}

/** 로그인 사용자의 혜택 사용 기록 전체(최신순). */
export async function loadBenefitUsages(userId: string): Promise<BenefitUsageRow[]> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase
      .from("benefit_usages")
      .select("id, benefit_id, used_at, saved_amount")
      .eq("user_id", userId)
      .order("used_at", { ascending: false });

    if (error) {
      // 0011 마이그레이션 미적용 등 — 사용 기록만 비어 보이고 마이페이지 나머지는 정상 동작해야 한다.
      console.error("[benefitUsages] failed to load usages", error);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      benefitId: row.benefit_id as string,
      usedAt: row.used_at as string,
      savedAmount: row.saved_amount as number,
    }));
  } catch (error) {
    console.error("[benefitUsages] unexpected error loading usages", error);
    return [];
  }
}

/** 사용자가 직접 입력해둔 연간 절감 목표(원). 입력한 적 없으면 null. */
export async function loadAnnualSavingGoal(userId: string): Promise<number | null> {
  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("annual_saving_goal")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[benefitUsages] failed to load annual saving goal", error);
      return null;
    }
    return (data?.annual_saving_goal as number | null) ?? null;
  } catch (error) {
    console.error("[benefitUsages] unexpected error loading annual saving goal", error);
    return null;
  }
}

export interface SavingsSummary {
  /** 이번 달(한국 시간 기준) 아낀 금액 합계. */
  monthlyTotal: number;
  /** 올해(한국 시간 기준) 누적 아낀 금액 합계. */
  yearlyTotal: number;
}

/** usages를 한국 시간 기준 이번 달/올해로 나눠 합산한다. */
export function summarizeUsages(usages: BenefitUsageRow[], today: string = todayInSeoul()): SavingsSummary {
  const [thisYear, thisMonth] = today.split("-");
  let monthlyTotal = 0;
  let yearlyTotal = 0;

  for (const usage of usages) {
    const usedDate = todayInSeoul(new Date(usage.usedAt));
    const [year, month] = usedDate.split("-");
    if (year === thisYear) {
      yearlyTotal += usage.savedAmount;
      if (month === thisMonth) monthlyTotal += usage.savedAmount;
    }
  }

  return { monthlyTotal, yearlyTotal };
}
