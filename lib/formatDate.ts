/** 마이페이지/진단 상세에서 공통으로 쓰는 날짜 표기 ("2026년 9월 19일"). */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
