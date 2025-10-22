'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * ナビゲーションアイテムの型定義
 */
export interface NavItem {
  /**
   * 表示名
   */
  label: string;

  /**
   * リンク先のパス
   */
  href: string;

  /**
   * アイコン（SVGパスまたはReactコンポーネント）
   */
  icon?: React.ReactNode;

  /**
   * バッジ（通知数など）
   */
  badge?: string | number;

  /**
   * 子ナビゲーション項目
   */
  children?: NavItem[];
}

/**
 * Sidebarコンポーネントのプロパティ型定義
 */
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * ナビゲーション項目の配列
   */
  navItems?: NavItem[];

  /**
   * サイドバーが開いているか（モバイル用）
   */
  isOpen?: boolean;

  /**
   * サイドバーを閉じるハンドラー
   */
  onClose?: () => void;
}

/**
 * デフォルトのナビゲーション項目
 */
const defaultNavItems: NavItem[] = [
  {
    label: 'ダッシュボード',
    href: '/dashboard',
    icon: (
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
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    label: 'プロジェクト',
    href: '/projects',
    icon: (
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
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    badge: 5,
  },
  {
    label: '作図',
    href: '/draw',
    icon: (
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    label: '見積',
    href: '/estimates',
    icon: (
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
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    label: 'AIチャット',
    href: '/chat',
    icon: (
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
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
    badge: 'New',
  },
  {
    label: '顧客管理',
    href: '/customers',
    icon: (
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

/**
 * Sidebarコンポーネント
 *
 * アプリケーションのメインナビゲーション
 * - レスポンシブ対応（デスクトップ・モバイル）
 * - アクティブ状態の視覚的表示
 * - アイコン＋テキストで視認性向上
 * - バッジ表示機能
 *
 * デザインコンセプト:
 * - 足場の垂直構造をイメージした縦方向レイアウト
 * - 大きなタッチターゲットで操作性確保
 * - セーフティオレンジでアクティブ状態を強調
 *
 * 使用例:
 * ```tsx
 * <Sidebar
 *   navItems={customNavItems}
 *   isOpen={isSidebarOpen}
 *   onClose={closeSidebar}
 * />
 * ```
 */
const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    { className, navItems = defaultNavItems, isOpen = false, onClose, ...props },
    ref
  ) => {
    const pathname = usePathname();

    return (
      <>
        {/* オーバーレイ（モバイル時） */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* サイドバー本体 */}
        <aside
          ref={ref}
          className={cn(
            // 基本レイアウト
            'fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col',
            'border-r-2 border-border bg-card shadow-lg',
            // モバイル時のアニメーション
            'transition-transform duration-300 ease-in-out md:translate-x-0',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
          {...props}
        >
          {/* ナビゲーションリスト */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
            {navItems.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClose={onClose}
              />
            ))}
          </nav>

          {/* フッター（バージョン情報など） */}
          <div className="border-t-2 border-border p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>ScaffAI v1.0.0</span>
              <Link
                href="/help"
                className="transition-colors hover:text-primary"
              >
                ヘルプ
              </Link>
            </div>
          </div>
        </aside>
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';

/**
 * ナビゲーションアイテムコンポーネント
 */
interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onClose?: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {/* メインアイテム */}
      <Link
        href={item.href}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          } else {
            onClose?.();
          }
        }}
        className={cn(
          // 基本スタイル
          'flex items-center gap-3 rounded-lg px-4 py-3',
          'font-medium transition-all duration-200',
          'touch-target',
          // アクティブ状態
          isActive
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
            : 'text-foreground hover:bg-accent/10 hover:text-accent',
          // ホバー効果
          !isActive && 'hover:scale-105 active:scale-95'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* アイコン */}
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}

        {/* ラベル */}
        <span className="flex-1">{item.label}</span>

        {/* バッジ */}
        {item.badge && (
          <span
            className={cn(
              'flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold',
              isActive
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-primary/10 text-primary'
            )}
          >
            {item.badge}
          </span>
        )}

        {/* 展開アイコン */}
        {hasChildren && (
          <svg
            className={cn(
              'h-5 w-5 transition-transform duration-200',
              isExpanded && 'rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </Link>

      {/* 子アイテム */}
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-border pl-4">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                'transition-colors duration-150',
                'hover:bg-accent/10 hover:text-accent'
              )}
            >
              {child.icon && (
                <span className="flex-shrink-0">{child.icon}</span>
              )}
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export { Sidebar };
