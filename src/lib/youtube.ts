/**
 * 유튜브 주소에서 미리보기 그림 주소를 만든다.
 *
 * 영상은 <iframe> 이라 목록의 작은 타일에서는 틀어 둘 수 없다. 그래서 그 자리에는
 * 유튜브가 영상마다 만들어 두는 그림을 대신 건다. 시트에 어떤 형태로 적든
 * (embed / watch?v= / youtu.be) 같은 ID 를 찾도록 했다.
 *
 * mqdefault 는 320x180 으로 16:9 라서 위아래에 검은 띠가 생기지 않는다.
 * hqdefault 는 해상도가 더 높지만 4:3 이라 띠가 남는다.
 */
const ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([\w-]{11})/;

export function youtubeThumb(url: string): string | null {
  const match = ID.exec(url ?? "");
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}
