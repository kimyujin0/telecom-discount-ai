const FENCE_REGEX = /```diagnosis-result\s*([\s\S]*?)```/;

export interface ParsedAssistantTurn {
  /** 사용자에게 실제로 보여줄 자연어 텍스트 (코드 블록 제외) */
  visibleText: string;
  diagnosis: { personaKey: string; description: string } | null;
}

/**
 * 모델 응답 전체 텍스트에서 ```diagnosis-result 코드 블록을 분리한다.
 * 코드 블록이 없거나 JSON 파싱에 실패하면 diagnosis는 null.
 */
export function parseAssistantTurn(fullText: string): ParsedAssistantTurn {
  const match = fullText.match(FENCE_REGEX);
  if (!match || match.index === undefined) {
    return { visibleText: fullText.trim(), diagnosis: null };
  }

  const visibleText = fullText.slice(0, match.index).trim();

  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed.personaKey === "string" && typeof parsed.description === "string") {
      return { visibleText, diagnosis: { personaKey: parsed.personaKey, description: parsed.description } };
    }
  } catch {
    // JSON 파싱 실패 — 진단 미완료로 취급하고 텍스트만 사용
  }

  return { visibleText, diagnosis: null };
}
