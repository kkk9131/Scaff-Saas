/**
 * Bento UI グリッド
 * - ダッシュボード向けのBento風カードグリッドとカードコンポーネント
 * - ガラスモーフィズム＋グラデーションオーバーレイの見た目を統一
 */

'use client'

import React from 'react'
import clsx from 'clsx'

/**
 * グリッド全体のコンテナ
 * - 画面幅に応じて1/2/4カラムに切替
 */
export const BentoGrid: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    className={clsx('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-[1fr] gap-4', className)}
    {...rest}
  />
)

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** xlブレイクポイントでの列スパン（1〜4） */
  spanCols?: 1 | 2 | 3 | 4
  /** xlブレイクポイントでの行スパン（1〜2程度を想定） */
  spanRows?: 1 | 2
  /** アクセシビリティ用: タイトルID（aria-labelledbyに使用） */
  labelId?: string
  /** 見出しと説明をまとめたヘッダー領域 */
  header?: React.ReactNode
  /** 右上補助アクション（オプション） */
  action?: React.ReactNode
}

/**
 * BentoCard
 * - ガラスモーフィズム＋ホバーオーバーレイ
 * - spanCols/spanRowsでカードサイズを制御
 */
export const BentoCard: React.FC<BentoCardProps> = ({
  spanCols = 1,
  spanRows = 1,
  className,
  header,
  action,
  labelId,
  children,
  ...rest
}) => {
  const colClass = `xl:col-span-${spanCols}`
  const rowClass = spanRows === 2 ? 'xl:row-span-2' : 'xl:row-span-1'

  const glassClass =
    // カード内のデフォルト文字色は card-foreground トークンに合わせる
    // bento-card: ダッシュボード用のスコープ指定でスタイルを上書きしやすくするための識別クラス
    // ライト: 完全不透明の柔らかい白（bg-card） / ダーク: 落ち着いたガラス
    'bento-card group relative overflow-hidden rounded-2xl border border-border dark:border-slate-700/60 bg-card dark:bg-slate-950/50 text-card-foreground backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/25 dark:hover:shadow-indigo-900/40'

  return (
    <section
      className={clsx(glassClass, 'flex flex-col', colClass, rowClass, className)}
      aria-labelledby={labelId}
      {...rest}
    >
      {(header || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 dark:border-slate-700/50">
          <div className="min-w-0 flex-1">{header}</div>
          {action ? <div className="ml-3 shrink-0">{action}</div> : null}
        </div>
      )}
      <div className="p-4 flex-1 min-h-0">{children}</div>
    </section>
  )}
