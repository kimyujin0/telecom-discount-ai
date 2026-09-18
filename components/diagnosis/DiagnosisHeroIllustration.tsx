import Image from "next/image";

/**
 * 진단 인트로 히어로 우측 이미지 — 디자인팀이 제공한 AI 상담 채팅 목업(public/diagnosis-hero.png)을
 * 그대로 보여준다. 예전에는 CSS로 만든 스마트폰 카드 + 우측 분석 항목 배지 3개(데이터 사용량 분석/
 * 이용 패턴 파악/맞춤 혜택 추천)였지만, 이 이미지 자체에 로봇·말풍선·아이콘 장식이 다 들어있어
 * 그 위에 별도 배지를 얹으면 오히려 중복돼 보여 배지는 없앴다(디자인 판단 — README/PR 참고).
 */
export default function DiagnosisHeroIllustration() {
  return (
    <div className="mx-auto w-full max-w-lg min-w-0">
      <Image
        src="/diagnosis-hero.png"
        alt="AI 통신비 상담사가 채팅으로 통신사와 생활 패턴을 물어보는 화면"
        width={922}
        height={414}
        priority
        className="h-auto w-full"
      />
    </div>
  );
}
