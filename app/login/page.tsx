import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth/nextPath";
import { getCurrentUser } from "@/lib/auth/session";
import { parseResumeSessionId } from "@/lib/diagnosis/resume";

export const metadata: Metadata = {
  title: "로그인 | 티모산",
  description: "이메일과 비밀번호로 로그인하고 나에게 맞는 통신 혜택을 관리해보세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const nextPath = safeNextPath(next);
  // 로그인 <-> 회원가입 전환 링크에도 next를 이어준다 — 안 그러면 회원가입 쪽으로 넘어간 순간
  // "결과 화면으로 복귀 + 비로그인 진단 연결"이 끊긴다.
  const nextQuery = next ? `?next=${encodeURIComponent(nextPath)}` : "";

  // 이미 로그인한 상태로 /login에 오면 곧장 목적지로 보낸다.
  if (user) redirect(nextPath);

  return (
    <AuthLayout
      title="다시 만나서 반가워요"
      subtitle={
        parseResumeSessionId(nextPath)
          ? "로그인하면 방금 본 진단 결과로 돌아가서 혜택을 저장할 수 있어요."
          : "로그인하면 진단 이력과 이용 통신사를 저장해드려요."
      }
      footer={{ prompt: "아직 계정이 없으신가요?", linkLabel: "회원가입", href: `/signup${nextQuery}` }}
    >
      <LoginForm nextPath={nextPath} />
    </AuthLayout>
  );
}
