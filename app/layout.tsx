import type { Metadata } from "next";
import { Noto_Sans_SC, Space_Mono } from "next/font/google";
import "./globals.css";
const sans = Noto_Sans_SC({ variable: "--font-sans", subsets: ["latin"], weight: ["400","500","600","700","900"] });
const mono = Space_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400","700"] });
export const metadata: Metadata = { title: "TYPE//SYNC — AI MBTI 匹配实验室", description: "通过 20–50 道情境题，识别两个 AI 的 MBTI 性格与协作匹配度。", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
