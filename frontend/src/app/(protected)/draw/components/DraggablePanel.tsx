/**
 * DraggablePanel.tsx
 * ドラッグ可能な引き出しパネルコンポーネント
 *
 * 機能:
 * - 画面右下から引き出せるパネル
 * - ドラッグ&ドロップで移動可能
 * - 将来の数量表表示用プレースホルダー
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { GripVertical, Table, Minimize2, Maximize2 } from 'lucide-react';

/**
 * DraggablePanelコンポーネント
 * ドラッグ可能なフローティングパネル
 */
export default function DraggablePanel() {
  // パネルの開閉状態
  const [isOpen, setIsOpen] = useState(false);
  // パネルの最小化/最大化状態
  const [isMinimized, setIsMinimized] = useState(false);
  // ドラッグ中かどうか
  const [isDragging, setIsDragging] = useState(false);
  // パネルの位置（初期値は固定値）
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // ドラッグ開始位置
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  // 初回マウント時に位置を設定
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 380,
        y: window.innerHeight - 500,
      });
    }
  }, []);

  // ウィンドウリサイズ時に位置を調整
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 320),
        y: Math.min(prev.y, window.innerHeight - 100),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
  };

  // ドラッグ中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;

      // 画面外に出ないように制限
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // パネルが閉じている場合はタブのみ表示
  if (!isOpen) {
    return (
      <div
        className="glass-scope fixed bottom-4 right-4 z-10 rounded-l-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-l-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 cursor-pointer transition-all hover:scale-105"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative flex items-center gap-2 px-4 py-3">
          <Table size={18} className="text-cyan-400" />
          <span className="text-sm font-semibold whitespace-nowrap text-slate-700 dark:text-slate-200">
            数量表
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-scope fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 transition-shadow"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '320px' : '360px',
        height: isMinimized ? '60px' : '420px',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div
        className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-slate-700/50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={18} className="text-slate-400 dark:text-slate-500" />
          <Table size={18} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">数量表</h3>
        </div>

        <div className="flex items-center gap-1">
          {/* 最小化/最大化ボタン */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
            title={isMinimized ? '最大化' : '最小化'}
            aria-label={isMinimized ? '最大化' : '最小化'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>

          {/* 閉じるボタン */}
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white/10 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all"
            title="閉じる"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      </div>

      {/* コンテンツエリア */}
      {!isMinimized && (
        <div className="relative p-4 h-[calc(100%-60px)] overflow-y-auto">
          {/* プレースホルダー */}
          <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/20">
            <div className="text-center">
              <Table size={32} className="mx-auto mb-2 text-cyan-400 opacity-50" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                数量表機能は準備中です
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                将来、このパネルで数量を確認しながら<br />
                作業ができるようになります
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
