import { ArrowLeft, ArrowRight, Bot, Check, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// 5단계 설명 섹션 — 실제로 동작하지 않는 정적 스마트폰 화면 목업이다(혜택진단2.png 참고).
// 예시로 쓰인 넷플릭스/데이터 절약 요금제/해외 로밍 할인 수치는 목업 데모용 값이며 실제 데이터가 아니다.

const STEPS: { title: string; description: string }[] = [
  { title: "자유롭게 상황을 말해주세요", description: "채팅으로 내 상황을 편하게 입력해요." },
  { title: "AI가 핵심 정보를 분석해요", description: "문장에서 필요한 정보를 추출하고, 추가 질문이 필요하면 물어봐요." },
  { title: "맞춤 혜택을 진단해드려요", description: "내 상황에 맞는 통신사 혜택과 절약 금액을 알려드려요." },
  { title: "추가로 궁금한 점을 확인해요", description: "조건을 바꿔가며 더 자세한 혜택도 확인할 수 있어요." },
  { title: "결과를 저장하고 바로 적용해요", description: "진단 결과를 저장하고, 바로 혜택 페이지로 이동할 수 있어요." },
];

function PhoneShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-[360px] w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
        <ArrowLeft className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">{title}</span>
        <X className="h-3.5 w-3.5 text-zinc-400" />
      </div>
      <div className="flex-1 overflow-hidden p-3">{children}</div>
    </div>
  );
}

function StepChatInputMock() {
  return (
    <PhoneShell title="혜택 진단">
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-start gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
            <Bot className="h-3 w-3" />
          </span>
          <p className="rounded-xl rounded-tl-sm bg-zinc-100 px-2.5 py-1.5 text-[9.5px] leading-snug text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            안녕하세요! 지금 어떤 혜택이 필요하신지 자유롭게 말씀해주세요.
          </p>
        </div>
        <p className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-primary-700 px-2.5 py-1.5 text-[9.5px] leading-snug text-white">
          데이터는 거의 안 쓰고, 넷플릭스는 결합해서 보고 있어요
        </p>
        <div className="flex items-start gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
            <Bot className="h-3 w-3" />
          </span>
          <p className="rounded-xl rounded-tl-sm bg-zinc-100 px-2.5 py-1.5 text-[9.5px] leading-snug text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            좋아요! 말씀해주신 내용을 바탕으로 분석해볼게요.
          </p>
        </div>
        <div className="mt-auto flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-[9px] text-zinc-400">메시지를 입력해주세요...</span>
        </div>
      </div>
    </PhoneShell>
  );
}

