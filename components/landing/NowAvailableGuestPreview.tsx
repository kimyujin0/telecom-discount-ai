"use client";

import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CARRIER_LABELS } from "@/lib/carriers";
import { CARRIER_TIERS, TIER_UNKNOWN, TIERED_CARRIERS, type TieredCarrierKey } from "@/lib/carrierTiers";
import { tierAllows } from "@/lib/diagnosisBenefitMatch";
import { NOW_AVAILABLE_COLUMNS, selectNowAvailable, type NowAvailableBenefitRow, type NowAvailableItem } from "@/lib/nowAvailableBenefits";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// 메인페이지 "오늘 받을 수 있는 할인" 섹션의 비로그인용 미리보기. 로그인 사용자는 마이페이지에서
// 진단 결과/가입 통신사로 자동 추천받지만(NowAvailableSection), 비로그인 방문자는 그 정보가 없어서
// 통신사·등급을 직접 고르게 한다 — 한 번 고르면 다음 방문에도 기억한다(localStorage, 이 브라우저에서만).
//
// benefits 테이블은 anon 키로 공개 읽기 가능해서(RLS) 별도 API 라우트 없이 브라우저에서 바로 쿼리하고,
// "지금 쓸 수 있는가" 선별은 lib/nowAvailableBenefits.ts의 순수 함수(selectNowAvailable)를 그대로
// 재사용한다 — 서버(마이페이지)와 판정 로직이 갈리지 않는다. 비로그인이라 사용 기록이 없으니
// usages는 항상 빈 배열(이번 주기 제외 없이 전부 후보)이고, "썼어요" 버튼 대신 로그인 유도 문구만 보여준다.

const STORAGE_KEY = "tms_now_carrier_tier";

interface Choice {
  carrier: TieredCarrierKey;
  tier: string;
}

function readStoredChoice(): Choice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { carrier?: unknown; tier?: unknown };
    if (typeof parsed.carrier === "string" && (TIERED_CARRIERS as string[]).includes(parsed.carrier) && typeof parsed.tier === "string") {
      return { carrier: parsed.carrier as TieredCarrierKey, tier: parsed.tier };
    }
  } catch {
    // localStorage를 못 쓰는 환경(프라이빗 모드 등) — 매번 다시 고르게 하면 된다.
  }
  return null;
}

function writeStoredChoice(choice: Choice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  } catch {
    // 저장 실패해도 화면 동작에는 영향 없음(그냥 다음 방문에 다시 골라야 할 뿐).
  }
}

export default function NowAvailableGuestPreview() {
  const [hydrated, setHydrated] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  // items===null은 "선택한 통신사·등급으로 아직 안 불러옴(또는 불러오는 중)" — 별도 loading 플래그를
  // 안 두고 이 값으로 로딩 상태까지 같이 표현한다.
  const [items, setItems] = useState<NowAvailableItem[] | null>(null);

  // localStorage는 클라이언트에서만 읽을 수 있어 마운트 후에 반영한다(SSR과의 불일치 방지).
  // effect 몸체에서 setState를 바로 호출하지 않도록 한 틱 미룬다(lib/auth/useAuthUser.ts와 같은 패턴).
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setChoice(readStoredChoice());
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!choice) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) setItems(null);
      });
      return () => {
        active = false;
      };
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("benefits")
        .select(NOW_AVAILABLE_COLUMNS)
        .eq("carrier", choice.carrier)
        .eq("is_active", true);
      if (!active) return;
      if (error) {
        console.error("[NowAvailableGuestPreview] failed to load benefits", error);
        setItems([]);
        return;
      }
      const rows = (data ?? []).filter((row) => tierAllows(row.tier, choice.tier)) as NowAvailableBenefitRow[];
      setItems(selectNowAvailable(rows));
    })();

    return () => {
      active = false;
    };
  }, [choice]);

  const pick = (next: Choice) => {
    setChoice(next);
    writeStoredChoice(next);
  };

  // 서버가 그려준 더미와 다른 내용을 보여줘야 하므로, localStorage 확인이 끝나기 전엔 아무것도 그리지
  // 않는다(한 프레임 깜빡이는 것보다 낫다). 이 컴포넌트 자체가 비로그인 분기에서만 렌더되므로
  // 로그인 사용자에게는 전혀 영향이 없다.
  if (!hydrated) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="통신사 선택"
          value={choice?.carrier ?? ""}
          onChange={(event) => pick({ carrier: event.target.value as TieredCarrierKey, tier: TIER_UNKNOWN })}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="" disabled>
            통신사 선택
          </option>
          {TIERED_CARRIERS.map((carrier) => (
            <option key={carrier} value={carrier}>
              {CARRIER_LABELS[carrier]}
            </option>
          ))}
        </select>

        {choice && (
          <select
            aria-label="등급 선택"
            value={choice.tier}
            onChange={(event) => pick({ carrier: choice.carrier, tier: event.target.value })}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {[...CARRIER_TIERS[choice.carrier], TIER_UNKNOWN].map((tier) => (
              <option key={tier} value={tier}>
                {tier === TIER_UNKNOWN ? "등급 모름" : tier}
              </option>
            ))}
          </select>
        )}
      </div>

      {!choice && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          통신사·등급을 고르면 지금 쓸 수 있는 혜택을 바로 보여드려요.
        </p>
      )}

      {choice && items === null && <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>}

      {choice && items !== null && items.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          지금 바로 쓸 수 있는 혜택이 없어요. 시간대·요일 조건이 있는 혜택이라 조금 뒤에 다시 확인해보세요.
        </p>
      )}

      {choice && items !== null && items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.slice(0, 4).map((item) => (
            <li
              key={item.benefitId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                {item.availability.justOpened ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    오늘 열림
                  </span>
                ) : item.availability.label ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {item.availability.label}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 text-xs font-bold text-primary-700 dark:text-primary-400">
                월 {item.estimatedMonthlySaving.toLocaleString()}원
              </span>
            </li>
          ))}
        </ul>
      )}

      {choice && (
        <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          <Link href="/login" className="font-semibold text-primary-600 underline dark:text-primary-400">
            로그인
          </Link>
          하면 &quot;썼어요&quot; 기록을 남기고, 이미 쓴 혜택은 추천에서 빼드려요.
        </p>
      )}
    </div>
  );
}
