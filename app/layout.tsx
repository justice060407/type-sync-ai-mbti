import type { Metadata } from "next";
import { Noto_Sans_SC, Space_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
const sans = Noto_Sans_SC({ variable: "--font-sans", subsets: ["latin"], weight: ["400","500","600","700","900"] });
const mono = Space_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400","700"] });
export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  const title = "TYPE//SYNC — AI MBTI 人格测试";
  const description = "通过 20–50 道 AI 情境题，找出最接近的两种 MBTI 人格及各自相似度。";
  return {
    title, description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
