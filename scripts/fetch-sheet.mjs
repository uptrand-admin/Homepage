/**
 * 구글 시트를 읽어 src/data/content.json 을 다시 만든다. 배포할 때만 실행된다.
 *
 *   SHEET_ID=<시트 주소의 긴 문자열> node scripts/fetch-sheet.mjs
 *
 * SHEET_ID 가 없으면 아무것도 하지 않고 그대로 끝난다. 아직 시트를 연결하지
 * 않았거나 로컬에서 인터넷 없이 빌드할 때 저장소에 있는 내용으로 빌드된다.
 *
 * 시트에 문제가 있으면 잘못된 내용으로 배포하는 대신 여기서 실패시킨다.
 * 사이트 일부가 조용히 비어 버리는 것보다 배포가 멈추고 알려주는 편이 낫다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { TABS, fromCsv, tablesToContent } from "./sheet-schema.mjs";

const SOURCE = "src/data/content.json";

/**
 * SHEET_ID 에는 ID 만 넣는 것이 원칙이지만, 주소창의 주소를 통째로 붙여 넣기 쉽다.
 * 주소가 들어와도 ID 를 뽑아 쓰고, 그래도 못 알아보면 무엇을 넣어야 하는지 알려준다.
 */
function readSheetId(raw) {
  const value = raw?.trim();
  if (!value) return null;

  const fromUrl = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromUrl) return fromUrl[1];

  if (/^[a-zA-Z0-9-_]+$/.test(value)) return value;

  throw new Error(
    `SHEET_ID 값을 알아볼 수 없습니다: "${value}"\n` +
      "  시트 주소 전체 또는 그 안의 ID 만 넣어 주세요.\n" +
      "  예) https://docs.google.com/spreadsheets/d/1AbCdEf.../edit\n" +
      "      또는 1AbCdEf...",
  );
}

let SHEET_ID;
try {
  SHEET_ID = readSheetId(process.env.SHEET_ID);
} catch (error) {
  console.error("\n" + (error instanceof Error ? error.message : String(error)) + "\n");
  process.exit(1);
}

if (!SHEET_ID) {
  console.log("[content] SHEET_ID 가 없어 저장소의 content.json 을 그대로 씁니다.");
  process.exit(0);
}

console.log(`[content] 시트 ${SHEET_ID} 에서 내용을 읽습니다.`);

