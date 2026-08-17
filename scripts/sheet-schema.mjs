/**
 * 구글 시트의 탭·열 구조를 정의한다.
 *
 * 이 파일 하나를 두 곳에서 함께 쓴다.
 *   - sheet-template.mjs : content.json -> 시트 양식 CSV (양식을 만들 때)
 *   - fetch-sheet.mjs    : 시트 CSV -> content.json (배포할 때)
 *
 * 양쪽이 같은 정의를 보므로 양식과 읽는 코드가 어긋날 일이 없다.
 * 열을 추가하려면 여기만 고치면 된다.
 */

/* ---------- CSV ---------- */

export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const v = cell === null || cell === undefined ? "" : String(cell);
          return /[",\n\r]/.test(v) ? '"' + v.replaceAll('"', '""') + '"' : v;
        })
        .join(","),
    )
    .join("\r\n");
}

export function fromCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];

    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 1; }
        else quoted = false;
      } else cell += ch;
      continue;
    }

    if (ch === '"') { quoted = true; continue; }
    if (ch === ",") { row.push(cell); cell = ""; continue; }
    if (ch === "\r") continue;
    if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; continue; }
    cell += ch;
  }

  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  // 시트 끝의 빈 줄은 버린다.
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/* ---------- 값 변환 ---------- */

const YES = new Set(["true", "TRUE", "예", "O", "o", "Y", "y", "1", "✓"]);

const bool = (v) => YES.has(String(v ?? "").trim());
const boolOut = (v) => (v ? "TRUE" : "FALSE");

/** 셀 안에서 줄바꿈으로 구분된 목록. 빈 줄은 버린다. */
const lines = (v) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
const linesOut = (arr) => (arr ?? []).join("\n");

/** 쉼표로 구분된 목록. */
const csvList = (v) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const csvListOut = (arr) => (arr ?? []).join(", ");

/** "왼쪽 | 오른쪽 | 또 오른쪽" 한 줄을 조각으로. */
const parts = (line, count) => {
  const out = String(line).split("|").map((s) => s.trim());
  while (out.length < count) out.push("");
  return out;
};

const text = (v) => String(v ?? "").trim();
const nullable = (v) => (text(v) === "" ? null : text(v));

const STATUS_TO_KO = { released: "완료", dev: "개발 중" };
const STATUS_FROM_KO = Object.fromEntries(Object.entries(STATUS_TO_KO).map(([k, v]) => [v, k]));

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const looksLikePath = (s) => IMAGE_EXT.test(s) || s.startsWith("/") || /^https?:\/\//.test(s);

/**
 * public 폴더 안의 파일은 / 로 시작해야 배포 경로가 제대로 붙는다.
 * 시트에 "images/..." 처럼 앞의 / 를 빼고 적기 쉬워서 여기서 채워 준다.
 */
