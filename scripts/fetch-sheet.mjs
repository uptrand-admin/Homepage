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
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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

/**
 * public 아래에서 그 경로에 해당하는 진짜 파일 경로를 찾는다. 없으면 null.
 *
 * 한 조각씩 내려가며 실제 이름과 맞춰 본다. 정확히 같은 이름이 없으면 대소문자만
 * 다른 것을 찾아 그 이름을 쓴다. 한글 이름은 자모를 쪼개 저장하는 운영체제가 있어
 * 같은 글자라도 바이트가 다를 수 있으므로 NFC 로 맞춘 뒤 비교한다.
 *
 * existsSync 로 확인하지 않는 이유: 윈도우는 대소문자를 가리지 않아서 "Images" 도
 * 있다고 답한다. 그러면 정작 고쳐야 할 때 그대로 통과해 버린다.
 */
const key = (s) => s.normalize("NFC").toLowerCase();

function realPath(src) {
  let dir = "public";
  const found = [];

  for (const segment of src.slice(1).split("/")) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return null;
    }

    const match = entries.includes(segment)
      ? segment
      : entries.find((e) => key(e) === key(segment));
    if (!match) return null;

    found.push(match);
    dir = join(dir, match);
  }

  return "/" + found.join("/");
}

/**
 * 시트에 적힌 그림 경로를 저장소에 있는 진짜 파일 이름에 맞춘다.
 *
 * 배포되는 곳은 대소문자를 가리므로 Images 와 images 는 서로 다른 폴더다.
 * 그런데 윈도우에서는 둘이 같은 폴더라, 적는 사람도 확인하는 사람도 로컬에서는
 * 아무 이상을 못 느낀다. 그래서 지적하는 대신 여기서 실제 이름으로 바꿔 준다.
 *
 * 정말로 없는 파일은 그 자리만 조용히 비므로 경고를 남긴다. 배포를 막지는 않는다.
 * 그림 한 장 때문에 사이트 전체가 옛날 내용으로 남는 편이 더 나쁘다.
 */
function fixImagePaths(content) {
  const spots = [];
  const add = (get, set, where) => {
    const src = get();
    if (src && src.startsWith("/")) spots.push({ src, set, where });
  };

  for (const g of content.games) {
    add(() => g.thumb, (v) => (g.thumb = v), `게임 "${g.title}" 썸네일`);
    for (const m of g.gallery) add(() => m.src, (v) => (m.src = v), `게임 "${g.title}" 스크린샷`);
  }
  for (const a of content.albums) {
    add(() => a.cover, (v) => (a.cover = v), `활동 사진 "${a.title}" 대표 이미지`);
    for (const m of a.photos) add(() => m.src, (v) => (m.src = v), `활동 사진 "${a.title}"`);
  }
  for (const t of content.timeline) {
    for (const m of t.images) add(() => m.src, (v) => (m.src = v), `타임라인 "${t.title}"`);
  }
  add(
    () => content.site.shareImage,
    (v) => (content.site.shareImage = v),
    "공유 이미지",
  );

  const fixed = [];
  const missing = [];

  for (const { src, set, where } of spots) {
    const real = realPath(src);
    if (real === src) continue;
    if (real === null) {
      missing.push(`${where}: "${src}" 파일이 저장소에 없습니다.`);
      continue;
    }
    set(real);
    fixed.push(`${where}: "${src}" → "${real}"`);
  }

  return { fixed, missing };
}

console.log(`[content] 시트 ${SHEET_ID} 에서 내용을 읽습니다.`);

/* 한 탭이 잘못돼도 멈추지 않고 전부 본다. 고치고 다시 돌리기를 반복하지 않도록. */
const loaded = await loadAllTabs(SHEET_ID, TABS);
const broken = loaded.filter((r) => r.errors.length > 0);

if (broken.length) {
  const lines = broken.map(
    (r) => `[${r.tab.name}]\n` + r.errors.map((p) => "  · " + p).join("\n"),
  );
  stop(
    `탭 ${broken.length}개에 문제가 있습니다.\n\n` +
      lines.join("\n\n") +
      "\n\n정상인 탭: " +
      (loaded.length - broken.length) +
      "개",
  );
}

for (const { tab, table, notes } of loaded) {
  console.log(`[content] ${tab.name} — ${Math.max(0, table.length - 1)}줄`);
  for (const n of notes) console.log(`[content]   알림: ${n}`);
}

const tables = Object.fromEntries(loaded.map(({ tab, table }) => [tab.name, table]));
const base = JSON.parse(readFileSync(SOURCE, "utf8"));
const content = tablesToContent(tables, base);

const contentProblems = checkContent(content);
if (contentProblems.length) {
  stop("시트 내용에 문제가 있습니다:\n" + contentProblems.map((p) => "  · " + p).join("\n"));
}

const { fixed, missing } = fixImagePaths(content);
if (fixed.length) {
  console.log("\n[content] 그림 경로를 저장소의 실제 파일 이름에 맞췄습니다.");
  for (const f of fixed) console.log(`[content]   · ${f}`);
}
if (missing.length) {
  console.warn("\n[content] ⚠ 없는 그림 파일을 가리키는 칸이 있습니다. 그 자리는 빈 채로 배포됩니다.");
  for (const m of missing) console.warn(`[content]   · ${m}`);
}
if (fixed.length || missing.length) console.log("");

const before = readFileSync(SOURCE, "utf8");
const after = JSON.stringify(content, null, 2) + "\n";
writeFileSync(SOURCE, after, "utf8");

console.log(
  before === after
    ? "[content] 시트 내용이 저장소와 같습니다. 바뀐 것 없음."
    : "[content] 시트 내용으로 갱신했습니다.",
);
