import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameDetail } from "@/components/GameDetail";
import { games, getGame, statusLabels } from "@/data/content";
import { absoluteUrl } from "@/lib/asset";

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return {};

  // 카톡·검색엔진 크롤러는 상대 경로를 못 읽어서 반드시 절대 주소여야 한다.
  const image = absoluteUrl(game.thumb);

  return {
    title: game.title,
    description: game.tagline,
    openGraph: {
      title: game.title,
      description: game.tagline,
      type: "article",
      images: image ? [image] : undefined,
    },
  };
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const game = getGame(slug);

  if (!game) notFound();

  return (
    <div className="px-5 pt-32 pb-24 sm:px-8">
      <div className="mx-auto w-full max-w-[1140px]">
        <Link
          href="/#games"
          className="text-sm font-bold text-body transition-colors hover:text-orange"
        >
          ← 게임 목록으로
        </Link>

        <div className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-10">
          <GameDetail game={game} />
        </div>

        <p className="mt-6 text-center text-sm text-body">
          {statusLabels[game.status]} · {game.period}
        </p>
      </div>
    </div>
  );
}
