import type { Metadata } from "next";
import DiagnosisExperience from "@/components/diagnosis/DiagnosisExperience";
import { loadResumableDiagnosis } from "@/lib/diagnosis/loadResumable";

export const metadata: Metadata = {
  title: "혜택 진단 | 티모산",
  description: "AI 통신비 상담사와 대화하며 나에게 꼭 맞는 통신 혜택을 진단받아보세요.",
};

export default async function DiagnosisChatPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  const { session } = await searchParams;
  // ?session=<uuid> 로 돌아오면(예: 비로그인으로 진단 -> 저장하려고 로그인 -> 복귀) 재진단 없이 저장돼 있던
  // 결과를 그대로 보여준다. 내 세션이 아니거나 결과가 없으면 null이라 평소처럼 처음부터 시작한다.
  const resume = await loadResumableDiagnosis(typeof session === "string" ? session : undefined);

  return <DiagnosisExperience initialResume={resume} />;
}
