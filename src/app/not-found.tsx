import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-[4rem] leading-none font-black text-orange">404</p>
      <h1 className="mt-6 text-2xl font-extrabold text-title break-keep-ko">
        찾으시는 페이지가 없습니다
      </h1>
      <p className="mt-3 text-body break-keep-ko">
        주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-orange px-8 py-3.5 font-bold text-white transition-colors hover:bg-orange-dark"
      >
        메인으로 돌아가기
      </Link>
    </div>
  );
}