const assetPath = (v) => {
  const s = text(v);
  if (!s) return null;
  if (/^https?:\/\//.test(s) || s.startsWith("/")) return s;
  return "/" + s.replace(/^\.?\/*/, "");
};

/**
 * "설명 | 경로" 한 줄 목록 <-> [{src, caption}]
 *
 * 원칙은 설명이 먼저지만 "경로 | 설명" 으로 적기가 훨씬 자연스러워서 실제로 자주 뒤집힌다.
 * 그래서 순서를 강요하는 대신, 경로처럼 생긴 쪽(확장자나 / 가 있는 쪽)을 경로로 본다.
 */
const mediaIn = (v) =>
  lines(v).map((line) => {
    const [first, second] = parts(line, 2);

    const flipped = looksLikePath(first) && !looksLikePath(second);
    const caption = flipped ? second : first;
    const src = flipped ? first : second;

    return { src: assetPath(src), caption };
  });
const mediaOut = (arr) =>
  linesOut(
    (arr ?? []).map((m) =>
      m.caption ? `${m.caption} | ${m.src ?? ""}`.trim() : text(m.src),
    ),
  );

/* ---------- 탭 정의 ---------- */

export const TABS = [
  {
    name: "기본정보",
    kind: "kv",
    note: "동아리 이름, 히어로 문구, 연락처처럼 한 번 적고 거의 안 바뀌는 값들",
    fields: [
      ["동아리 이름", "site.name", "상단 로고 대체 텍스트"],
      ["정식 명칭", "site.fullName", "푸터 저작권 표기"],
      ["푸터 한 줄 소개", "site.tagline", ""],
      ["사이트 주소", "site.url", "https:// 로 시작하는 배포 주소"],
      ["공유 이미지", "site.shareImage", "카톡 등에 링크를 붙였을 때 뜨는 그림. 비우면 로고를 씁니다"],
      ["히어로 제목 1줄", "site.heroTitle1", "[대괄호]로 감싼 부분이 주황색이 됩니다. 예: 새로운 [트렌드]를"],
      ["히어로 제목 2줄", "site.heroTitle2", ""],
      ["히어로 본문", "site.heroBody", ""],
      ["이메일", "contact.email", ""],
      ["동아리방", "contact.roomName", ""],
      ["지원서 링크", "contact.applyUrl", "구글 폼 주소"],
    ],
    read(get, draft) {
      for (const [label, path] of this.fields) {
        const raw = get(label);
        if (raw === undefined) continue;
        setPath(draft, path, text(raw));
      }
    },
    write(content) {
      return this.fields.map(([label, path, note]) => [label, String(getPath(content, path) ?? ""), note]);
    },
  },

  {
    name: "SNS",
    kind: "rows",
    note: "아이콘은 instagram, github, youtube, discord, steam, itch 중에서 고르세요",
    header: ["이름", "아이콘", "주소"],
    read: (rows, draft) => {
      draft.socials = rows.map((r) => ({ label: r[0], icon: text(r[1]), href: r[2] || "#" }));
    },
    write: (content) => content.socials.map((s) => [s.label, s.icon, s.href]),
  },

  {
    name: "소개",
    kind: "kv",
    note: "ABOUT US 섹션의 글과 숫자",
    fields: [
      ["소개 제목", "about.heading", ""],
      ["소개 본문", "about.body", "한 문단에 한 줄씩"],
      ["숫자1 값", "about.stats.0.value", "예: 2023"],
      ["숫자1 이름", "about.stats.0.label", "예: 설립"],
      ["숫자2 값", "about.stats.1.value", "예: 17"],
      ["숫자2 이름", "about.stats.1.label", "예: 프로젝트 수"],
      ["소개 영상", "about.video", "유튜브 임베드 주소. 비우면 재생 아이콘만 표시됩니다"],
      ["영상 설명", "about.videoCaption", ""],
    ],
    read(get, draft) {
      const set = (p, v) => setPath(draft, p, v);
      if (get("소개 제목") !== undefined) set("about.heading", text(get("소개 제목")));
      if (get("소개 본문") !== undefined) set("about.body", lines(get("소개 본문")));
      for (const i of [0, 1]) {
        const v = get(`숫자${i + 1} 값`);
        const l = get(`숫자${i + 1} 이름`);
        if (v !== undefined) set(`about.stats.${i}.value`, text(v));
        if (l !== undefined) set(`about.stats.${i}.label`, text(l));
      }
      if (get("소개 영상") !== undefined) set("about.video", text(get("소개 영상")));
      if (get("영상 설명") !== undefined) set("about.videoCaption", text(get("영상 설명")));
    },
    write(content) {
      const a = content.about;
      return [
        ["소개 제목", a.heading, ""],
        ["소개 본문", linesOut(a.body), "한 문단에 한 줄씩"],
        ["숫자1 값", a.stats[0]?.value ?? "", "예: 2023"],
        ["숫자1 이름", a.stats[0]?.label ?? "", "예: 설립"],
        ["숫자2 값", a.stats[1]?.value ?? "", "예: 17"],
        ["숫자2 이름", a.stats[1]?.label ?? "", "예: 프로젝트 수"],
        ["소개 영상", a.video, "유튜브 임베드 주소. 비우면 재생 아이콘만 표시됩니다"],
        ["영상 설명", a.videoCaption, ""],
      ];
    },
  },

  {
    name: "활동내용",
    kind: "rows",
    note: "넓게에 TRUE 를 적으면 한 줄을 다 쓰는 큰 카드가 됩니다",
    header: ["구분자", "이름", "작은 설명", "넓게", "본문"],
    read: (rows, draft) => {
      draft.about.activities = rows.map((r) => ({
        key: text(r[0]), name: r[1], lead: r[2], wide: bool(r[3]), body: r[4],
      }));
    },
    write: (content) =>
      content.about.activities.map((a) => [a.key, a.name, a.lead, boolOut(a.wide), a.body]),
  },

  {
    name: "게임",
    kind: "rows",
    note: "스크린샷·링크·성과는 한 칸 안에서 줄바꿈(Alt+Enter)으로 여러 줄 적으세요",
    header: [
      "주소이름", "제목", "한 줄 소개", "상태", "태그", "썸네일", "플레이 영상",
      "스크린샷", "개발 기간", "참여 인원", "개발 도구", "본문", "링크", "상세 페이지", "성과",
    ],
    read: (rows, draft) => {
      draft.games = rows.map((r) => ({
        slug: text(r[0]),
        title: r[1],
        tagline: r[2],
        status: STATUS_FROM_KO[text(r[3])] ?? "released",
        tags: csvList(r[4]),
        thumb: assetPath(r[5]),
        video: text(r[6]),
        gallery: mediaIn(r[7]),
        period: text(r[8]),
        team: text(r[9]),
        tools: csvList(r[10]),
        body: lines(r[11]),
        links: lines(r[12]).map((line) => {
          const [label, href, kind] = parts(line, 3);
          return { label, href: href === "" ? "#" : href, kind: kind || "play" };
        }),
        detailPage: text(r[13]),
        awards: lines(r[14]),
      }));
    },
    write: (content) =>
      content.games.map((g) => [
        g.slug, g.title, g.tagline, STATUS_TO_KO[g.status] ?? g.status,
        csvListOut(g.tags), g.thumb ?? "", g.video, mediaOut(g.gallery),
        g.period, g.team, csvListOut(g.tools), linesOut(g.body),
        linesOut((g.links ?? []).map((l) => `${l.label} | ${l.href} | ${l.kind}`)),
        g.detailPage, linesOut(g.awards),
      ]),
  },

  {
    name: "활동사진",
    kind: "rows",
    note: "한 줄이 앨범 하나입니다. 사진은 한 칸 안에서 줄바꿈으로 여러 장 적으세요",
    header: ["주소이름", "제목", "분류", "요약", "기간", "대표 사진", "사진"],
    read: (rows, draft) => {
      draft.albums = rows.map((r) => ({
        slug: text(r[0]), title: r[1], category: text(r[2]), summary: r[3],
        dateRange: text(r[4]), cover: assetPath(r[5]), photos: mediaIn(r[6]),
      }));
    },
    write: (content) =>
      content.albums.map((a) => [
        a.slug, a.title, a.category, a.summary, a.dateRange, a.cover ?? "", mediaOut(a.photos),
      ]),
  },

  {
    name: "타임라인",
    kind: "rows",
    note: "수상작은 \"상 이름 | 작품명 | 게임 주소이름\" 형태로 한 줄에 하나씩 적습니다",
    header: [
      "주소이름", "분류", "날짜", "기간", "제목", "요약",
      "주최", "성과 한 줄", "자세히 링크", "수상작", "본문", "사진",
    ],
    read: (rows, draft) => {
      draft.timeline = rows.map((r) => ({
        slug: text(r[0]),
        category: text(r[1]),
        date: text(r[2]),
        dateRange: text(r[3]),
        title: r[4],
        summary: r[5],
        host: text(r[6]),
        resultLine: text(r[7]),
        detailUrl: text(r[8]),
        awards: lines(r[9]).map((line) => {
          const [prize, work, gameSlug] = parts(line, 3);
          return { prize, work, gameSlug };
        }),
        body: lines(r[10]),
        images: mediaIn(r[11]),
      }));
    },
    write: (content) =>
      content.timeline.map((t) => [
        t.slug, t.category, t.date, t.dateRange, t.title, t.summary,
        t.host, t.resultLine, t.detailUrl,
        linesOut((t.awards ?? []).map((a) => `${a.prize} | ${a.work} | ${a.gameSlug}`)),
        linesOut(t.body), mediaOut(t.images),
      ]),
  },

  {
    name: "혜택",
    kind: "rows",
    note: "아이콘은 swords, graduation-cap, monitor-play, users 중에서 고르세요",
    header: ["아이콘", "제목", "본문"],
    read: (rows, draft) => {
      draft.benefits = rows.map((r) => ({ icon: text(r[0]), title: r[1], body: r[2] }));
    },
    write: (content) => content.benefits.map((b) => [b.icon, b.title, b.body]),
  },

  {
    name: "모집",
    kind: "kv",
    note: "모집 중을 FALSE 로 두면 지원 버튼이 비활성화되고 안내 문구가 대신 나옵니다",
    fields: [
      ["모집 중", "join.isOpen", "TRUE 또는 FALSE"],
      ["제목", "join.heading", ""],
      ["본문", "join.body", ""],
      ["버튼 문구", "join.cta", ""],
      ["모집 아닐 때 안내", "join.closedMessage", ""],
    ],
    read(get, draft) {
      if (get("모집 중") !== undefined) setPath(draft, "join.isOpen", bool(get("모집 중")));
      for (const [label, path] of this.fields.slice(1)) {
        const raw = get(label);
        if (raw !== undefined) setPath(draft, path, text(raw));
      }
    },
    write(content) {
      return [
        ["모집 중", boolOut(content.join.isOpen), "TRUE 또는 FALSE"],
        ["제목", content.join.heading, ""],
        ["본문", content.join.body, ""],
        ["버튼 문구", content.join.cta, ""],
        ["모집 아닐 때 안내", content.join.closedMessage, ""],
      ];
    },
  },
];

/* ---------- 경로 도우미 ---------- */

export function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let cur = obj;
  for (const k of keys) {
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = /^\d+$/.test(k) ? [] : {};
    cur = cur[k];
  }
  cur[last] = value;
}

/** 시트에서 읽은 탭 표들을 하나의 content 객체로 합친다. */
export function tablesToContent(tables, base) {
  const draft = structuredClone(base);

  for (const tab of TABS) {
    const table = tables[tab.name];
    if (!table || table.length === 0) continue;

    if (tab.kind === "kv") {
      const map = new Map(table.slice(1).map((r) => [String(r[0]).trim(), r[1]]));
      tab.read((label) => map.get(label), draft);
    } else {
      const width = tab.header.length;
      const rows = table.slice(1).map((r) => {
        const padded = r.slice(0, width);
        while (padded.length < width) padded.push("");
        return padded;
      });
      tab.read(rows, draft);
    }
  }

  return draft;
}

/** content 객체를 탭별 표(머리글 포함)로 만든다. */
export function contentToTables(content) {
  const out = {};
  for (const tab of TABS) {
    const header = tab.kind === "kv" ? ["항목", "값", "설명"] : tab.header;
    out[tab.name] = [header, ...tab.write(content)];
  }
  return out;
}
