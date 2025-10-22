import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ScaffAI - 足場業務支援SaaS',
  description: 'AI-powered scaffolding design and estimation platform',
};

/**
 * ルートレイアウト
 * アプリケーション全体の共通レイアウト
 *
 * - ToastProviderでトースト通知機能を提供
 * - グローバルスタイル（globals.css）の読み込み
 * - フォント設定（Inter）
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
