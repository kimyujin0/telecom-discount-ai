# telecom-discount-ai

통신 요금제·결합할인 추천 AI 서비스입니다. 사용자의 이용 패턴과 조건을 바탕으로 AI가 가장 유리한 요금제와 결합할인 조합을 추천하는 것을 목표로 합니다.

> ⚠️ 현재는 프로젝트 초기 단계로, `create-next-app` 기본 스캐폴드만 세팅된 상태입니다. 추천 로직 등 핵심 기능은 아직 구현되어 있지 않습니다.

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [ESLint](https://eslint.org/)

## 시작하기

개발 서버를 실행합니다:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인할 수 있습니다.

`app/page.tsx` 파일을 수정하면서 페이지를 편집할 수 있으며, 파일을 저장하면 자동으로 반영됩니다.

## 주요 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |

## 프로젝트 구조

```
app/            # App Router 페이지 및 레이아웃
public/         # 정적 파일 (이미지 등)
```

## 로드맵

- [ ] 요금제/결합할인 데이터 모델 설계
- [ ] 사용자 이용 패턴 입력 UI
- [ ] AI 기반 추천 로직 연동
- [ ] 추천 결과 화면

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
