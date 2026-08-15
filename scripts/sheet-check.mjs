/**
 * 구글 시트가 배포에 쓸 수 있는 상태인지 미리 본다. 아무것도 고치지 않는다.
 *
 *   SHEET_ID=<시트 주소 또는 그 안의 ID> npm run sheet:check
 *
 * 배포(fetch-sheet.mjs)와 같은 판정을 쓰므로, 여기서 모두 정상이면 배포도 통과한다.
 * 시트를 크게 손본 뒤 사이트 업데이트를 누르기 전에 돌려 보면 좋다.
 */
import { TABS, tablesToContent } from "./sheet-schema.mjs";
import { loadAllTabs, readSheetId } from "./sheet-io.mjs";
import { readFileSync } from "node:fs";

const SOURCE = "src/data/content.json";

let SHEET_ID;
try {
  SHEET_ID = readSheetId(process.env.SHEET_ID);
} catch (error) {
  console.error("\n" + (error instanceof Error ? error.message : String(error)) + "\n");
  process.exit(1);
}

if (!SHEET_ID) {
  console.error(
    "\nSHEET_ID 가 없습니다. 시트 주소를 넣어 다시 실행해 주세요.\n" +
      '  예) SHEET_ID="https://docs.google.com/spreadsheets/d/1AbC.../edit" npm run sheet:check\n',
  );
  process.exit(1);
}

console.log(`\n시트 ${SHEET_ID} 를 점검합니다.\n`);

const loaded = await loadAllTabs(SHEET_ID, TABS);

/* 탭별 요약 표 */
const width = Math.max(...TABS.map((t) => [...t.name].length)) + 2;
console.log("  " + "탭".padEnd(width) + "줄 수".padStart(6) + "   상태");
console.log("  " + "─".repeat(width + 20));

for (const { tab, table, errors, notes } of loaded) {
  const rows = table ? Math.max(0, table.length - 1) : 0;
  const mark = errors.length ? "문제 " + errors.length + "건" : notes.length ? "알림" : "정상";
  console.log("  " + tab.name.padEnd(width) + String(rows).padStart(6) + "   " + mark);
}

const noted = loaded.filter((r) => r.errors.length === 0 && r.notes.length > 0);
if (noted.length) {
  console.log("\n알림 (배포는 됩니다)");
  for (const { tab, notes } of noted) {
    for (const n of notes) console.log(`  · [${tab.name}] ${n}`);
  }
}

const broken = loaded.filter((r) => r.errors.length > 0);

if (broken.length) {
  console.log("\n" + "─".repeat(52));
  for (const { tab, errors } of broken) {
    console.log(`\n[${tab.name}]`);
    for (const p of errors) console.log("  · " + p);
  }
  console.log(
    "\n" +
      "─".repeat(52) +
      "\n고치는 법: 해당 탭의 내용을 지우고, 저장소 sheet-template 폴더의\n" +
      "같은 이름 CSV 를 파일 → 가져오기 → 현재 시트 바꾸기 로 넣으세요.\n" +
      "구분 문자는 쉼표로 지정합니다. 붙여넣기(Ctrl+V)는 칸 안의 줄바꿈이 깨집니다.\n",
  );
  process.exit(1);
}

/* 탭 모양이 멀쩡해도 내용이 어긋날 수 있으므로 한 번 더 조립해 본다. */
const tables = Object.fromEntries(loaded.map(({ tab, table }) => [tab.name, table]));
const content = tablesToContent(tables, JSON.parse(readFileSync(SOURCE, "utf8")));

const counts = [
  ["게임", content.games.length],
  ["활동 사진", content.albums.length],
  ["타임라인", content.timeline.length],
  ["혜택", content.benefits.length],
];

console.log("\n모든 탭이 정상입니다.\n");
console.log("  읽어 들인 내용");
for (const [label, n] of counts) console.log(`    ${label.padEnd(8)} ${n}건`);
console.log(
  `\n  모집 상태  ${content.join.isOpen ? "모집 중" : "모집 아님"}` +
    `\n  대표 제목  ${content.site.heroTitle1} / ${content.site.heroTitle2}\n`,
);
