import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";
import { safeNextPath } from "@/lib/auth/nextPath";
import { getCurrentUser } from "@/lib/auth/session";
import { parseResumeSessionId } from "@/lib/diagnosis/resume";

export const metadata: Metadata = {
  title: "회원가입 | 티모산",
  description: "닉네임과 이용 중인 통신사만 알려주시면 맞춤 혜택을 찾아드려요.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const nextPath = safeNextPath(next);
  // 로그인 <-> 회원가입 전환 링크에도 next를 이어준다 — 안 그러면 회원가입 쪽으로 넘어간 순간
  // "결과 화면으로 복귀 + 비로그인 진단 연결"이 끊긴다.
  const nextQuery = next ? `?next=${encodeURIComponent(nextPath)}` : "";

  if (user) redirect(nextPath);

  return (
    <AuthLayout
      title="30초면 가입 끝"
      subtitle={
        parseResumeSessionId(nextPath)
          ? "가입하면 방금 본 진단 결과로 돌아가서 혜택을 저장할 수 있어요."
          : "닉네임과 이용 중인 통신사만 알려주시면 맞춤 혜택을 찾아드려요."
      }
      footer={{ prompt: "이미 계정이 있으신가요?", linkLabel: "로그인", href: `/login${nextQuery}` }}
    >
      <SignupForm nextPath={nextPath} />
    </AuthLayout>
  );
}
