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
   * サイドバーが開いているか
   */
  isOpen?: boolean;

  /**
   * サイドバーを閉じるハンドラー
   */
  onClose?: () => void;

  /**
   * サイドバーを開くハンドラー
   */
  onOpen?: () => void;

  /**
   * サイドバーの開閉をトグルするハンドラー
   */
  onToggle?: () => void;
}

/**
 * デフォルトのナビゲーション項目
 * 要件: プロジェクト、作図ツール、売上管理、チーム、見積り作成、設定
 */
const defaultNavItems: NavItem[] = [
  {
    label: 'プロジェクト',
    href: '/dashboard/projects',
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
  },
  {
    label: '作図ツール',
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
    label: '売上管理',
    href: '/sales',
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
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    label: 'チーム',
    href: '/teams',
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
          d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-9.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    children: [
      {
        label: 'メンバー管理',
        href: '/teams/members',
      },
      {
        label: '権限設定',
        href: '/teams/permissions',
      },
    ],
  },
  {
    label: '見積り作成',
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
    label: '設定',
    href: '/settings',
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
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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
    { className, navItems = defaultNavItems, isOpen = true, onClose, ...props },
    ref
  ) => {
    const pathname = usePathname();

    return (
      <>
        {/* オーバーレイ（モバイル時のみ） */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* サイドバー本体 */}
        <aside data-sidebar-root
          ref={ref}
          className={cn(
            // 基本レイアウト
            'fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col',
            // 背景は完全透過（ライト/ダーク共通）
            'border-r border-gray-200 dark:border-gray-700 bg-transparent',
            // アニメーション
            'transition-all duration-300 ease-in-out',
            // 幅の切り替え（開：w-64、閉：w-20）
            isOpen ? 'w-64' : 'w-20',
            // モバイル時の表示制御
            'md:translate-x-0',
            isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            className
          )}
          style={{ backgroundColor: 'transparent' }}
          {...props}
        >
          {/* ナビゲーションリスト */}
          <nav className={cn(
            // ライトモード時は黒文字に統一
            'flex-1 space-y-1 overflow-y-auto scrollbar-thin text-black',
            isOpen ? 'p-4' : 'p-2'
          )}>
            {navItems.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                isOpen={isOpen}
                currentPath={pathname ?? ''}
                onClose={onClose}
              />
            ))}
          </nav>

          {/* フッター（バージョン情報など） */}
          {isOpen && (
            <div className="border-t border-white/30 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between text-xs text-black/80 dark:text-gray-400">
                <span>ScaffAI v1.0.0</span>
                <Link
                  href="/help"
                  className="transition-colors hover:text-primary"
                >
                  ヘルプ
                </Link>
              </div>
            </div>
          )}
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
  isOpen: boolean;
  currentPath: string;
  onClose?: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  isOpen,
  currentPath,
  onClose,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const childHrefs = React.useMemo(
    () => (item.children ? item.children.map((child) => child.href) : []),
    [item.children]
  );

  const [isExpanded, setIsExpanded] = React.useState(() => {
    if (!hasChildren) {
      return false;
    }

    const isParentActive = currentPath.startsWith(item.href);
    const isAnyChildActive = childHrefs.some((href) =>
      currentPath.startsWith(href)
    );

    return isParentActive || isAnyChildActive;
  });

  React.useEffect(() => {
    if (!hasChildren) {
      return;
    }

    const isParentActive = currentPath.startsWith(item.href);
    const isAnyChildActive = childHrefs.some((href) =>
      currentPath.startsWith(href)
    );

    if (isParentActive || isAnyChildActive) {
      setIsExpanded(true);
    }
  }, [childHrefs, currentPath, hasChildren, item.href]);

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
          'flex items-center rounded-lg py-3 font-medium transition-all duration-200 touch-target',
          // 幅に応じたパディング調整
          isOpen ? 'gap-3 px-4' : 'justify-center px-2',
          // アクティブ状態
          // アクティブ時は共通のエメラルド→シアングラデで統一
          isActive
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-cyan-500/30 focus-visible:ring-emerald-300'
            : 'text-black hover:bg-black/5 hover:text-black dark:text-gray-300 dark:hover:bg-[#06B6D4]/20',
          // ホバー効果
          !isActive && 'hover:scale-105 active:scale-95'
        )}
        aria-current={isActive ? 'page' : undefined}
        title={!isOpen ? item.label : undefined}
      >
        {/* アイコン */}
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}

        {/* ラベル（開いている時のみ表示） */}
        {isOpen && <span className="flex-1">{item.label}</span>}

        {/* バッジ（開いている時のみ表示） */}
        {isOpen && item.badge && (
          <span
            className={cn(
              'flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold',
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-black/10 text-black dark:bg-[#8B5CF6]/20 dark:text-[#8B5CF6]'
            )}
          >
            {item.badge}
          </span>
        )}

        {/* 展開アイコン（開いている時のみ表示） */}
        {isOpen && hasChildren && (
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
        <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-4 transition-colors">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className={cn(
                // 子項目もライトは黒文字
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-black dark:text-gray-300',
                'transition-colors duration-150',
                'hover:bg-black/5 hover:text-black dark:hover:bg-accent/20 dark:hover:text-accent'
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