function StepAnalyzingMock() {
  const checklist = ["데이터 사용량 분석 중", "OTT 이용 여부 확인 중", "해외 이용 가능성 분석 중", "통신사·요금제 검토 중"];
  return (
    <PhoneShell title="혜택 진단">
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white">
          <Bot className="h-4.5 w-4.5" />
        </span>
        <p className="text-[10.5px] leading-snug font-bold text-zinc-800 dark:text-zinc-100">
          AI가 당신의 사용 패턴을
          <br />
          분석하고 있어요...
        </p>
        <div className="w-full space-y-1.5">
          {checklist.map((item) => (
            <div
              key={item}
              className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-2 py-1.5 text-[9px] font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

function StepResultMock() {
  const benefits = [
    { icon: "N", label: "넷플릭스 결합 할인", value: "월 5,000원 할인" },
    { icon: "📶", label: "데이터 절약 요금제", value: "월 10,000원 절약" },
    { icon: "✈️", label: "해외 로밍 할인", value: "최대 50% 할인" },
  ];
  return (
    <PhoneShell title="혜택 진단">
      <div className="flex h-full flex-col gap-2">
        <p className="text-[10.5px] font-extrabold text-zinc-900 dark:text-zinc-50">분석이 완료되었어요!</p>
        <div className="rounded-xl bg-primary-50 p-2 dark:bg-primary-500/10">
          <p className="text-[8.5px] font-semibold text-primary-700 dark:text-primary-300">예상 연간 절약 금액</p>
          <p className="text-[15px] font-extrabold text-primary-700 dark:text-primary-300">약 248,000원</p>
        </div>
        <div className="space-y-1.5">
          {benefits.map((b) => (
            <div
              key={b.label}
              className="flex items-center justify-between rounded-lg border border-zinc-100 px-2 py-1.5 dark:border-zinc-800"
            >
              <span className="flex items-center gap-1.5 text-[9px] font-semibold text-zinc-700 dark:text-zinc-200">
                <span aria-hidden>{b.icon}</span>
                {b.label}
              </span>
              <span className="text-[8.5px] font-bold text-primary-700 dark:text-primary-300">{b.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-full bg-primary-700 py-1.5 text-center text-[9.5px] font-bold text-white">
          자세히 보기 →
        </div>
      </div>
    </PhoneShell>
  );
}

function StepDetailMock() {
  return (
    <PhoneShell title="혜택 상세보기">
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[10px] font-extrabold text-white">
            N
          </span>
          <p className="text-[10px] font-extrabold text-zinc-900 dark:text-zinc-50">넷플릭스 결합 할인</p>
        </div>
        <div className="flex gap-1">
          {["KT", "U+"].map((c) => (
            <span
              key={c}
              className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[7.5px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="space-y-1 rounded-lg bg-zinc-50 p-2 text-[8.5px] leading-relaxed text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
          <p>· 넷플릭스 프리미엄 요금제 사용 시</p>
          <p>· 통신사 결합 할인 적용</p>
          <p>· 월 최대 5,000원 할인(최대 12개월)</p>
        </div>
        <div className="rounded-full bg-primary-700 py-1.5 text-center text-[9px] font-bold text-white">
          이 혜택 바로 확인하기
        </div>
        <p className="text-[8px] font-semibold text-zinc-400">다른 통신사 혜택도 궁금하다면?</p>
        <div className="flex gap-1">
          {["SKT", "KT", "U+"].map((c) => (
            <div
              key={c}
              className="flex-1 rounded-lg border border-zinc-100 py-1 text-center text-[7.5px] font-bold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

function StepSavedMock() {
  const summary = [
    { label: "넷플릭스 결합 할인", value: "월 5,000원" },
    { label: "데이터 절약 요금제", value: "월 10,000원" },
    { label: "해외 로밍 할인", value: "최대 50%" },
  ];
  return (
    <PhoneShell title="혜택 진단 결과">
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          <p className="text-[10px] leading-snug font-extrabold text-zinc-900 dark:text-zinc-50">
            당신의 맞춤 혜택이 저장되었어요!
          </p>
        </div>
        <div className="space-y-1 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/60">
          {summary.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-[8.5px]">
              <span className="text-zinc-600 dark:text-zinc-300">{s.label}</span>
              <span className="font-bold text-primary-700 dark:text-primary-300">{s.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-1.5">
          <div className="rounded-full bg-primary-700 py-1.5 text-center text-[9px] font-bold text-white">
            마이페이지에서 확인하기
          </div>
          <div className="rounded-full border border-zinc-200 py-1.5 text-center text-[9px] font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            다시 진단하기
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

const MOCKUPS = [StepChatInputMock, StepAnalyzingMock, StepResultMock, StepDetailMock, StepSavedMock];

export default function HowItWorksSteps() {
  return (
    <section className="bg-zinc-50 py-16 sm:py-20 dark:bg-zinc-900/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xl font-extrabold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          혜택 진단, 이렇게 진행돼요
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => {
            const Mockup = MOCKUPS[index];
            return (
              <div key={step.title}>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-extrabold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm leading-snug font-bold text-zinc-900 dark:text-zinc-50">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{step.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Mockup />
                </div>
              </div>
            );
          })}
        </div>

        {/* 페이지 전체의 마지막 CTA — 원래 WhyGoodSection 하단에 있었지만, 5단계 설명까지 다 본 뒤
            누르도록 페이지 최하단으로 옮겼다. */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/diagnosis/chat"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary-900/15 transition hover:bg-primary-800 active:scale-[0.98]"
          >
            지금 맞춤 혜택 진단하러가기
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
