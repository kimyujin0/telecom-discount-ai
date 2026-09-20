import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";
import { buildAuthSearch, safeNextPath } from "@/lib/auth/nextPath";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid, parseResumeSessionId } from "@/lib/diagnosis/resume";

export const metadata: Metadata = {
  title: "회원가입 | 티모산",
  description: "닉네임과 이용 중인 통신사만 알려주시면 맞춤 혜택을 찾아드려요.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string }>;
}) {
  const [{ next, claim }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const nextPath = safeNextPath(next);
  // 가입에 성공하면 그 계정으로 연결할 비로그인 진단 세션 (형식이 UUID가 아니면 무시).
  const claimSessionId = isUuid(claim) ? claim : null;
  // 로그인 <-> 회원가입 전환 링크에도 next/claim을 이어준다.
  const authSearch = buildAuthSearch(next ? nextPath : null, claimSessionId);

  if (user) redirect(nextPath);

  return (
    <AuthLayout
      title="30초면 가입 끝"
      subtitle={
        parseResumeSessionId(nextPath)
          ? "가입하면 방금 본 진단 결과로 돌아가서 혜택을 저장할 수 있어요."
          : claimSessionId
            ? "가입하면 방금 본 진단 결과가 내 계정에 저장돼요. 마이페이지에서 언제든 다시 볼 수 있어요."
            : "닉네임과 이용 중인 통신사만 알려주시면 맞춤 혜택을 찾아드려요."
      }
      footer={{ prompt: "이미 계정이 있으신가요?", linkLabel: "로그인", href: `/login${authSearch}` }}
    >
      <SignupForm nextPath={nextPath} claimSessionId={claimSessionId} />
    </AuthLayout>
  );
}
