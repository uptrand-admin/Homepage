"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { nav, site } from "@/data/content";
import { asset } from "@/lib/asset";

export function Header() {
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[1000] border-b border-line bg-white/85 backdrop-blur-md transition-shadow ${
        lifted ? "shadow-card" : ""
      }`}
    >
      {/* 시안의 헤더 높이는 60px. JOIN 버튼이 줄 높이를 밀어 올리지 않도록 높이를 고정한다. */}
      <div className="mx-auto flex h-15 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="shrink-0 transition-transform hover:scale-105"
          aria-label={`${site.name} 홈으로`}
        >
          <Image
            src={asset("/images/logo.png")}
            alt={site.name}
            width={1600}
            height={448}
            priority
            className="h-6 w-auto sm:h-7"
          />
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-display text-base font-bold text-title transition-colors hover:text-orange"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#join"
            className="rounded-lg bg-orange px-5 py-1.5 font-display text-base font-bold text-white transition-colors hover:bg-orange-dark"
          >
            JOIN
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          className="grid size-10 place-items-center rounded-lg border border-line text-title md:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className={`absolute inset-x-0 top-0 h-0.5 bg-current transition-transform ${
                open ? "translate-y-[5px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute inset-x-0 bottom-0 h-0.5 bg-current transition-transform ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open ? (
        <nav className="border-t border-line bg-white/95 px-5 py-3 backdrop-blur-xl md:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line/70 py-3.5 font-display font-bold text-title"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#join"
            onClick={() => setOpen(false)}
            className="mt-4 flex justify-center rounded-lg bg-orange px-5 py-3 font-display font-bold text-white"
          >
            JOIN
          </a>
        </nav>
      ) : null}
    </header>
  );
}
