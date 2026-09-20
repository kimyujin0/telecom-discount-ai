import { NextResponse } from "next/server";
import { loadResumableDiagnosis } from "@/lib/diagnosis/loadResumable";

export const runtime = "nodejs";

// GET /api/diagnose/resume?session=<uuid> — 저장돼 있던 진단 결과를 돌려준다.
//
// /diagnosis/chat 페이지는 서버에서 같은 조회(loadResumableDiagnosis)를 해서 결과 화면으로 바로 시작하지만,
// 브라우저 "뒤로가기"는 Next가 그 히스토리 항목의 예전 서버 화면(세션 없는 /diagnosis/chat)을 캐시에서 그대로
// 되살려서 서버 조회를 거치지 않는다. 그때 주소창의 ?session=을 보고 클라이언트가 이 API로 결과를 다시 가져온다.
//
// 소유권 검사(내 계정의 세션 또는 이 브라우저 쿠키가 만든 비로그인 세션)는 loadResumableDiagnosis가 그대로 한다.
// 내 것이 아니거나 없거나 아직 결과가 없으면 전부 똑같이 404 — 남의 세션 id가 유효한지 알려주지 않는다.

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const session = new URL(request.url).searchParams.get("session") ?? undefined;
  const resume = await loadResumableDiagnosis(session);

  if (!resume) return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  return NextResponse.json(resume, { headers: NO_STORE });
}
