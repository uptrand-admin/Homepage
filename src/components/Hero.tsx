import Image from "next/image";
import { Fragment } from "react";
import { site } from "@/data/content";
import { asset } from "@/lib/asset";

/**
 * 시트에서 [대괄호] 로 감싼 부분만 주황색으로 칠한다.
 * 제목을 여러 칸으로 쪼개면 시트가 앞뒤 공백을 지우면서 단어가 붙어 버려서,
 * 한 칸에 문장을 그대로 적고 강조 위치만 표시하도록 했다.
 */
function Accented({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]*\])/).map((chunk, i) =>
        chunk.startsWith("[") && chunk.endsWith("]") ? (
          <span key={i} className="text-orange">
            {chunk.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{chunk}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * 시안의 히어로는 제목·본문·로켓만 있다. 뱃지와 지원 버튼은 없고,
 * 제목이 헤더 바로 아래에 붙어 시작한다. (지원 동선은 헤더의 JOIN 버튼)
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-33 pb-18">
      <div className="animate-fade-up mx-auto flex w-full max-w-[1140px] flex-col items-center gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-[600px] text-center lg:flex-1 lg:text-left">
          <h1 className="text-[2.6rem] leading-[1.2] font-extrabold tracking-[-1px] text-title break-keep-ko sm:text-[3.4rem] lg:text-[4rem]">
            <Accented text={site.heroTitle1} />
            <br />
            <Accented text={site.heroTitle2} />
          </h1>

          <p className="mt-6 text-[1.15rem] leading-[1.7] text-body break-keep-ko">
            {site.heroBody}
          </p>
        </div>

        <div className="flex justify-center lg:flex-1 lg:justify-end">
          <Image
            src={asset("/images/ship.gif")}
            alt="우주선"
            width={560}
            height={560}
            priority
            unoptimized
            className="animate-float w-full max-w-[300px] drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] lg:max-w-[360px]"
          />
        </div>
      </div>
    </section>
  );
}
