import { Bot, Gift, Percent } from "lucide-react";

/** 진단 인트로(1단계) 우측 일러스트 — 로봇 아이콘 + 스마트폰 채팅 말풍선 예시. CSS만으로 구성한다. */
export default function DiagnosisHeroIllustration() {
  return (
    <div className="relative mx-auto flex h-80 w-full max-w-lg items-center justify-center sm:h-96">
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary-50 via-primary-100/60 to-primary-200/40 dark:from-primary-500/5 dark:via-primary-500/10 dark:to-primary-500/5" />

      {/* 스마트폰 프레임 */}
      <div className="relative flex w-72 -rotate-1 flex-col gap-3 rounded-[2rem] border border-primary-100 bg-white p-4 shadow-2xl shadow-primary-900/15 sm:w-80 dark:border-primary-500/20 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
            <Bot className="h-4.5 w-4.5" />
          </span>
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">AI 통신비 상담사</span>
        </div>

        {/* AI 질문 말풍선 */}
        <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-primary-50 px-3.5 py-2.5 text-[13px] leading-relaxed font-medium text-primary-800 dark:bg-primary-500/10 dark:text-primary-300">
          지금 사용 중인 통신사와 생활 패턴을 알려주시면 맞춤 혜택을 찾아드릴게요!
        </div>

        {/* 사용자 답변 예시 말풍선 */}
        <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-primary-700 px-3.5 py-2.5 text-[13px] leading-relaxed font-medium text-white">
          예) 저는 데이터는 거의 안 쓰고, 넷플릭스를 결합해서 보고 있어요.
        </div>
      </div>

      {/* 퍼센트 배지 */}
      <span className="absolute top-6 right-2 flex h-12 w-12 -rotate-6 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-lg sm:right-8">
        <Percent className="h-6 w-6" />
      </span>

      {/* 선물 배지 */}
      <span className="absolute bottom-8 right-4 flex h-11 w-11 rotate-6 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-lg sm:right-10 dark:bg-zinc-800 dark:text-primary-400">
        <Gift className="h-5 w-5" />
      </span>
    </div>
  );
}
