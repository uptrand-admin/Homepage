"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameDetail } from "@/components/GameDetail";
import { Icon } from "@/components/Icon";
import {
  FilterTabs,
  Modal,
  ModalClose,
  MoreButton,
  Placeholder,
  Reveal,
  Section,
  SectionTitle,
} from "@/components/ui";
import { games, statusLabels, type Game } from "@/data/content";
import { asset, route } from "@/lib/asset";

const FILTERS = [
  { label: "전체", value: "all" },
  { label: statusLabels.dev, value: "dev" },
  { label: statusLabels.released, value: "released" },
];

/** 처음에 이만큼만 보이고, 나머지는 더보기를 눌러야 나온다. */
const INITIAL = 4;

export function GamesSection() {
  const router = useRouter();
  const [filter, setFilter] = useState("전체");
  const [expanded, setExpanded] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const value = FILTERS.find((f) => f.label === filter)?.value ?? "all";
  const matched = value === "all" ? games : games.filter((g) => g.status === value);
  const visible = expanded ? matched : matched.slice(0, INITIAL);
  const open = games.find((g) => g.slug === openSlug) ?? null;

  /* 모달을 열면 주소도 함께 바꿔, 그 상태로 공유하거나 새로고침할 수 있게 한다. */
  useEffect(() => {
    if (!openSlug) return;
    window.history.replaceState(null, "", route(`/games/${openSlug}`));
    return () => window.history.replaceState(null, "", route("/"));
  }, [openSlug]);

  return (
    <Section id="games" tinted>
      <SectionTitle lead="OUR" accent="GAMES" />

      <Reveal>
        <FilterTabs
          items={FILTERS.map((f) => f.label)}
          active={filter}
          onChange={(next) => {
            setFilter(next);
            setExpanded(false);
          }}
        />
      </Reveal>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((game, i) => (
          <Reveal key={game.slug} delay={(i % 4) * 80}>
            <GameCard game={game} onOpen={() => setOpenSlug(game.slug)} />
          </Reveal>
        ))}
      </div>

      {!expanded && matched.length > INITIAL ? (
        <MoreButton onClick={() => setExpanded(true)} label={`더보기 (${matched.length - INITIAL})`} />
      ) : null}

      <Modal
        open={Boolean(open)}
        onClose={() => setOpenSlug(null)}
        labelledBy="game-modal-title"
      >
        {open ? (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-line bg-base px-6 py-5 sm:px-9">
              <span className="font-display text-lg font-extrabold text-title">GAME DETAIL</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/games/${open.slug}`)}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-body transition-colors hover:border-blue hover:text-blue"
                >
                  전체 화면으로 보기
                </button>
                <ModalClose onClose={() => setOpenSlug(null)} />
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-7 sm:px-9">
              <GameDetail game={open} titleId="game-modal-title" />
            </div>
          </>
        ) : null}
      </Modal>
    </Section>
  );
}

function GameCard({ game, onOpen }: { game: Game; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-white text-left shadow-card transition-all hover:-translate-y-2 hover:border-line-strong hover:shadow-hover"
    >
      <div className="relative aspect-4/3 overflow-hidden border-b border-line">
        {game.thumb ? (
          <Image
            src={asset(game.thumb)}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Placeholder
            seed={game.slug}
            label={game.title}
            className="size-full transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span
          className={`absolute top-3 right-3 rounded-lg px-3 py-1.5 text-xs font-extrabold text-white ${
            game.status === "released" ? "bg-blue/90" : "bg-orange/90"
          }`}
        >
          {statusLabels[game.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold text-title break-keep-ko">{game.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-body break-keep-ko">
          {game.tagline}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-line bg-subtle px-2.5 py-1 text-xs font-bold text-body"
            >
              {tag}
            </span>
          ))}
          {/* 수상 이력이 있으면 목록에서도 바로 눈에 띄게 한다. */}
          {game.awards.length > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-extrabold text-amber-800"
              title={game.awards.join("\n")}
            >
              <Icon name="trophy" className="size-3" />
              {game.awards.length > 1 ? game.awards.length : "수상"}
            </span>
          ) : null}
        </div>
        <span className="mt-4 text-sm font-extrabold text-blue opacity-0 transition-opacity group-hover:opacity-100">
          VIEW DETAILS ↗
        </span>
      </div>
    </button>
  );
}
