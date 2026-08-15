/**
 * public/ 안의 파일을 가리키는 경로 앞에 배포 경로를 붙인다.
 *
 * GitHub Pages 는 사이트가 https://계정.github.io/저장소이름/ 아래에 놓인다.
 * 링크와 스크립트는 Next 가 알아서 처리하지만, 이미지 최적화를 끈 상태(정적 내보내기)에서는
 * <Image> 의 src 에 그 경로가 붙지 않아 /images/... 를 그대로 요청하다 404 가 난다.
 * 시트에서 들어오는 이미지 경로도 마찬가지라 한 곳에서 처리한다.
 *
 * 로컬 개발과 자체 도메인에서는 BASE_PATH 가 비어 있어 아무것도 바뀌지 않는다.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(src: string): string;
export function asset(src: string | null): string | null;
export function asset(src: string | null): string | null {
  if (!src) return src;
  // 외부 주소나 data: 는 건드리지 않는다.
  if (!src.startsWith("/")) return src;
  return `${BASE}${src}`;
}

/**
 * 공유 미리보기(카카오톡, 검색엔진)에 넣을 절대 주소.
 *
 * 크롤러는 페이지를 자기 서버에서 열기 때문에 /images/... 같은 상대 경로를 읽지 못한다.
 * metadataBase 에 기대면 배포 경로가 빠지므로(맨 앞 슬래시가 경로를 뿌리로 되돌린다)
 * 여기서 전체 주소를 직접 만든다.
 *
 * 배포 주소를 모르면 undefined 를 돌려준다. 깨진 주소를 넣느니 빼는 편이 낫다.
 */
export function absoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;

  // SITE_URL 은 배포 경로까지 포함한 주소다(예: https://x.github.io/Homepage).
  // 그러므로 여기서 asset() 을 또 거치면 경로가 두 번 붙는다.
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  if (!base) return undefined;

  return base + (path.startsWith("/") ? path : `/${path}`);
}

/**
 * 주소창에 직접 써 넣는 사이트 내부 경로.
 *
 * <Link> 는 Next 가 알아서 배포 경로를 붙이지만, history.replaceState 처럼
 * 직접 주소를 바꿀 때는 붙지 않는다. 그대로 두면 GitHub Pages 에서
 * 저장소 이름이 빠진 주소가 되어, 새로고침하거나 링크를 복사하면 404 가 난다.
 *
 * trailingSlash 설정에 맞춰 끝에 슬래시를 붙여 둔다.
 */
export function route(path: string): string {
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return `${BASE}${withSlash}`;
}
