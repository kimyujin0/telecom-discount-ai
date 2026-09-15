import type { Metadata } from "next";
import DiagnosisExperience from "@/components/diagnosis/DiagnosisExperience";

export const metadata: Metadata = {
  title: "혜택 진단 | 하겸이를 위한 혜택",
  description: "AI 통신비 상담사와 대화하며 나에게 꼭 맞는 통신 혜택을 진단받아보세요.",
};

export default function DiagnosisChatPage() {
  return <DiagnosisExperience />;
}
