import type { DiscountType } from "@/components/carriers/types";
import type { BenefitUsageRow } from "@/lib/benefitUsages";
import { getUsageQuota, isWithinWindow } from "@/lib/benefitUsageQuota";
import { todayInSeoul } from "@/lib/dday";
import { getAvailabilityNow, type AvailabilityNow } from "@/lib/usageCycle";

// "지금 쓸 수 있는 혜택" 섹션(마이페이지 상단 + 비로그인 메인페이지 미리보기)의 선별 로직 — 순수
// 함수만 둔다(Supabase 의존 없음). 그래서 서버(lib/loadNowAvailableBenefits.ts)와 브라우저(비로그인
// 메인페이지의 NowAvailableGuestPreview가 anon 키로 직접 쿼리한 뒤 이 함수에 넘김) 양쪽에서 그대로
// import해 쓸 수 있다 — 서버 전용 코드(lib/supabase/auth.ts, next/headers)를 여기 두면 클라이언트
// 컴포넌트가 이 파일을 import하는 순간 번들에 함께 끌려 들어가 빌드가 깨진다(실제로 한 번 겪은 문제).

export interface NowAvailableItem {
  benefitId: string;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  usageCondition: string | null;
  category: string | null;
  discountType: DiscountType;
  discountValue: number | null;
  estimatedMonthlySaving: number;
  /** availability.available은 이 목록에 들어온 이상 항상 true다(미사용 가능한 건 이미 걸러짐). */
  availability: AvailabilityNow;
}

/** benefits 테이블에서 이 기능에 필요한 컬럼만 — 서버 쿼리와 브라우저 직접 쿼리가 같은 목록을 쓴다. */
export const NOW_AVAILABLE_COLUMNS =
  "id, provider, carrier, title, description, usage_condition, category, discount_type, discount_value, estimated_monthly_saving, tier, valid_to";

export interface NowAvailableBenefitRow {
  id: string;
  provider: string;
  carrier: string;
  title: string;
  description: string | null;
  usage_condition: string | null;
  category: string | null;
  discount_type: DiscountType;
  discount_value: number | null;
  estimated_monthly_saving: number;
  tier: string | null;
  valid_to: string | null;
}

/**
 * carrier/tier로 이미 필터링된 혜택 행 중에서 "지금(now) 쓸 수 있고, 이번 주기에 아직 다 안 쓴" 것만
 * 골라 정렬한다. 비로그인 사용자는 usages가 없으니(빈 배열) 주기 제외 없이 전부 후보가 된다.
 *
 * 정렬: 오늘 새로 열린 혜택 → 곧 닫히는 혜택(남은 시간 적은 순) → 나머지는 예상 절감액 큰 순.
 */
export function selectNowAvailable(
  rows: NowAvailableBenefitRow[],
  usages: BenefitUsageRow[] = [],
  now: Date = new Date(),
): NowAvailableItem[] {
  const today = todayInSeoul(now);
  const items: NowAvailableItem[] = [];

  for (const row of rows) {
    const availability = getAvailabilityNow(row.usage_condition, now);
    if (!availability.available) continue;

    const quota = getUsageQuota(row.valid_to, today, row.usage_condition);
    if (quota && quota.limit !== null) {
      const usedInWindow = usages.filter(
        (u) => u.benefitId === row.id && isWithinWindow(todayInSeoul(new Date(u.usedAt)), quota),
      ).length;
      if (usedInWindow >= quota.limit) continue; // 이번 주기에 이미 다 썼음 — "썼어요" 기록으로 제외
    }

    items.push({
      benefitId: row.id,
      provider: row.provider,
      carrier: row.carrier,
      title: row.title,
      description: row.description,
      usageCondition: row.usage_condition,
      category: row.category,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      estimatedMonthlySaving: row.estimated_monthly_saving,
      availability,
    });
  }

  return items.sort((a, b) => {
    if (a.availability.justOpened !== b.availability.justOpened) return a.availability.justOpened ? -1 : 1;
    const aRemaining = a.availability.minutesRemaining;
    const bRemaining = b.availability.minutesRemaining;
    if (aRemaining !== null && bRemaining !== null) return aRemaining - bRemaining;
    if (aRemaining !== null) return -1;
    if (bRemaining !== null) return 1;
    return b.estimatedMonthlySaving - a.estimatedMonthlySaving;
  });
}
