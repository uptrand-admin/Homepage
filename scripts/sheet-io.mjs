/**
 * 구글 시트를 읽어 오고, 탭 모양이 양식과 맞는지 보는 공용 코드.
 *
 * 배포용(fetch-sheet.mjs)과 점검용(sheet-check.mjs)이 함께 쓴다.
 * 두 스크립트가 같은 판정을 하도록 한 곳에 모아 두었다.
 */
import { fromCsv } from "./sheet-schema.mjs";

/**
 * SHEET_ID 에는 ID 만 넣는 것이 원칙이지만, 주소창의 주소를 통째로 붙여 넣기 쉽다.
 * 주소가 들어와도 ID 를 뽑아 쓰고, 그래도 못 알아보면 무엇을 넣어야 하는지 알려준다.
 */
export function readSheetId(raw) {
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

function tabUrl(sheetId, tabName) {
  // SHEET_ENDPOINT 는 시험용으로 다른 주소를 가리키게 할 때만 쓴다.
  const base =
    process.env.SHEET_ENDPOINT ??
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv`;

  /*
   * headers=1 은 반드시 붙여야 한다. 빼면 구글이 머리글이 몇 행인지 스스로 추측하는데,
   * 첫 행들이 모두 문자열이면 여러 행을 머리글로 보고 공백으로 이어 붙여 한 행으로 만든다.
   * 그러면 멀쩡한 시트가 "머리글이 깨진" 것처럼 보인다.
   */
  return `${base}&headers=1&sheet=${encodeURIComponent(tabName)}`;
}

export async function loadTab(sheetId, tabName) {
  const res = await fetch(tabUrl(sheetId, tabName), { redirect: "follow" });

  if (res.status === 404) {
    throw new Error(`탭을 찾을 수 없습니다. 시트에 "${tabName}" 이름의 탭이 있는지 확인해 주세요.`);
  }
  if (!res.ok) {
    throw new Error(`탭을 읽지 못했습니다 (HTTP ${res.status}).`);
  }

  const text = await res.text();

  // 시트가 비공개면 구글이 CSV 대신 로그인 화면(HTML)을 돌려준다.
  if (/^\s*</.test(text)) {
    throw new Error(
      '시트를 읽을 권한이 없습니다. 공유 설정을 "링크가 있는 모든 사용자 · 뷰어"로 바꿔 주세요.',
    );
  }

  return fromCsv(text);
}

/**
 * 탭 하나의 모양을 본다. { level, message } 목록을 돌려주고, 비어 있으면 정상이다.
 *
 * level "error" 는 그대로 배포하면 내용이 깨지는 경우라 배포를 멈춘다.
 * level "note" 는 알려만 주고 넘어간다. 저장소에 있던 기존 값이 그대로 쓰인다.
 */
export function inspectTab(tab, table) {
  const found = [];
  const error = (message) => found.push({ level: "error", message });
  const note = (message) => found.push({ level: "note", message });

  if (!table || table.length === 0) {
    error("탭이 비어 있습니다.");
    return found;
  }

  if (tab.kind === "rows") {
    const header = table[0].map((h) => h.trim());
    const missing = tab.header.filter((h) => !header.includes(h));

    // 열이 없으면 값이 엉뚱한 칸에서 읽히므로 그냥 두면 안 된다.
    if (missing.length) {
      error(`머리글에 없는 열: ${missing.join(", ")}`);
      error(`현재 첫 줄: ${header.map((h) => h.slice(0, 20)).join(" | ")}`);
    }

    if (table.length === 1) error("내용이 한 줄도 없습니다. 머리글만 있습니다.");

    // 머리글보다 칸이 많은 줄은 쉼표가 섞여 열이 밀린 경우다.
    const wide = table.slice(1).filter((r) => r.length > tab.header.length).length;
    if (wide) error(`칸 수가 머리글보다 많은 줄이 ${wide}개 있습니다.`);
  } else {
    /*
     * 항목 하나가 없다고 배포를 막지는 않는다.
     * 읽기는 저장소의 content.json 에서 출발하므로, 없는 항목은 이전 값이 남는다.
     * 새 항목을 추가한 직후처럼 시트가 아직 따라오지 못한 상황에서
     * 사이트 전체가 멈추는 편이 훨씬 나쁘다.
     */
    const labels = new Set(table.slice(1).map((r) => String(r[0]).trim()));
    const missing = tab.fields.map(([label]) => label).filter((label) => !labels.has(label));
    if (missing.length) {
      note(`시트에 없는 항목: ${missing.join(", ")} (저장소에 있던 값을 그대로 씁니다)`);
    }
  }

  return found;
}

/**
 * 모든 탭을 읽어 온다. 한 탭이 잘못돼도 멈추지 않고 끝까지 본 뒤 한꺼번에 돌려준다.
 * 하나 고치고 다시 돌리기를 반복하지 않게 하기 위해서다.
 */
export async function loadAllTabs(sheetId, tabs) {
  const results = [];

  for (const tab of tabs) {
    try {
      const table = await loadTab(sheetId, tab.name);
      const found = inspectTab(tab, table);
      results.push({
        tab,
        table,
        errors: found.filter((f) => f.level === "error").map((f) => f.message),
        notes: found.filter((f) => f.level === "note").map((f) => f.message),
      });
    } catch (error) {
      results.push({
        tab,
        table: null,
        errors: [error instanceof Error ? error.message : String(error)],
        notes: [],
      });
    }
  }

  return results;
}
