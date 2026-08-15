import type { NextConfig } from "next";

/**
 * GitHub Pages(일반 저장소)는 사이트가 /저장소이름 아래에 놓이므로
 * 모든 링크와 정적 파일 경로 앞에 그 경로가 붙어야 한다.
 * 배포 워크플로가 BASE_PATH 환경 변수로 저장소 이름을 넘겨준다.
 * 로컬 개발(npm run dev)에서는 비어 있어 평소대로 / 에서 동작한다.
 */
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // 서버 없이 정적 파일만으로 동작하도록 out/ 폴더에 내보낸다.
  output: "export",
  basePath,
  /*
   * 각 페이지를 games/foo/index.html 로 내보낸다.
   * 이렇게 해야 GitHub Pages 가 끝에 슬래시가 붙은 주소도 열어 준다.
   * 링크를 복사하며 슬래시가 붙거나, 검색엔진이 붙여 접근해도 404 가 나지 않는다.
   */
  trailingSlash: true,
  images: {
    // 정적 내보내기에서는 Next의 이미지 최적화 서버를 쓸 수 없다.
    unoptimized: true,
  },
  env: {
    /**
     * 이미지 최적화를 끄면 <Image> 의 src 앞에 basePath 가 자동으로 붙지 않는다.
     * 그래서 브라우저에서도 이 값을 알아야 하고, src/lib/asset.ts 가 직접 붙인다.
     */
    NEXT_PUBLIC_BASE_PATH: basePath,
    /**
     * 카카오톡 같은 공유 미리보기 크롤러는 상대 경로를 읽지 못한다.
     * 배포 주소를 알아야 og:image 를 절대 주소로 적을 수 있어 워크플로가 넣어 준다.
     */
    NEXT_PUBLIC_SITE_URL: process.env.SITE_URL ?? "",
  },
};

export default nextConfig;
