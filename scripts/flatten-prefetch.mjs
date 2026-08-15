/**
 * Next.js 16.3.0 정적 내보내기(output: "export") 버그 우회 스크립트.
 *
 * 브라우저는 링크 프리페치 데이터를 `__next.about.__PAGE__.txt` 처럼
 * 점으로 이어진 하나의 파일로 요청하는데, 내보내기는 이를
 * `__next.about/__PAGE__.txt` 처럼 폴더 구조로 만든다.
 * 그대로 두면 프리페치가 전부 404가 나고, 링크를 누를 때마다
 * 클라이언트 전환 대신 전체 페이지 새로고침으로 떨어진다.
 *
 * 그래서 폴더 안의 파일을 점으로 이어진 이름으로 한 벌 더 복사해 둔다.
 * (원본도 남겨 두므로 향후 Next가 이 버그를 고쳐도 깨지지 않는다.)
 *
 * Next를 업그레이드한 뒤 프리페치 404가 사라졌다면 이 스크립트와
 * package.json의 postbuild 항목을 지워도 된다.
 */
import { cp, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "out";
const PREFIX = "__next.";

/** dir 안의 파일을 모두 찾아 dir 기준 상대 경로 배열로 돌려준다. */
async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await collectFiles(join(dir, entry.name));
      files.push(...nested.map((path) => `${entry.name}/${path}`));
    } else {
      files.push(entry.name);
    }
  }

  return files;
}

/** 라우트 폴더 하나를 훑으며 __next.* 폴더를 평탄화한다. */
async function flatten(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  let copied = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const path = join(dir, entry.name);

    if (entry.name.startsWith(PREFIX)) {
      for (const file of await collectFiles(path)) {
        const flatName = `${entry.name}.${file.replaceAll("/", ".")}`;
        await cp(join(path, file), join(dir, flatName));
        copied += 1;
      }
    } else {
      copied += await flatten(path);
    }
  }

  return copied;
}

if (!existsSync(OUT_DIR)) {
  console.log(`[flatten-prefetch] ${OUT_DIR}/ 이 없어 건너뜁니다.`);
} else {
  const copied = await flatten(OUT_DIR);
  console.log(`[flatten-prefetch] 프리페치 파일 ${copied}개를 평탄화했습니다.`);
}
