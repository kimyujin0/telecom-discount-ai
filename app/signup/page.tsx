import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "회원가입 | 티모산",
  description: "닉네임과 이용 중인 통신사만 알려주시면 맞춤 혜택을 찾아드려요.",
};

/** 가입 후 돌아갈 내부 경로만 허용한다 (오픈 리다이렉트 방지). */
function safeNextPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/mypage";
  return raw;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const nextPath = safeNextPath(next);

  if (user) redirect(nextPath);

  return (
    <AuthLayout
      title="30초면 가입 끝"
      subtitle="닉네임과 이용 중인 통신사만 알려주시면 맞춤 혜택을 찾아드려요."
      footer={{ prompt: "이미 계정이 있으신가요?", linkLabel: "로그인", href: "/login" }}
    >
      <SignupForm nextPath={nextPath} />
    </AuthLayout>
  );
}
