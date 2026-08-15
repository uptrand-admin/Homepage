/**
 * content.json 을 구글 시트 양식(탭별 CSV)으로 내보낸다.
 *
 *   node scripts/sheet-template.mjs
 *
 * 만들어진 sheet-template/*.csv 를 구글 시트의 같은 이름 탭에 각각 가져오면
 * 지금 사이트에 올라간 내용 그대로 편집을 시작할 수 있다.
 *
 * 내보낸 뒤 곧바로 다시 읽어 원본과 같은지 확인한다. 여기서 어긋나면
 * 양식과 읽는 코드가 맞지 않는다는 뜻이므로 실패로 끝낸다.
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { TABS, toCsv, fromCsv, contentToTables, tablesToContent } from "./sheet-schema.mjs";

const OUT = "sheet-template";
const SOURCE = "src/data/content.json";

function diff(a, b, path = "") {
  if (a === b) return null;
  if (typeof a !== typeof b || a === null || b === null) return `${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`;
  if (Array.isArray(a) !== Array.isArray(b)) return `${path}: 배열 여부 불일치`;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return `${path}: 길이 ${a.length} ≠ ${b.length}`;
    for (let i = 0; i < a.length; i += 1) {
      const d = diff(a[i], b[i], `${path}[${i}]`);
      if (d) return d;
    }
    return null;
  }

  if (typeof a === "object") {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const d = diff(a[k], b[k], path ? `${path}.${k}` : k);
      if (d) return d;
    }
    return null;
  }

  return `${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`;
}

const base = JSON.parse(readFileSync(SOURCE, "utf8"));

/* 시트를 한 번 거친 모양으로 맞춘다. 시트에 없는 열은 기본값이 채워진다. */
const normalized = tablesToContent(contentToTables(base), base);

/* 같은 과정을 한 번 더 돌려도 결과가 그대로여야 한다. */
const again = tablesToContent(contentToTables(normalized), normalized);
const mismatch = diff(normalized, again);
if (mismatch) {
  console.error("양식과 읽는 코드가 어긋납니다: " + mismatch);
  process.exit(1);
}

/* CSV 로 내보낸 뒤 문자열 단계까지 거쳐 다시 읽어도 같은지 확인한다. */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const tables = contentToTables(normalized);
const reparsed = {};

for (const tab of TABS) {
  const csv = toCsv(tables[tab.name]);
  writeFileSync(join(OUT, `${tab.name}.csv`), "﻿" + csv, "utf8");
  reparsed[tab.name] = fromCsv(csv);
}

const viaCsv = tablesToContent(reparsed, normalized);
const csvMismatch = diff(normalized, viaCsv);
if (csvMismatch) {
  console.error("CSV 를 거치며 값이 바뀝니다: " + csvMismatch);
  process.exit(1);
}

writeFileSync(SOURCE, JSON.stringify(normalized, null, 2) + "\n", "utf8");

console.log(`${OUT}/ 에 탭 ${TABS.length}개 양식을 만들었습니다.`);
console.log(TABS.map((t) => `  · ${t.name}.csv`).join("\n"));
console.log("왕복 검증 통과: 시트에 넣었다 빼도 내용이 그대로입니다.");
