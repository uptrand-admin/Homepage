"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import {
  FilterTabs,
  Modal,
  ModalClose,
  Placeholder,
  Reveal,
  Section,
  SectionTitle,
} from "@/components/ui";
import { timeline, timelineCategories, type TimelineEntry } from "@/data/content";
import { asset } from "@/lib/asset";

export function TimelineSection() {
  const [category, setCategory] = useState("전체");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const matched =
    category === "전체" ? timeline : timeline.filter((item) => item.category === category);
  const open = timeline.find((t) => t.slug === openSlug) ?? null;

  return (
    <Section id="timeline" tinted>
      <SectionTitle lead="" accent="TIMELINE" />

      <Reveal>
        <FilterTabs
          items={timelineCategories}
          active={category}
          onChange={setCategory}
          variant="chip"
        />
      </Reveal>

      <ol className="mx-auto max-w-[820px] border-l-2 border-dashed border-line-strong pl-8 sm:pl-12">
        {matched.map((item, i) => (
          <li key={item.slug} className="relative pb-10 last:pb-0">
            <span className="absolute top-1 -left-[41px] grid size-5 place-items-center rounded-full border-4 border-orange bg-base sm:-left-[57px]" />
            <Reveal delay={(i % 3) * 80}>
              <span className="block font-display text-[1.05rem] font-extrabold text-orange">
                {item.date}
              </span>
              <button
                type="button"
                onClick={() => setOpenSlug(item.slug)}
                className="mt-2 block w-full rounded-2xl border border-line bg-white px-7 py-6 text-left shadow-card transition-all hover:-translate-y-1 hover:border-blue hover:shadow-lift"
              >
                <h3 className="text-[1.2rem] font-extrabold text-title break-keep-ko">
                  {item.title}
                </h3>
                <p className="mt-2 text-body break-keep-ko">{item.summary}</p>
              </button>
            </Reveal>
          </li>
        ))}
      </ol>

      <Modal
        open={Boolean(open)}
        onClose={() => setOpenSlug(null)}
        labelledBy="timeline-modal-title"
        width="max-w-[820px]"
      >
        {open ? <TimelineDetail entry={open} onClose={() => setOpenSlug(null)} /> : null}
      </Modal>
    </Section>
  );
}

function TimelineDetail({ entry, onClose }: { entry: TimelineEntry; onClose: () => void }) {
  const hasAwards = entry.awards.length > 0;

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-8">
        <div>
          <span className="font-display text-xs font-bold tracking-wider text-blue">
            {entry.category}
          </span>
          <p className="mt-1 font-display text-sm text-body">
            {entry.dateRange || entry.date}
          </p>
          <h3
            id="timeline-modal-title"
            className="mt-1 text-[1.4rem] font-extrabold text-title break-keep-ko sm:text-[1.7rem]"
          >
            {entry.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {entry.detailUrl ? (
            <a
              href={entry.detailUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-bold text-body transition-colors hover:border-blue hover:text-blue"
            >
              자세히
              <Icon name="external-link" className="size-3.5" />
            </a>
          ) : null}
          <ModalClose onClose={onClose} />
        </div>
      </div>

      <div className="overflow-y-auto px-6 py-6 sm:px-8">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-sm">
          {entry.host ? (
            <>
              <dt className="font-bold text-title">주최</dt>
              <dd className="text-body">{entry.host}</dd>
            </>
          ) : null}
          {entry.resultLine ? (
            <>
              <dt className="font-bold text-title">성과</dt>
              <dd className="font-bold text-orange">{entry.resultLine}</dd>
            </>
          ) : null}
        </dl>

        {entry.body.length > 0 ? (
          <div className="mt-5 space-y-3 border-t border-line pt-5">
            {entry.body.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-body break-keep-ko">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        {hasAwards ? (
          <ul className="mt-6 border-t border-line">
            {entry.awards.map((award) => (
              <li
                key={`${award.prize}-${award.work}`}
                className="flex items-center gap-4 border-b border-line py-3.5"
              >
                {/*
                 * 폭을 80px 로 못박으면 "Best Experimental Game 상" 같은 긴 상 이름이
                 * 박스를 삐져나온다. 짧은 상들은 80px 로 나란히 두되(min-w), 긴 것은
                 * 내용만큼 늘리고, 그래도 넘치면 단어를 끊어 박스 안에 가둔다.
                 */}
                <span className="min-w-20 max-w-[45%] shrink-0 rounded-md bg-amber-100 px-2 py-1 text-center text-xs leading-snug font-extrabold text-amber-800 break-keep-ko [overflow-wrap:anywhere]">
                  {award.prize}
                </span>
                <span className="flex-1 font-bold text-title break-keep-ko">{award.work}</span>
                {award.gameSlug ? (
                  <Link
                    href={`/games/${award.gameSlug}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue hover:underline"
                  >
                    게임 보기
                    <Icon name="external-link" className="size-3.5" />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {entry.images.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {entry.images.map((image, i) => (
              <figure
                key={image.caption || i}
                className="relative aspect-4/3 overflow-hidden rounded-xl border border-line"
              >
                {image.src ? (
                  <Image
                    src={asset(image.src)}
                    alt={image.caption || entry.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 240px"
                    className="object-cover"
                  />
                ) : (
                  <Placeholder
                    seed={`${entry.slug}-${i}`}
                    label={image.caption}
                    className="size-full"
                  />
                )}
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
