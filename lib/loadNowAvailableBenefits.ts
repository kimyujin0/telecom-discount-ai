import type { BenefitUsageRow } from "@/lib/benefitUsages";
import type { CarrierKey } from "@/lib/carriers";
import { tierAllows } from "@/lib/diagnosisBenefitMatch";
import { NOW_AVAILABLE_COLUMNS, selectNowAvailable, type NowAvailableBenefitRow, type NowAvailableItem } from "@/lib/nowAvailableBenefits";
import { createSupabaseAuthClient } from "@/lib/supabase/auth";

// loadNowAvailableBenefits()만 따로 둔 이유: lib/supabase/auth.ts가 next/headers를 쓰는 서버 전용
// 코드라서, 순수 함수(lib/nowAvailableBenefits.ts의 selectNowAvailable)와 같은 파일에 두면 그 파일을
// import하는 클라이언트 컴포넌트(비로그인 메인페이지의 NowAvailableGuestPreview)까지 번들에
// next/headers가 끌려 들어가 빌드가 깨진다. 로그인 사용자용(마이페이지)이라 이 파일은 서버에서만 import한다.

/** 로그인 사용자용 서버 로더 — 마이페이지에서 쓴다. usages는 이미 로드해둔 걸 그대로 받아 다시 쿼리하지 않는다. */
export async function loadNowAvailableBenefits(
  carrier: CarrierKey,
  tier: string | null,
  usages: BenefitUsageRow[],
  now: Date = new Date(),
): Promise<NowAvailableItem[]> {
  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase
    .from("benefits")
    .select(NOW_AVAILABLE_COLUMNS)
    .eq("carrier", carrier)
    .eq("is_active", true);

  if (error) {
    console.error("[loadNowAvailableBenefits] failed to load benefits", error);
    return [];
  }

  const rows = (data ?? []).filter((row) => tierAllows(row.tier, tier)) as NowAvailableBenefitRow[];
  return selectNowAvailable(rows, usages, now);
}
