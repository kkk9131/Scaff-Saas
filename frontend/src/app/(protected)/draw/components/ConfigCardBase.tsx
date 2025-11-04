/**
 * ConfigCardBase.tsx
 * 各種カードUI（数量・設定カード）の共通レイアウト
 *
 * 目的:
 * - ヘッダー（アイコン＋タイトル＋閉じる）とガラス調の外枠を共通化
 * - スクリーン座標でのオーバーレイ配置を統一
 */

'use client';

import * as React from 'react';
import { X } from 'lucide-react';

export default function ConfigCardBase({
  screenPosition,
  title,
  icon,
  headerAccentClass = '',
  width = 360,
  onClose,
  children,
}: {
  /** 左上スクリーン座標(px) */
  screenPosition: { left: number; top: number };
  /** 見出しテキスト */
  title: string;
  /** 見出し左側のアイコン */
  icon?: React.ReactNode;
  /** アイコンの色などアクセント用クラス（例: text-blue-400） */
  headerAccentClass?: string;
  /** カード幅(px) */
  width?: number;
  /** 閉じる */
  onClose: () => void;
  /** 本文 */
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${screenPosition.left}px`,
    top: `${screenPosition.top}px`,
    zIndex: 40,
    width,
  };

  return (
    <div
      style={style}
      className="glass-scope fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
      aria-live="polite"
    >
      {/* ヘッダー */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          {icon ? <span className={headerAccentClass}>{icon}</span> : null}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 本文 */}
      <div className="relative p-3">{children}</div>
    </div>
  );
}

