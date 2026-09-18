import Image from "next/image";

/**
 * 메인 히어로 우측 이미지 — 디자인팀이 제공한 스마트폰+멤버십 카드+포인트 목업(public/main-hero.png)을
 * 그대로 보여준다. 예전에는 CSS로 만든 카드/말풍선/코인 배지 일러스트였지만, 이 이미지 자체에 같은
 * 구성(SKT/KT/LG U+ 카드, 퍼센트·포인트 배지, "놓치고 있던 혜택을 찾아드려요!" 말풍선)이 다 들어있어
 * 통째로 교체했다.
 */
export default function PhoneMockupIllustration() {
  return (
    <div className="mx-auto w-full max-w-md min-w-0">
      <Image
        src="/main-hero.png"
        alt="SKT, KT, LG U+ 멤버십 할인과 포인트 혜택을 놓치지 말라고 알려주는 스마트폰 일러스트"
        width={671}
        height={459}
        priority
        className="h-auto w-full"
      />
    </div>
  );
}
