/**
 * 구글 시트를 읽어 src/data/content.json 을 다시 만든다. 배포할 때만 실행된다.
 *
 *   SHEET_ID=<시트 주소 또는 그 안의 ID> node scripts/fetch-sheet.mjs
 *
 * SHEET_ID 가 없으면 아무것도 하지 않고 그대로 끝난다. 아직 시트를 연결하지
 * 않았거나 로컬에서 인터넷 없이 빌드할 때 저장소에 있는 내용으로 빌드된다.
 *
 * 시트에 문제가 있으면 잘못된 내용으로 배포하는 대신 여기서 실패시킨다.
 * 사이트 일부가 조용히 비어 버리는 것보다 배포가 멈추고 알려주는 편이 낫다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { TABS, tablesToContent } from "./sheet-schema.mjs";
import { loadAllTabs, readSheetId } from "./sheet-io.mjs";

const SOURCE = "src/data/content.json";

function stop(message) {
  // 프로그래머용 스택 대신 고칠 곳을 알려주는 문장만 남긴다.
  console.error("\n────────────────────────────────────────");
  console.error("시트를 읽지 못해 배포를 멈췄습니다.\n");
  console.error(message);
  console.error("\n시트를 고친 뒤 Actions 탭에서 다시 실행해 주세요.");
  console.error("────────────────────────────────────────\n");
  process.exit(1);
}

let SHEET_ID;
try {
  SHEET_ID = readSheetId(process.env.SHEET_ID);
} catch (error) {
  stop(error instanceof Error ? error.message : String(error));
}

if (!SHEET_ID) {
  console.log("[content] SHEET_ID 가 없어 저장소의 content.json 을 그대로 씁니다.");
  process.exit(0);
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

  return problems;
}

console.log(`[content] 시트 ${SHEET_ID} 에서 내용을 읽습니다.`);

/* 한 탭이 잘못돼도 멈추지 않고 전부 본다. 고치고 다시 돌리기를 반복하지 않도록. */
const loaded = await loadAllTabs(SHEET_ID, TABS);
const broken = loaded.filter((r) => r.problems.length > 0);

if (broken.length) {
  const lines = broken.map(
    (r) => `[${r.tab.name}]\n` + r.problems.map((p) => "  · " + p).join("\n"),
  );
  stop(
    `탭 ${broken.length}개에 문제가 있습니다.\n\n` +
      lines.join("\n\n") +
      "\n\n정상인 탭: " +
      (loaded.length - broken.length) +
      "개",
  );
}

for (const { tab, table } of loaded) {
  console.log(`[content] ${tab.name} — ${Math.max(0, table.length - 1)}줄`);
}

const tables = Object.fromEntries(loaded.map(({ tab, table }) => [tab.name, table]));
const base = JSON.parse(readFileSync(SOURCE, "utf8"));
const content = tablesToContent(tables, base);

const contentProblems = checkContent(content);
if (contentProblems.length) {
  stop("시트 내용에 문제가 있습니다:\n" + contentProblems.map((p) => "  · " + p).join("\n"));
}

const before = readFileSync(SOURCE, "utf8");
const after = JSON.stringify(content, null, 2) + "\n";
writeFileSync(SOURCE, after, "utf8");

console.log(
  before === after
    ? "[content] 시트 내용이 저장소와 같습니다. 바뀐 것 없음."
    : "[content] 시트 내용으로 갱신했습니다.",
);
