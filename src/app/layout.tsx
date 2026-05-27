import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "塔罗占卜 - Tarot Divination",
  description: "AI 驱动的塔罗占卜体验，用塔罗牌探索命运的奥秘",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
