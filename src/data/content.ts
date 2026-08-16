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

export const site = raw.site;
export const nav = raw.nav;
export const contact = raw.contact;
export const socials = raw.socials;
export const about = raw.about;
export const activities = raw.about.activities as Activity[];
export const games = raw.games as Game[];
export const albums = raw.albums as Album[];
export const timeline = raw.timeline as TimelineEntry[];
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
