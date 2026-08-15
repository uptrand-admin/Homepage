import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  GraduationCap,
  MonitorPlay,
  Play,
  Swords,
  Users,
  X,
} from "lucide-react";
import {
  SiDiscord,
  SiGithub,
  SiInstagram,
  SiItchdotio,
  SiSteam,
  SiYoutube,
} from "react-icons/si";
import type { ComponentType, SVGProps } from "react";

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * 아이콘 이름이 구글 시트에서 문자열로 들어오므로, 쓸 수 있는 것만 여기에 등록해 둔다.
 * 목록에 없는 이름이 오면 아이콘 없이 넘어간다.
 * 서비스 로고(인스타그램 등)는 lucide v1 에서 빠져 react-icons 쪽을 쓴다.
 */
const icons: Record<string, Glyph> = {
  instagram: SiInstagram,
  github: SiGithub,
  youtube: SiYoutube,
  discord: SiDiscord,
  steam: SiSteam,
  itch: SiItchdotio,
  swords: Swords,
  "graduation-cap": GraduationCap,
  "monitor-play": MonitorPlay,
  users: Users,
  play: Play,
  download: Download,
  "external-link": ExternalLink,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  close: X,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Glyph = icons[name];
  if (!Glyph) return null;
  return <Glyph className={className} aria-hidden="true" focusable="false" />;
}
