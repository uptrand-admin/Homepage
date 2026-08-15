"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Placeholder } from "@/components/ui";
import { statusLabels, type Game } from "@/data/content";
import { asset } from "@/lib/asset";

/**
 * 게임 상세 본문. 모달과 /games/[slug] 전용 페이지가 이 컴포넌트를 함께 쓴다.
 * 두 곳의 내용이 갈라지지 않도록 한 군데만 고치면 되게 했다.
 */
export function GameDetail({ game, titleId }: { game: Game; titleId?: string }) {
  // 대표 자리에 보여줄 미디어. 0 = 영상(있을 때), 그 뒤로 스크린샷.
  const slides = [
    ...(game.video ? [{ kind: "video" as const, caption: "플레이 영상" }] : []),
    ...game.gallery.map((g) => ({ kind: "image" as const, ...g })),
  ];
  const [current, setCurrent] = useState(0);
  const active = slides[current];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-subtle">
          {active?.kind === "video" && game.video ? (
            <iframe
              src={game.video}
              title={`${game.title} 플레이 영상`}
              className="absolute inset-0 size-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : active?.kind === "image" && active.src ? (
            <Image
              src={asset(active.src)}
              alt={active.caption || game.title}
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          ) : (
            <Placeholder
              seed={`${game.slug}-${current}`}
              label={active?.caption ?? "대표 이미지"}
              className="size-full"
            />
          )}
        </div>

        {slides.length > 1 ? (
          <div className="mt-3 flex gap-3">
            {slides.map((slide, i) => (
              <button
                key={`${slide.kind}-${i}`}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`${slide.caption || "미디어"} 보기`}
                aria-current={i === current}
                className={`relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === current ? "border-blue" : "border-line hover:border-line-strong"
                }`}
              >
                {slide.kind === "image" && slide.src ? (
                  <Image src={asset(slide.src)} alt="" fill sizes="96px" className="object-cover" />
                ) : (
                  <Placeholder seed={`${game.slug}-${i}`} className="size-full" />
                )}
                {slide.kind === "video" ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                    <Icon name="play" className="size-5" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {game.links.length > 0 || game.detailPage ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {game.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-bold text-title shadow-card transition-all hover:-translate-y-0.5 hover:border-orange hover:text-orange"
              >
                {link.label}
                <Icon
                  name={link.kind === "download" ? "download" : "external-link"}
                  className="size-4"
                />
              </a>
            ))}
            {/* 따로 만든 소개 페이지가 있을 때만 나온다. */}
            {game.detailPage ? (
              <a
                href={game.detailPage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue/90"
              >
                상세 소개 페이지
                <Icon name="external-link" className="size-4" />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-extrabold text-white ${
              game.status === "released" ? "bg-blue" : "bg-orange"
            }`}
          >
            {statusLabels[game.status]}
          </span>
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-line bg-subtle px-2.5 py-1 text-xs font-bold text-body"
            >
              {tag}
            </span>
          ))}
        </div>

        <h3
          id={titleId}
          className="text-[1.7rem] leading-tight font-extrabold text-title break-keep-ko sm:text-[2rem]"
        >
          {game.title}
        </h3>

        <div className="mt-3 space-y-3">
          {game.body.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed text-body break-keep-ko">
              {paragraph}
            </p>
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 border-t border-line pt-5 text-sm">
          <dt className="font-bold text-title">개발 기간</dt>
          <dd className="text-body">{game.period}</dd>
          <dt className="font-bold text-title">참여 인원</dt>
          <dd className="text-body">{game.team}</dd>
          <dt className="font-bold text-title">개발 도구</dt>
          <dd className="text-body">{game.tools.join(", ")}</dd>
          {game.award ? (
            <>
              <dt className="font-bold text-title">성과</dt>
              <dd className="font-bold text-orange">{game.award}</dd>
            </>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
