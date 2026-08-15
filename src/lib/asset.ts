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
