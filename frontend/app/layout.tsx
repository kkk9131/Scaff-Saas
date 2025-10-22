import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScaffAI - 足場業務支援SaaS",
  description: "AI-powered scaffolding design and estimation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* 認証コンテキストプロバイダーでアプリ全体をラップ */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
