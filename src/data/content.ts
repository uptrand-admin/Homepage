/**
 * 사이트에 표시되는 모든 글은 content.json 하나에 들어 있다.
 * 이 파일은 손으로 고치지 말고 구글 시트를 수정한 뒤 배포하면 다시 만들어진다.
 * 자세한 방법은 README의 "내용 수정하기"를 볼 것.
 */
import raw from "./content.json";

export type GameStatus = "released" | "dev";

export type Media = { src: string | null; caption: string };

export type Game = {
  slug: string;
  title: string;
  tagline: string;
  status: GameStatus;
  tags: string[];
  thumb: string | null;
  /** 유튜브 임베드 주소. 있으면 상세 화면 대표 자리에 영상이 들어간다. */
  video: string;
  gallery: Media[];
  period: string;
  team: string;
  tools: string[];
  body: string[];
  links: { label: string; href: string; kind: string }[];
  /** 따로 만든 상세 소개 페이지가 있을 때만 채운다. 비어 있으면 버튼이 나오지 않는다. */
  detailPage: string;
  /** 수상·전시 이력. 여러 건일 수 있어 목록으로 둔다. */
  awards: string[];
};

export type Album = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  dateRange: string;
  cover: string | null;
  photos: Media[];
};

export type TimelineEntry = {
  slug: string;
  category: string;
  date: string;
  dateRange: string;
  title: string;
  summary: string;
  host: string;
  resultLine: string;
  detailUrl: string;
  awards: { prize: string; work: string; gameSlug: string }[];
  body: string[];
  images: Media[];
};

export type Activity = {
  key: string;
  name: string;
  lead: string;
  wide: boolean;
  body: string;
};

/**
 * "2025.03 ~ 2025.10" 처럼 적힌 기간에서 가장 나중 시점을 뽑아 비교용 숫자로 만든다.
 *
 * 시트에 적는 형식이 사람마다 조금씩 달라서(점, 하이픈, "년 월") 날짜처럼 보이는 것을
 * 모두 찾아 그중 가장 나중 것을 쓴다. 하나도 못 읽으면 0 이 되어 뒤로 밀린다.
 */
function latestPoint(period: string): number {
  let best = 0;

  for (const m of String(period ?? "").matchAll(/(\d{4})\s*[.\-/년]?\s*(\d{1,2})?/g)) {
    const year = Number(m[1]);
    if (year < 1900 || year > 2999) continue;

    const month = Math.min(12, Math.max(1, Number(m[2] ?? 1) || 1));
    best = Math.max(best, year * 12 + month);
  }

  return best;
}

/**
 * 최신순으로 세운다. 같은 시점이면 시트에 적은 순서를 지킨다(정렬이 안정적이므로).
 * 덕분에 같은 달에 끝난 것들끼리는 시트에서 위아래를 바꿔 직접 조정할 수 있다.
 */
function newestFirst<T>(items: T[], getPeriod: (item: T) => string): T[] {
  return items.slice().sort((a, b) => latestPoint(getPeriod(b)) - latestPoint(getPeriod(a)));
}

export const site = raw.site;
export const nav = raw.nav;
export const contact = raw.contact;
export const socials = raw.socials;
export const about = raw.about;
export const activities = raw.about.activities as Activity[];
export const games = newestFirst(raw.games as Game[], (g) => g.period);
export const albums = newestFirst(raw.albums as Album[], (a) => a.dateRange);
/* 목록에 찍히는 값이 date 이므로 그 값으로 세운다. 기간으로 세우면 보이는 순서가 뒤죽박죽이 된다. */
export const timeline = newestFirst(
  raw.timeline as TimelineEntry[],
  (t) => t.date || t.dateRange,
);
export const benefits = raw.benefits;
export const join = raw.join;

export const statusLabels: Record<GameStatus, string> = {
  released: "완료",
  dev: "개발 중",
};

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}

/** 활동 사진 분류 칩. 실제로 쓰인 분류만, 등장 순서대로 보여준다. */
export const albumCategories = ["전체", ...new Set(albums.map((a) => a.category))];

export const timelineCategories = ["전체", ...new Set(timeline.map((t) => t.category))];
