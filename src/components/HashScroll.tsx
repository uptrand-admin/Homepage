"use client";

import { useEffect } from "react";

/**
 * 주소 끝의 #섹션 으로 화면을 옮긴다.
 *
 * 같은 페이지 안에서 앵커를 누를 때는 브라우저가 알아서 처리하지만,
 * 게임 상세처럼 다른 페이지에서 /#about 으로 들어오면 맨 위에 멈춘다.
 * 라우터가 페이지를 바꾼 뒤 스크롤을 맨 위로 되돌리는데, 그 시점이
 * 우리가 옮긴 다음이라 결과가 덮이기 때문이다.
 *
 * 그래서 한 번만 시도하지 않고 잠깐 동안 몇 번 나눠 시도한다.
 * 이미 원하는 위치에 있으면 아무 일도 하지 않으므로 덧나지 않는다.
 * 얼마나 내릴지는 globals.css 의 scroll-padding-top 이 정한다(고정 헤더에 가리지 않도록).
 */
const ATTEMPT_DELAYS = [0, 60, 180, 400];

export function HashScroll() {
  useEffect(() => {
    const timers: number[] = [];

    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!id) return;

      for (const delay of ATTEMPT_DELAYS) {
        timers.push(
          window.setTimeout(() => {
            const target = document.getElementById(id);
            if (!target) return;

            // 이미 제자리면 건드리지 않는다. 사용자가 스크롤 중일 수도 있다.
            const top = target.getBoundingClientRect().top;
            if (Math.abs(top) < 120) return;

            /*
             * 다른 페이지에서 넘어온 경우이므로 곧바로 옮긴다.
             * 부드럽게 굴리면 긴 페이지를 처음부터 훑으며 내려가 어색하고,
             * 도착 전에 라우터가 맨 위로 되돌리면 중간에서 멈춰 버린다.
             * (같은 페이지 안에서 앵커를 누를 때의 부드러운 이동은 CSS 가 그대로 담당한다)
             */
            target.scrollIntoView({ behavior: "instant", block: "start" });
          }, delay),
        );
      }
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      for (const t of timers) window.clearTimeout(t);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return null;
}