function url(tabName) {
  // SHEET_ENDPOINT 는 시험용으로 다른 주소를 가리키게 할 때만 쓴다.
  const base =
    process.env.SHEET_ENDPOINT ??
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}/gviz/tq?tqx=out:csv`;
  return `${base}&sheet=${encodeURIComponent(tabName)}`;
}

async function loadTab(tabName) {
  const res = await fetch(url(tabName), { redirect: "follow" });

  if (res.status === 404) {
    throw new Error(
      `"${tabName}" 탭을 찾을 수 없습니다. 시트에 이 이름의 탭이 있는지 확인해 주세요.`,
    );
  }
  if (!res.ok) {
    throw new Error(`"${tabName}" 탭을 읽지 못했습니다 (HTTP ${res.status}).`);
  }

  const text = await res.text();

  // 시트가 비공개면 구글이 CSV 대신 로그인 화면(HTML)을 돌려준다.
  if (/^\s*</.test(text)) {
    throw new Error(
      "시트를 읽을 권한이 없습니다. 공유 설정을 \"링크가 있는 모든 사용자 · 뷰어\"로 바꿔 주세요.",
    );
  }

  return fromCsv(text);
}

function checkTable(tab, table) {
  const where = `"${tab.name}" 탭`;

  if (table.length === 0) throw new Error(`${where}이 비어 있습니다.`);

  if (tab.kind === "rows") {
    const header = table[0].map((h) => h.trim());
    const missing = tab.header.filter((h) => !header.includes(h));
    if (missing.length) {
      throw new Error(
        `${where}의 머리글이 다릅니다. 없는 열: ${missing.join(", ")}\n` +
          `  현재 첫 줄: ${header.join(", ")}`,
      );
    }
    if (table.length === 1) throw new Error(`${where}에 내용이 한 줄도 없습니다.`);
  }
}

/** 배포하면 안 되는 상태를 미리 잡는다. */
function checkContent(content) {
  const problems = [];

  /** 주소가 되는 값이라 영문 소문자·숫자·하이픈만 쓸 수 있고 겹치면 안 된다. */
  function checkSlugs(list, what) {
    const seen = new Set();
    for (const item of list) {
      const label = item.title || item.slug || "(제목 없음)";
      if (!item.slug) problems.push(`${what} "${label}"의 주소이름이 비어 있습니다.`);
      else if (!/^[a-z0-9-]+$/.test(item.slug))
        problems.push(`${what} 주소이름 "${item.slug}"에 영문 소문자·숫자·하이픈 외의 글자가 있습니다.`);
      if (seen.has(item.slug)) problems.push(`${what} 주소이름 "${item.slug}"이 두 번 쓰였습니다.`);
      seen.add(item.slug);
      if (!item.title) problems.push(`${what} 주소이름 "${item.slug}"의 제목이 비어 있습니다.`);
    }
  }

  checkSlugs(content.games, "게임");
  checkSlugs(content.albums, "활동 사진");
  checkSlugs(content.timeline, "타임라인");

  if (content.games.length === 0) problems.push("게임이 한 개도 없습니다.");

  /* 타임라인의 수상작이 실제 게임을 가리키는지 확인한다. 잘못 적으면 링크가 404 가 된다. */
  const gameSlugs = new Set(content.games.map((g) => g.slug));
  for (const entry of content.timeline) {
    for (const award of entry.awards) {
      if (award.gameSlug && !gameSlugs.has(award.gameSlug))
        problems.push(
          `타임라인 "${entry.title}"의 수상작 "${award.work}"이 없는 게임 주소이름 "${award.gameSlug}"을 가리킵니다.`,
        );
    }
  }

  /* 아이콘 이름을 잘못 적으면 그 자리만 조용히 비어 버리므로 미리 잡는다. */
  const socialIcons = new Set(["instagram", "github", "youtube", "discord", "steam", "itch"]);
  for (const s of content.socials) {
    if (!socialIcons.has(s.icon))
      problems.push(`SNS "${s.label}"의 아이콘 "${s.icon}"은 쓸 수 없습니다. (${[...socialIcons].join(", ")})`);
  }
  const benefitIcons = new Set(["swords", "graduation-cap", "monitor-play", "users"]);
  for (const b of content.benefits) {
    if (!benefitIcons.has(b.icon))
      problems.push(`혜택 "${b.title}"의 아이콘 "${b.icon}"은 쓸 수 없습니다. (${[...benefitIcons].join(", ")})`);
  }

  if (problems.length) {
    throw new Error("시트 내용에 문제가 있습니다:\n" + problems.map((p) => "  · " + p).join("\n"));
  }
}

try {
  const base = JSON.parse(readFileSync(SOURCE, "utf8"));

  const tables = {};
  for (const tab of TABS) {
    const table = await loadTab(tab.name);
    checkTable(tab, table);
    tables[tab.name] = table;
    console.log(`[content] ${tab.name} — ${Math.max(0, table.length - 1)}줄`);
  }

  const content = tablesToContent(tables, base);
  checkContent(content);

  const before = readFileSync(SOURCE, "utf8");
  const after = JSON.stringify(content, null, 2) + "\n";
  writeFileSync(SOURCE, after, "utf8");

  console.log(
    before === after
      ? "[content] 시트 내용이 저장소와 같습니다. 바뀐 것 없음."
      : "[content] 시트 내용으로 갱신했습니다.",
  );
} catch (error) {
  // 프로그래머용 스택 대신 고칠 곳을 알려주는 문장만 남긴다.
  console.error("\n────────────────────────────────────────");
  console.error("시트를 읽지 못해 배포를 멈췄습니다.\n");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("\n시트를 고친 뒤 Actions 탭에서 다시 실행해 주세요.");
  console.error("────────────────────────────────────────\n");
  process.exit(1);
}
