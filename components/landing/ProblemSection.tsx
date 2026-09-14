import { FileText } from "lucide-react";

// 막대그래프/표의 수치는 모두 예시용 더미 데이터입니다. 실제 계산 로직은 추후 연결 예정.

const BAR_DATA = [
  { label: "받은 혜택", sub: "(지급된 포인트)", value: 40.7, color: "bg-primary-100 dark:bg-primary-500/20" },
  { label: "사용한 혜택", sub: "(실제 사용)", value: 40.7, color: "bg-primary-400 dark:bg-primary-500/60" },
  { label: "놓친 혜택", sub: "(미사용·소멸)", value: 59.3, color: "bg-amber-100 dark:bg-amber-500/30" },
];

const TABLE_ROWS = [
  { label: "연간 혜택 한도", value: "??,???원", highlight: false },
  { label: "실제 사용", value: "??,???원", highlight: false },
  { label: "미사용 가능액", value: "??,???원", highlight: true },
];

const MAX_BAR_VALUE = Math.max(...BAR_DATA.map((bar) => bar.value));
const BAR_CHART_HEIGHT = 96;

export default function ProblemSection() {
  return (
    <section className="bg-white py-16 sm:py-20 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 왼쪽: 문제 제기 텍스트 + 출처 */}
          <div>
            <p className="text-sm font-bold text-primary-700 dark:text-primary-400">
              왜 이 서비스를 만들었을까요?
            </p>
            <h2 className="mt-2 text-xl leading-snug font-extrabold text-zinc-900 sm:text-2xl dark:text-zinc-50">
              통신사 멤버십 포인트,
              <br />
              매년 수천억 원이 사라지고 있습니다.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              통신사 멤버십 포인트는 다양한 제휴 혜택으로 사용할 수 있지만, 많은 이용자들이 이를
              제대로 활용하지 못하고 있습니다.
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-zinc-700 dark:text-zinc-200">한국소비자원 조사 결과</p>
                <p className="mt-1">
                  통신사 멤버십 포인트의{" "}
                  <span className="font-bold text-primary-600 dark:text-primary-400">59.3%</span>가 기간
                  내 사용되지 못함
                </p>
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">(2017년 조사 기준)</p>
              </div>
            </div>
          </div>

          {/* 가운데: 막대그래프 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                통신사 멤버십 포인트, 얼마나 사용되지 않았을까요?
              </p>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] whitespace-nowrap text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                과거 조사시점
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              2017년 소비자 조사에 따르면, 전체 지급된 포인트의 59.3%가 만료 전에 사용되지 않은
              것으로 나타났습니다.
            </p>
            <div className="mt-6 flex items-end justify-around gap-4">
              {BAR_DATA.map((bar) => (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{bar.value}%</span>
                  <div className="flex w-full items-end justify-center" style={{ height: BAR_CHART_HEIGHT }}>
                    <div
                      className={`w-8 rounded-t-lg ${bar.color}`}
                      style={{ height: `${(bar.value / MAX_BAR_VALUE) * BAR_CHART_HEIGHT}px` }}
                    />
                  </div>
                  <span className="text-center text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    {bar.label}
                  </span>
                  <span className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">{bar.sub}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500">
              ※ 2017년 한국소비자원 조사 기준
            </p>
          </div>

          {/* 오른쪽: 1인당 미사용 혜택 표 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">1인당 놓칠 수 있는 혜택은?</p>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] whitespace-nowrap text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                예시 수치
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              통신사별, 개인의 사용 패턴에 따라 차이가 있을 수 있습니다. 아래 금액은 이해를 돕기
              위한 예시입니다.
            </p>
            <div className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
              {TABLE_ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                  <span
                    className={`font-bold ${
                      row.highlight ? "text-primary-600 dark:text-primary-400" : "text-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
              ※ 통신사 정책 및 개인 사용 패턴에 따라 금액은 달라질 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
