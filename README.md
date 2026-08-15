# UPTRAND 홈페이지

게임 개발 동아리 UPTRAND 의 공식 홈페이지입니다. Next.js(App Router) + TypeScript + Tailwind CSS v4 로 만들어졌고, 모든 페이지가 정적으로 생성되어 GitHub Pages 에 배포됩니다.

## 운영하시는 분께

홈페이지 내용은 **구글 시트에서 수정합니다.** 코드나 git 을 볼 필요가 없습니다.

```
구글 시트 수정  →  [사이트 업데이트] 실행  →  1~2분 뒤 반영
```

자세한 방법, 시트 탭 설명, 문제 해결은 **[관리자 매뉴얼](docs/관리자-매뉴얼.md)** 에 정리되어 있습니다.

## 구조

```
src/
├─ app/
│  ├─ page.tsx            메인 (Hero · Games · About · Timeline · Benefits · Join)
│  └─ games/[slug]/       게임별 전용 페이지 (공유 시 미리보기용)
├─ components/            섹션과 공용 UI
├─ data/
│  ├─ content.json        사이트의 유일한 콘텐츠 원본 (시트에서 생성됨)
│  └─ content.ts          타입을 입혀 내보내는 래퍼
└─ lib/asset.ts           public/ 이미지 경로에 배포 경로를 붙임
scripts/
├─ sheet-schema.mjs       시트 탭·열 정의 (양식 생성과 읽기 공용)
├─ fetch-sheet.mjs        시트 → content.json (검증 포함)
├─ sheet-template.mjs     content.json → 시트 양식 CSV (왕복 검증 포함)
└─ flatten-prefetch.mjs   Next.js 정적 내보내기 버그 우회
sheet-template/           구글 시트로 가져올 CSV 9개
docs/관리자-매뉴얼.md      운영자용 문서
```

## 개발

```bash
npm install
```

```bash
npm run dev
```

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm run build` | 정적 사이트를 `out/` 에 생성 |
| `npm run content` | 구글 시트를 읽어 `content.json` 갱신 (`SHEET_ID` 필요) |
| `npm run sheet:template` | 현재 내용으로 시트 양식 CSV 재생성 |

`SHEET_ID` 가 없으면 시트를 건너뛰고 저장소의 `content.json` 으로 빌드하므로, 인터넷 없이도 개발할 수 있습니다.

## 배포

`master` 에 푸시하거나 Actions 에서 수동 실행하면 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 이 시트를 읽어 빌드하고 GitHub Pages 에 올립니다. 하루 두 번 자동 실행도 걸려 있습니다.

처음 설정하는 방법은 [관리자 매뉴얼 7번](docs/관리자-매뉴얼.md#7-처음-한-번만-하는-설정) 을 보세요.

## 디자인 기준

- 색·타이포·간격 등 세부 스타일은 확정된 시안 HTML 기준입니다. 헤더 60px, h1 64px/자간 -1px, 본문 18.4px/행간 1.7 등이 그 수치입니다.
- 화면 구성(어떤 섹션에 무엇이 있는지)은 발전 시안(와이어프레임) 기준입니다.
- 디자인 토큰은 [`src/app/globals.css`](src/app/globals.css) 상단 `@theme` 블록에 있습니다.
