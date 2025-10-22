'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

/**
 * Headerコンポーネントのプロパティ型定義
 */
export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * ロゴテキスト（デフォルト: "ScaffAI"）
   */
  logoText?: string;

  /**
   * ユーザー名（ログイン済みの場合）
   */
  userName?: string;

  /**
   * ログアウトハンドラー
   */
  onLogout?: () => void;

  /**
   * モバイルメニュートグルハンドラー
   */
  onMenuToggle?: () => void;

  /**
   * モバイルメニューが開いているか
   */
  isMobileMenuOpen?: boolean;

  /**
   * チャットトグルハンドラー
   */
  onChatToggle?: () => void;

  /**
   * チャットが開いているか
   */
  isChatOpen?: boolean;
}

/**
 * Headerコンポーネント
 *
 * アプリケーション全体のヘッダー
 * - ロゴ・ブランディング
 * - ユーザーメニュー
 * - モバイル対応ハンバーガーメニュー
 * - ダークモード切替
 *
 * デザインコンセプト:
 * - 建設現場のヘルメットをイメージした安全感のある配色
 * - 大きなタッチターゲットで操作性を確保
 * - グラスモルフィズムで現代的な印象
 *
 * 使用例:
 * ```tsx
 * <Header
 *   userName="山田太郎"
 *   onLogout={handleLogout}
 *   onMenuToggle={toggleMobileMenu}
 * />
 * ```
 */
const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      logoText = 'ScaffAI',
      userName,
      onLogout,
      onMenuToggle,
      isMobileMenuOpen,
      onChatToggle,
      isChatOpen,
      ...props
    },
    ref
  ) => {
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [showUserMenu, setShowUserMenu] = React.useState(false);

    // 初期化時にダークモード状態をチェック
    React.useEffect(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    }, []);

    // ダークモード切替
    const toggleDarkMode = () => {
      const newDarkMode = !isDarkMode;
      console.log('ダークモード切替:', {
        before: isDarkMode,
        after: newDarkMode,
        classList: document.documentElement.classList.toString()
      });

      setIsDarkMode(newDarkMode);

      if (newDarkMode) {
        document.documentElement.classList.add('dark');
        console.log('dark クラス追加後:', document.documentElement.classList.toString());
      } else {
        document.documentElement.classList.remove('dark');
        console.log('dark クラス削除後:', document.documentElement.classList.toString());
      }
    };

    return (
      <header
        ref={ref}
        className={cn(
          // 基本スタイル
          'sticky top-0 z-50 w-full',
          'border-b-2 border-gray-200 dark:border-gray-700',
          'bg-white/95 backdrop-blur-md dark:bg-slate-900/95',
          'shadow-md',
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* 左側: ロゴとナビゲーション */}
          <div className="flex items-center gap-6">
            {/* サイドバートグルボタン（デスクトップでも表示） */}
            <button
              onClick={onMenuToggle}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                'text-foreground transition-all duration-200',
                'hover:bg-accent/10 active:scale-95',
                'focus-visible-ring'
              )}
              aria-label="サイドバーを開閉"
              aria-expanded={isMobileMenuOpen}
            >
              {/* ハンバーガーアイコン */}
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* ロゴ */}
            <Link
              href="/"
              className="flex items-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {/* ロゴアイコン（足場のイメージ） */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  {/* 足場のグリッドアイコン */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              </div>

              {/* ロゴテキスト */}
              <span className="hidden text-2xl font-bold text-foreground md:block">
                {logoText}
              </span>
            </Link>
          </div>

          {/* 右側: ユーザーメニューとアクション */}
          <div className="flex items-center gap-3">
            {/* AIチャットトグルボタン */}
            <button
              onClick={onChatToggle}
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-lg',
                'text-foreground transition-all duration-200',
                'hover:bg-accent/10 hover:scale-105 active:scale-95',
                'focus-visible-ring',
                isChatOpen && 'bg-primary/10 text-primary'
              )}
              aria-label={isChatOpen ? 'チャットを閉じる' : 'チャットを開く'}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              {/* 新着バッジ（デモ用） */}
              <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-destructive" />
            </button>

            {/* ダークモード切替ボタン */}
            <button
              onClick={toggleDarkMode}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                'text-foreground transition-all duration-200',
                'hover:bg-accent/10 hover:scale-105 active:scale-95',
                'focus-visible-ring'
              )}
              aria-label={isDarkMode ? 'ライトモードに切替' : 'ダークモードに切替'}
            >
              {isDarkMode ? (
                // 太陽アイコン
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                // 月アイコン
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* 通知ボタン */}
            <button
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-lg',
                'text-foreground transition-all duration-200',
                'hover:bg-accent/10 hover:scale-105 active:scale-95',
                'focus-visible-ring'
              )}
              aria-label="通知"
            >
              {/* ベルアイコン */}
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {/* 通知バッジ */}
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                3
              </span>
            </button>

            {/* ユーザーメニュー */}
            {userName ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2',
                    'transition-all duration-200',
                    'hover:bg-accent/10 hover:scale-105 active:scale-95',
                    'focus-visible-ring'
                  )}
                  aria-label="ユーザーメニューを開く"
                  aria-expanded={showUserMenu}
                >
                  {/* アバター */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-white shadow-md">
                    {userName.charAt(0)}
                  </div>

                  {/* ユーザー名（デスクトップのみ） */}
                  <span className="hidden font-medium text-foreground md:block">
                    {userName}
                  </span>

                  {/* 下向き矢印 */}
                  <svg
                    className={cn(
                      'hidden h-5 w-5 transition-transform duration-200 md:block',
                      showUserMenu && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* ドロップダウンメニュー */}
                {showUserMenu && (
                  <div
                    className={cn(
                      'absolute right-0 top-full mt-2 w-56',
                      'rounded-lg border-2 border-gray-200 bg-white shadow-lg',
                      'dark:border-gray-700 dark:bg-slate-800',
                      'animate-scale-in'
                    )}
                  >
                    <div className="p-2">
                      {/* プロフィール */}
                      <Link
                        href="/profile"
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-4 py-3',
                          'transition-colors duration-150',
                          'hover:bg-accent/10'
                        )}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>プロフィール</span>
                      </Link>

                      {/* 設定 */}
                      <Link
                        href="/settings"
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-4 py-3',
                          'transition-colors duration-150',
                          'hover:bg-accent/10'
                        )}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>設定</span>
                      </Link>

                      <div className="my-2 h-px bg-border" />

                      {/* ログアウト */}
                      <button
                        onClick={onLogout}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-4 py-3',
                          'text-destructive transition-colors duration-150',
                          'hover:bg-destructive/10'
                        )}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>ログアウト</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ログインしていない場合
              <Link href="/login">
                <Button size="default">ログイン</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';

export { Header };
