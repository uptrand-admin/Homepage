"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";

export function Section({
  id,
  children,
  tinted = false,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  tinted?: boolean;
  className?: string;
}) {
  return (
    // z-index 를 주지 않는다. 배경 격자가 -z-10 이라 굳이 필요 없고,
    // 값을 주면 섹션마다 쌓임 맥락이 생겨 안에 있는 모달이 갇힌다.
    <section
      id={id}
      className={`relative px-5 py-20 sm:px-8 sm:py-30 ${tinted ? "bg-black/2" : ""} ${className}`}
    >
      <div className="mx-auto w-full max-w-[1140px]">{children}</div>
    </section>
  );
}

/** "OUR GAMES" 처럼 뒷 단어만 파랗게 강조되는 제목. */
export function SectionTitle({ lead, accent }: { lead: string; accent: string }) {
  return (
    <h2 className="mb-14 text-center font-display text-[2.2rem] font-extrabold tracking-tight text-title sm:text-[2.8rem]">
      {lead} <span className="text-blue">{accent}</span>
    </h2>
  );
}

/** 스크롤로 들어올 때 한 번만 나타난다. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function FilterTabs({
  items,
  active,
  onChange,
  variant = "underline",
}: {
  items: string[];
  active: string;
  onChange: (value: string) => void;
  variant?: "underline" | "chip";
}) {
  return (
    <div className="mb-10 flex flex-wrap justify-center gap-3" role="tablist">
      {items.map((item) => {
        const on = item === active;
        if (variant === "chip") {
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(item)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-all ${
                on
                  ? "border-orange bg-orange text-white"
                  : "border-line bg-white text-body hover:border-line-strong hover:text-title"
              }`}
            >
              {item}
            </button>
          );
        }
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item)}
            className={`relative px-4 py-2 text-[1.05rem] font-bold transition-colors ${
              on ? "text-orange" : "text-body hover:text-title"
            }`}
          >
            {item}
            {on ? (
              <span className="absolute inset-x-1/2 bottom-0 h-[3px] w-3/5 -translate-x-1/2 rounded-sm bg-orange" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function MoreButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="mt-10 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-full border border-line bg-white px-8 py-3 font-bold text-body shadow-card transition-all hover:-translate-y-0.5 hover:border-orange hover:text-orange"
      >
        {label}
      </button>
    </div>
  );
}

/**
 * 화면 전체를 덮는 모달. Esc 로 닫히고, 열려 있는 동안 배경 스크롤을 막는다.
 *
 * body 바로 아래에 그린다(포털). 섹션 안에 그대로 두면 그 섹션이 만든 쌓임 맥락에
 * 갇혀서, 아무리 z-index 를 높여도 뒤에 오는 섹션이나 고정 헤더가 모달 위에 겹친다.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  tone = "light",
  width = "max-w-[1000px]",
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
  tone?: "light" | "dark";
  width?: string;
}) {
  // 서버에서 그릴 때는 document 가 없으므로, 브라우저에 붙은 뒤에만 포털을 만든다.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-title/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`animate-modal flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl shadow-2xl ${width} ${
          tone === "dark" ? "bg-[#2f3136] text-slate-200" : "bg-white"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalClose({ onClose, tone = "light" }: { onClose: () => void; tone?: "light" | "dark" }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="닫기"
      className={`grid size-10 shrink-0 place-items-center rounded-full transition-all hover:rotate-90 ${
        tone === "dark"
          ? "bg-white/10 text-white hover:bg-white hover:text-title"
          : "bg-line text-title hover:bg-title hover:text-white"
      }`}
    >
      <Icon name="close" className="size-5" />
    </button>
  );
}

/**
 * 실제 이미지가 없을 때 쓰는 자리. seed 가 같으면 늘 같은 색이 나온다.
 * 시트에 이미지 경로를 채우면 이 자리는 사라진다.
 */
export function Placeholder({
  seed,
  label,
  className = "",
}: {
  seed: string;
  label?: string;
  className?: string;
}) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const hue = hash % 360;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 92%), hsl(${(hue + 40) % 360} 40% 84%))`,
      }}
      aria-hidden="true"
    >
      {label ? (
        <span className="px-3 text-center text-sm font-bold text-slate-500">{label}</span>
      ) : null}
    </div>
  );
}
