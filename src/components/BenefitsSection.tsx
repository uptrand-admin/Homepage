"use client";

import { Icon } from "@/components/Icon";
import { Reveal, Section, SectionTitle } from "@/components/ui";
import { benefits, contact, join } from "@/data/content";

/*
 * 항목 수에 맞춰 열을 정한다. 4개 기준으로 고정하면 3개일 때 오른쪽이 비어 왼쪽으로 쏠린다.
 * 클래스 문자열을 그대로 적어 둬야 Tailwind 가 미리 찾아 만들어 둔다(문자열을 이어 붙이면 못 찾는다).
 * 열 수가 꽉 차지 않아도 가운데로 오도록 폭을 제한하고 mx-auto 로 세운다.
 */
const COLUMNS: Record<number, string> = {
  1: "lg:max-w-[360px] lg:grid-cols-1",
  2: "lg:max-w-[760px] lg:grid-cols-2",
  3: "lg:max-w-[1120px] lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function BenefitsSection() {
  const columns = COLUMNS[Math.min(benefits.length, 4)] ?? COLUMNS[4];

  return (
    <Section id="benefits">
      <SectionTitle lead="UPTRAND" accent="BENEFITS" />

      <div className={`mx-auto grid gap-8 sm:grid-cols-2 ${columns}`}>
        {benefits.map((item, i) => (
          <Reveal key={item.title} delay={i * 100}>
            <div className="h-full rounded-2xl border border-line bg-white px-8 py-10 text-center shadow-card transition-all hover:-translate-y-2 hover:border-blue hover:shadow-hover">
              <div
                className={`mx-auto mb-5 grid size-17 place-items-center rounded-2xl ${
                  i % 2 === 1 ? "bg-orange-tint text-orange" : "bg-blue-tint text-blue"
                }`}
              >
                <Icon name={item.icon} className="size-8" />
              </div>
              <h3 className="text-lg font-extrabold text-title break-keep-ko">{item.title}</h3>
              <p className="mt-4 leading-relaxed text-body break-keep-ko">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function JoinSection() {
  return (
    <Section id="join" className="pb-30">
      <Reveal>
        <div className="relative mx-auto max-w-[900px] overflow-hidden rounded-[30px] border border-line bg-white px-6 py-16 text-center shadow-hover sm:px-10 sm:py-20">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange to-blue" />

          <h3 className="font-display text-[1.9rem] font-black tracking-tight text-title sm:text-[2.5rem]">
            {join.heading}
          </h3>
          <p className="mx-auto mt-5 max-w-[46ch] text-[1.1rem] text-body break-keep-ko">
            {join.body}
          </p>

          {join.isOpen ? (
            <a
              href={contact.applyUrl}
              target={contact.applyUrl.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="mt-9 inline-flex items-center justify-center rounded-xl bg-orange px-10 py-4 text-[1.05rem] font-bold text-white shadow-[0_10px_20px_rgba(255,87,34,0.25)] transition-all hover:-translate-y-1 hover:bg-orange-dark"
            >
              {join.cta}
            </a>
          ) : (
            <div className="mt-9">
              <span className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-line px-10 py-4 text-[1.05rem] font-bold text-slate-500">
                {join.cta}
              </span>
              <p className="mt-4 text-sm text-body">{join.closedMessage}</p>
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
}
