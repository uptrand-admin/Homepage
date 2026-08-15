import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/data/content";
import { absoluteUrl } from "@/lib/asset";
import "./globals.css";

/** 본문 국문 서체. CDN 대신 저장소에 넣어 직접 서빙한다. */
const pretendard = localFont({
  src: [
    { path: "./fonts/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Pretendard-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Pretendard-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

/** 영문 제목용. 굵고 각진 인상을 준다. */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

/** 시트에 공유 이미지를 지정하지 않았으면 로고를 쓴다. */
const shareImage = absoluteUrl(site.shareImage || "/images/logo.png");

export const metadata: Metadata = {
  title: {
    template: `%s | ${site.name}`,
    default: `${site.name} | Indie Game Studio`,
  },
  description: site.heroBody,
  openGraph: {
    title: `${site.name} | Indie Game Studio`,
    description: site.heroBody,
    siteName: site.fullName,
    locale: "ko_KR",
    type: "website",
    images: shareImage ? [shareImage] : undefined,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${montserrat.variable} h-full`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <div
          className="bg-grid pointer-events-none fixed inset-0 -z-10"
          aria-hidden="true"
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
