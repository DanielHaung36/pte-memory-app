import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PTE/雅思记忆助手 - 智能备考系统",
  description:
    "基于艾宾浩斯遗忘曲线的PTE/雅思备考系统，智能复习提醒，连击挑战，互动学习",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="light" style={{ colorScheme: "light" }}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
