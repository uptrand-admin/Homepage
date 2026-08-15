"use client";

import Image from "next/image";
import { useState } from "react";
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
import { about, activities, albums, albumCategories, type Album } from "@/data/content";
import { asset } from "@/lib/asset";

const PHOTOS_INITIAL = 8;

export function AboutSection() {
  return (
    <Section id="about">
      <SectionTitle lead="ABOUT" accent="US" />
      <Story />
      <Activities />
      <Photos />
    </Section>
  );
}

function Story() {
  return (
    <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-15">
      <Reveal className="flex flex-col justify-center">
        <h3 className="text-[1.7rem] leading-snug font-extrabold text-title break-keep-ko sm:text-[2.2rem]">
          {about.heading}
        </h3>
        {about.body.map((paragraph) => (
          <p key={paragraph} className="mt-5 text-[1.05rem] leading-relaxed text-body break-keep-ko">
            {paragraph}
          </p>
        ))}

        <div className="mt-8 flex gap-5">
          {about.stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex-1 rounded-2xl bg-title px-6 py-5 text-white shadow-lift"
            >
              <div
                className={`font-display text-[2.2rem] leading-none font-black ${
                  i === 1 ? "text-orange" : ""
                }`}
              >
                {stat.value}
              </div>
              <div className="mt-2 text-sm font-bold text-slate-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="flex h-full flex-col rounded-3xl border border-line bg-white p-4 shadow-lift">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-subtle">
            {about.video ? (
              <iframe
                src={about.video}
                title={about.videoCaption}
                className="absolute inset-0 size-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid size-full place-items-center bg-line/60">
                <span className="grid size-16 place-items-center rounded-full border-2 border-slate-400 text-slate-400">
                  <Icon name="play" className="size-7" />
                </span>
              </div>
            )}
          </div>
          <p className="mt-4 text-center font-display font-bold text-body">
            {about.videoCaption}
          </p>
        </div>
      </Reveal>
    </div>
  );
}

function Activities() {
  const wide = activities.filter((a) => a.wide);
  const rest = activities.filter((a) => !a.wide);

  return (
    <div className="mt-20 border-t border-line pt-16">
      <h3 className="mb-8 text-center text-[1.4rem] font-extrabold text-title">활동 내용</h3>

      <div className="grid gap-5">
        {wide.map((item) => (
          <Reveal key={item.key}>
            <ActivityCard lead={item.lead} name={item.name} body={item.body} />
          </Reveal>
        ))}

        <div className="grid gap-5 sm:grid-cols-2">
          {rest.map((item, i) => (
            <Reveal key={item.key} delay={(i % 2) * 90}>
              <ActivityCard lead={item.lead} name={item.name} body={item.body} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ lead, name, body }: { lead: string; name: string; body: string }) {
  return (
    <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:border-blue hover:shadow-lift">
      <span className="text-xs font-bold text-blue">* {lead}</span>
      <h4 className="mt-1.5 text-xl font-extrabold text-title">{name}</h4>
      <p className="mt-3 leading-relaxed text-body break-keep-ko">{body}</p>
    </div>
  );
}

function Photos() {
  const [category, setCategory] = useState("전체");
  const [expanded, setExpanded] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const matched =
    category === "전체" ? albums : albums.filter((album) => album.category === category);
  const visible = expanded ? matched : matched.slice(0, PHOTOS_INITIAL);
  const open = albums.find((a) => a.slug === openSlug) ?? null;

  return (
    <div className="mt-20 border-t border-line pt-16">
      <h3 className="mb-8 text-center text-[1.4rem] font-extrabold text-title">활동 사진</h3>

      <Reveal>
        <FilterTabs
          items={albumCategories}
          active={category}
          onChange={(next) => {
            setCategory(next);
            setExpanded(false);
          }}
          variant="chip"
        />
      </Reveal>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {visible.map((album, i) => (
          <Reveal key={album.slug} delay={(i % 4) * 70}>
            <button
              type="button"
              onClick={() => setOpenSlug(album.slug)}
              className="group relative block aspect-4/3 w-full overflow-hidden rounded-xl border border-line shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              {album.cover ? (
                <Image
                  src={asset(album.cover)}
                  alt={album.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 260px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <Placeholder seed={album.slug} className="size-full" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5 text-left text-xs font-bold text-white break-keep-ko">
                {album.title}
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {!expanded && matched.length > PHOTOS_INITIAL ? (
        <MoreButton
          onClick={() => setExpanded(true)}
          label={`더보기 (${matched.length - PHOTOS_INITIAL})`}
        />
      ) : null}

      <AlbumViewer album={open} onClose={() => setOpenSlug(null)} />
    </div>
  );
}

/** 앨범 한 건을 좌우로 넘겨 보는 어두운 뷰어. */
function AlbumViewer({ album, onClose }: { album: Album | null; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const total = album?.photos.length ?? 0;
  const photo = album?.photos[Math.min(index, Math.max(0, total - 1))];

  const move = (step: number) => {
    if (!total) return;
    setIndex((prev) => (prev + step + total) % total);
  };

  return (
    <Modal
      open={Boolean(album)}
      onClose={() => {
        setIndex(0);
        onClose();
      }}
      tone="dark"
      labelledBy="album-title"
      width="max-w-[860px]"
    >
      {album ? (
        <>
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div className="flex gap-3">
              <span className="mt-1 h-10 w-1 shrink-0 rounded-sm bg-orange" />
              <div>
                <h3 id="album-title" className="text-lg font-extrabold text-white break-keep-ko">
                  {album.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400 break-keep-ko">{album.summary}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden font-display text-xs text-slate-400 sm:block">
                {album.dateRange}
              </span>
              <ModalClose
                onClose={() => {
                  setIndex(0);
                  onClose();
                }}
                tone="dark"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 pb-4 sm:px-6">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="이전 사진"
              disabled={total < 2}
              className="grid size-10 shrink-0 place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <Icon name="chevron-left" className="size-6" />
            </button>

            <figure className="relative aspect-video flex-1 overflow-hidden rounded-lg bg-black/30">
              {photo?.src ? (
                <Image
                  src={asset(photo.src)}
                  alt={photo.caption || album.title}
                  fill
                  sizes="(max-width: 860px) 100vw, 700px"
                  className="object-contain"
                />
              ) : (
                <Placeholder
                  seed={`${album.slug}-${index}`}
                  label={photo?.caption ?? "사진 준비 중"}
                  className="size-full"
                />
              )}
            </figure>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="다음 사진"
              disabled={total < 2}
              className="grid size-10 shrink-0 place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <Icon name="chevron-right" className="size-6" />
            </button>
          </div>

          <p className="pb-5 text-center font-display text-sm text-slate-400">
            {total ? `${Math.min(index + 1, total)} / ${total}` : "0 / 0"}
          </p>
        </>
      ) : null}
    </Modal>
  );
}
