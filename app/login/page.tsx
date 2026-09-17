import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "로그인 | 티모산",
  description: "이메일과 비밀번호로 로그인하고 나에게 맞는 통신 혜택을 관리해보세요.",
};

/** 로그인 후 돌아갈 내부 경로만 허용한다 (오픈 리다이렉트 방지). */
function safeNextPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/mypage";
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const nextPath = safeNextPath(next);

  // 이미 로그인한 상태로 /login에 오면 곧장 목적지로 보낸다.
  if (user) redirect(nextPath);

  return (
    <AuthLayout
      title="다시 만나서 반가워요"
      subtitle="로그인하면 진단 이력과 이용 통신사를 저장해드려요."
      footer={{ prompt: "아직 계정이 없으신가요?", linkLabel: "회원가입", href: "/signup" }}
    >
      <LoginForm nextPath={nextPath} />
    </AuthLayout>
  );
}
