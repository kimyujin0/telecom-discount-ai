// 막대그래프/표의 수치는 모두 예시용 더미 데이터입니다. 실제 계산 로직은 추후 연결 예정.

const BAR_DATA = [
  { label: "받은 혜택", value: 40.7, color: "bg-emerald-200 dark:bg-emerald-500/30" },
  { label: "사용한 혜택", value: 40.7, color: "bg-emerald-400 dark:bg-emerald-500/60" },
  { label: "놓친 혜택", value: 59.3, color: "bg-teal-600 dark:bg-teal-500" },
];

const TABLE_ROWS = [
  { label: "연간 혜택 한도", value: "??,???원", highlight: false },
  { label: "실제 사용", value: "??,???원", highlight: false },
  { label: "미사용 가능액", value: "??,???원", highlight: true },
];

const MAX_BAR_VALUE = Math.max(...BAR_DATA.map((bar) => bar.value));
const BAR_CHART_HEIGHT = 120;

export default function ProblemSection() {
  return (
    <section className="bg-zinc-50 py-16 sm:py-20 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
          왜 이 서비스를 만들었을까요?
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* 왼쪽: 문제 제기 텍스트 + 출처 */}
          <div>
            <h2 className="text-xl leading-snug font-extrabold text-zinc-900 sm:text-2xl dark:text-zinc-50">
              통신사 멤버십 포인트,
              <br />
              매년 수천억 원이 사라지고 있습니다.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              많은 분들이 자신이 받을 수 있는 통신사 혜택과 멤버십 포인트를 다 쓰지 못한 채 그대로
              흘려보내고 있어요. 내게맞는할인은 이렇게 놓치는 혜택을 놓치지 않도록 도와드립니다.
            </p>
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <p className="font-semibold text-zinc-700 dark:text-zinc-200">한국소비자원 조사 결과</p>
              <p className="mt-1">
                통신사 멤버십 포인트의{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">59.3%</span>가 기간
                내 사용되지 못함
              </p>
            </div>
          </div>

          {/* 가운데: 막대그래프 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              통신사 멤버십 포인트, 얼마나 사용되지 않았을까요?
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
                  <span className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">{bar.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500">
              * 예시 통계이며 실제 수치와 다를 수 있어요
            </p>
          </div>

          {/* 오른쪽: 1인당 미사용 혜택 표 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">1인당 놓칠 수 있는 혜택은?</p>
            <div className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
              {TABLE_ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">{row.label}</span>
                  <span
                    className={`font-bold ${
                      row.highlight ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">* 실제 계산 로직 연결 예정</p>
          </div>
        </div>
      </div>
    </section>
  );
}
