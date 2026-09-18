import Image from "next/image";

/** 통신사별 혜택 페이지 히어로 이미지. 기존 CSS 목업(SKT/KT/U+ 카드 재현)을 디자인 목업 이미지로 교체. */
export default function CarrierHeroIllustration() {
  return (
    <div className="mx-auto w-full max-w-md sm:max-w-lg">
      <Image
        src="/carriers-hero.png"
        alt="SKT, KT, LG U+ 통신사별 혜택을 한눈에"
        width={752}
        height={298}
        priority
        className="h-auto w-full"
      />
    </div>
  );
}
