import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 127.0.0.1로 접속하면 기본 cross-origin 보호에 걸려 /_next/hmr 요청이 막히고,
  // 그 여파로 클라이언트 하이드레이션 자체가 조용히 실패한다(정적 HTML만 보이고 아무 인터랙션도
  // 안 먹힘). localhost로 접속하면 문제 없지만, 127.0.0.1로 접속해도 동일하게 동작하도록 허용한다.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
