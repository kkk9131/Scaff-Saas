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
import { useDrawingStore } from '@/stores/drawingStore';
import { mmToPx, DEFAULT_SCALE } from '@/lib/utils/scale';
import type { PillarType } from '@/types/scaffold';

/**
 * DraggablePanelコンポーネント
 * ドラッグ可能なフローティングパネル
 */
export default function DraggablePanel() {
  // パネルの開閉状態
  const [isOpen, setIsOpen] = useState(false);
  // パネルの最小化/最大化状態
  const [isMinimized, setIsMinimized] = useState(false);
  // パネルのサイズ
  const [panelSize, setPanelSize] = useState({ width: 360, height: 420 });
  // ドラッグ中かどうか
  const [isDragging, setIsDragging] = useState(false);
  // リサイズ中かどうか
  const [isResizing, setIsResizing] = useState(false);
  // パネルの位置（初期値は固定値）
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // ドラッグ開始位置
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  // リサイズ開始位置とサイズ
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  // 初期位置設定済みかどうか
  const initialPositionSet = useRef(false);

  // 初回マウント時に位置を設定
  useEffect(() => {
    // クライアントサイドでのみ実行、かつ初回のみ
    if (typeof window !== 'undefined' && !initialPositionSet.current) {
      setPosition({
        x: window.innerWidth - 360 - 20,
        y: window.innerHeight - 420 - 20,
      });
      initialPositionSet.current = true;
    }
  }, []);

  // ウィンドウリサイズ時に位置を調整
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - panelSize.width),
        y: Math.min(prev.y, window.innerHeight - panelSize.height),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [panelSize]);

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
      const maxX = window.innerWidth - panelSize.width;
      const maxY = window.innerHeight - panelSize.height;

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
  }, [isDragging, panelSize]);

  // リサイズ開始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height,
    };
  };

  // リサイズ中
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;

      // 最小サイズと最大サイズを設定
      const minWidth = 320;
      const minHeight = 200;
      const maxWidth = window.innerWidth - position.x - 20;
      const maxHeight = window.innerHeight - position.y - 20;

      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeRef.current.startWidth + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeRef.current.startHeight + deltaY));

      setPanelSize({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position]);

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
      className="glass-scope draggable-panel fixed z-30 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50 transition-shadow"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '320px' : `${panelSize.width}px`,
        height: isMinimized ? '60px' : `${panelSize.height}px`,
        cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'default',
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
        <div className="relative p-3 h-[calc(100%-60px)] overflow-y-auto overflow-x-hidden">
          {/*
           * 数量表（UIのみ・ローカルステート）
           * - 3列グリッド
           * - 各セクション内に「数量（数値）」「メモ（文字）」の入力欄
           */}
          <QuantityGrid />
        </div>
      )}

      {/* リサイズハンドル */}
      {!isMinimized && (
        <div
          className={`absolute bottom-0 right-0 w-5 h-5 cursor-se-resize transition-opacity ${
            isResizing ? 'opacity-100' : 'opacity-30 hover:opacity-70'
          }`}
          onMouseDown={handleResizeStart}
          style={{
            background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, rgba(148, 163, 184, 0.6) 30%, rgba(148, 163, 184, 0.6) 35%, transparent 35%, transparent 50%, rgba(148, 163, 184, 0.6) 50%, rgba(148, 163, 184, 0.6) 55%, transparent 55%, transparent 65%, rgba(148, 163, 184, 0.6) 65%, rgba(148, 163, 184, 0.6) 70%, transparent 70%)',
          }}
          title="サイズを変更"
        />
      )}
    </div>
  );
}

/**
 * QuantityGrid
 * 数量表の3列グリッド（UIのみ、ローカルステート保持）
 */
function QuantityGrid() {
  // ストアから足場データを購読（柱の自動集計用）
  const { scaffoldGroups } = useDrawingStore();

  // セクション定義（UI用）
  type Item = { key: string; label: string };
  type Section = { name: string; items: Item[] };

  const sections: Section[] = [
    { name: '柱', items: ['A','C','D','E','G','DG','EG','C-47','KD'].map((v) => ({ key: `柱:${v}`, label: v })) },
    { name: '布材', items: ['1800','1500','1200','900','600','300','150'].map((v) => ({ key: `布材:${v}`, label: v })) },
    { name: 'ブラケット', items: ['600','355','750','900'].map((v) => ({ key: `ブラケット:${v}`, label: v })) },
    { name: 'アンチ', items: [
      ...['1800','1500','1200','900','600','150'].map((v) => ({ key: `アンチ:W${v}`, label: `W ${v}` })),
      ...['1800','1500','1200','900','600','355','150'].map((v) => ({ key: `アンチ:S${v}`, label: `S ${v}` })),
    ] },
    { name: '筋交', items: ['1800','1500','1200','900'].map((v) => ({ key: `筋交:${v}`, label: v })) },
    { name: 'ハネ', items: ['900','600','355','300','150'].map((v) => ({ key: `ハネ:${v}`, label: v })) },
    { name: 'ジャッキ', items: [
      { key: 'ジャッキ:ジャッキ', label: 'ジャッキ' },
      { key: 'ジャッキ:下屋ジャッキ', label: '下屋ジャッキ' },
      { key: 'ジャッキ:敷板(鉄)', label: '敷板（鉄）' },
      { key: 'ジャッキ:敷板(木)', label: '敷板（木）' },
      { key: 'ジャッキ:敷板(プラ)', label: '敷板（プラ）' },
      { key: 'ジャッキ:敷板(下屋)', label: '敷板（下屋）' },
    ] },
    { name: '階段', items: [
      { key: '階段:1800', label: '1800' },
      { key: '階段:900', label: '900' },
      { key: '階段:600', label: '600' },
      { key: '階段:1800梯子', label: '1800梯子' },
      { key: '階段:900梯子', label: '900梯子' },
    ] },
    { name: '梁枠', items: ['5400','3600','2700'].map((v) => ({ key: `梁枠:${v}`, label: v })) },
  ];

  // 入力値（数量・メモ）のローカルステート（UIのみ）
  const [values, setValues] = useState<Record<string, { qty: string; memo: string }>>({});

  const setQty = (key: string, v: string) =>
    setValues((s) => ({ ...s, [key]: { qty: v, memo: s[key]?.memo ?? '' } }));

  const setMemo = (key: string, v: string) =>
    setValues((s) => ({ ...s, [key]: { qty: s[key]?.qty ?? '', memo: v } }));

  // 柱の自動集計（A/C/D/E/G/DG/EG/C-47/KD）
  const P_TYPES: PillarType[] = ['A','C','D','E','G','DG','EG','C-47','KD'];
  const pillarSums: Partial<Record<PillarType, number>> = (() => {
    const sums: Partial<Record<PillarType, number>> = {};
    for (const t of P_TYPES) sums[t] = 0;
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== '柱') continue;
        const counts = p.meta?.pillarCounts;
        if (counts) {
          for (const t of P_TYPES) {
            const v = Number(counts[t] ?? 0);
            if (!isNaN(v) && v > 0) sums[t]! += v;
          }
        } else {
          // 旧フィールドの後方互換
          const t = p.meta?.pillarType as PillarType | undefined;
          const v = Number(p.meta?.quantity ?? 0);
          if (t && !isNaN(v) && v > 0) sums[t] = (sums[t] ?? 0) + v;
        }
      }
    }
    return sums;
  })();

  // 布材の自動集計（寸法ごと）: 各布材パーツの meta.length をキーに meta.quantity を合算
  const CLOTH_LENGTHS = [1800, 1500, 1200, 900, 600, 300, 150] as const;
  const clothSums: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(
      CLOTH_LENGTHS.map((l) => [l, 0])
    );
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== '布材') continue;
        const len = Number(p.meta?.length ?? 0);
        const qty = Number(p.meta?.quantity ?? 0);
        if (!Number.isFinite(len) || !Number.isFinite(qty)) continue;
        if ((CLOTH_LENGTHS as readonly number[]).includes(len) && qty > 0) {
          sums[len] += qty;
        }
      }
    }
    return sums;
  })();

  // ブラケットの自動集計（幅ごと）
  // - BracketQuantityCard で設定された meta.quantity を幅（meta.width: 600/355 等）単位で合算
  const BRACKET_WIDTHS = [600, 355, 750, 900] as const;
  const bracketSums: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(
      BRACKET_WIDTHS.map((w) => [w, 0])
    );
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== 'ブラケット') continue;
        const width = Number(p.meta?.width ?? 0);
        const qty = Number(p.meta?.quantity ?? 0);
        if (!Number.isFinite(width) || !Number.isFinite(qty)) continue;
        if ((BRACKET_WIDTHS as readonly number[]).includes(width) && qty > 0) {
          sums[width] += qty;
        }
      }
    }
    return sums;
  })();

  // アンチの自動集計（W/S × 寸法ごと）
  // - AntiQuantityCard で設定した meta.antiW / meta.antiS を寸法（meta.length）単位で合算
  const ANTI_W_LENGTHS = [1800, 1500, 1200, 900, 600, 150] as const;
  const ANTI_S_LENGTHS = [1800, 1500, 1200, 900, 600, 355, 150] as const;
  const antiSumsW: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(
      ANTI_W_LENGTHS.map((l) => [l, 0])
    );
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== 'アンチ') continue;
        const len = Number(p.meta?.length ?? 0);
        const w = Number(p.meta?.antiW ?? 0);
        if (!Number.isFinite(len) || !Number.isFinite(w)) continue;
        if ((ANTI_W_LENGTHS as readonly number[]).includes(len) && w > 0) {
          sums[len] += w;
        }
      }
    }
    return sums;
  })();
  const antiSumsS: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(
      ANTI_S_LENGTHS.map((l) => [l, 0])
    );
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== 'アンチ') continue;
        const len = Number(p.meta?.length ?? 0);
        const s = Number(p.meta?.antiS ?? 0);
        if (!Number.isFinite(len) || !Number.isFinite(s)) continue;
        if ((ANTI_S_LENGTHS as readonly number[]).includes(len) && s > 0) {
          sums[len] += s;
        }
      }
    }
    return sums;
  })();

  // 筋交の自動集計（寸法ごと）
  // 仕様:
  // - 基本は「作図モードで作図されたスパン（布材）の本数」を各寸法ごとにカウント（=1/スパン）
  // - 将来、1500と600を1200+900や1800+300に変更した場合も、布材の現在寸法を採用するため自然に反映される
  // - ただし、該当スパンに階段（同寸法・同オフセットの中心）が作図されている場合、そのスパンは0扱い
  //   代わりに、そのスパンの p.meta.braceQty（カードで編集）が集計対象になる
  const BRACE_LENGTHS = [1800, 1500, 1200, 900] as const;
  const braceSums: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(
      BRACE_LENGTHS.map((l) => [l, 0])
    );

    // ヘルパー: 対象布材スパンに階段があるかどうか
    const hasStairOnSpan = (g: any, cloth: any) => {
      const len = Number(cloth.meta?.length ?? 0);
      const off = Number(cloth.meta?.offsetMm ?? 0);
      if (!Number.isFinite(len) || !Number.isFinite(off)) return false;
      const centerMm = off + len / 2;
      return g.parts.some(
        (q: any) =>
          q.type === '階段' &&
          Number(q.meta?.length ?? -1) === len &&
          Math.round(Number(q.meta?.offsetMm ?? NaN)) === Math.round(centerMm)
      );
    };

    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== '布材') continue;
        const len = Number(p.meta?.length ?? 0);
        if (!Number.isFinite(len)) continue;
        if (!(BRACE_LENGTHS as readonly number[]).includes(len)) continue;

        if (hasStairOnSpan(g, p)) {
          // 階段あり: 自動0、本数はカード編集値（braceQty）を採用
          const qty = Number(p.meta?.braceQty ?? 0);
          if (qty > 0) sums[len] += qty;
        } else {
          // 階段なし: 自動で1カウント
          sums[len] += 1;
        }
      }
    }
    return sums;
  })();

  // 階段の自動集計（寸法ごと）: パーツ種別 '階段' の meta.length をカウント
  // - 1800 / 900 / 600 をサポート（'梯子' 項目は手動入力のまま）
  const STAIR_LENGTHS = [1800, 900, 600] as const;
  const stairSums: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(
      STAIR_LENGTHS.map((l) => [l, 0])
    );
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== '階段') continue;
        const len = Number(p.meta?.length ?? 0);
        const qty = Number(p.meta?.quantity ?? 1); // 未指定は1台
        if (!Number.isFinite(len) || !Number.isFinite(qty)) continue;
        if ((STAIR_LENGTHS as readonly number[]).includes(len) && qty > 0) {
          sums[len] += qty;
        }
      }
    }
    return sums;
  })();

  // ハネ（寸法）自動集計
  // 仕様:
  // - 対象は「柱・三角マーカー（marker==='triangle'）」のうち、梁枠確定由来でないもの（meta.markerFrom!=='beam-frame'）
  // - 三角の「逆向き」のブラケットまたは布材の寸法を読む
  //   - 逆向きの判定: 三角 direction の +180° とパーツ direction の角度差が 20° 以下
  //   - ブラケットは meta.width、布材は meta.length を寸法として採用
  // - 寸法が 900/600/355/300/150 のものを「ハネ」として該当寸法へ +1
  const HANE_LENGTHS = [900, 600, 355, 300, 150] as const;
  const angleDiff = (a: number, b: number) => {
    const d = Math.abs(((a % 360) + 360) % 360 - (((b % 360) + 360) % 360));
    return d > 180 ? 360 - d : d;
  };
  const degToUnitVector = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad), y: Math.sin(rad) };
  };
  const angleFromLine = (line: { start: { x: number; y: number }; end: { x: number; y: number } }) => {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const rad = Math.atan2(dy, dx);
    return (rad * 180) / Math.PI;
  };
  const isNear = (ax: number, ay: number, bx: number, by: number, tol = 6) => Math.hypot(ax - bx, ay - by) <= tol;
  const haneSums: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(HANE_LENGTHS.map((l) => [l, 0]));
    for (const g of scaffoldGroups) {
      // 事前に布材・ブラケットを抽出
      const cloths = g.parts.filter((p) => p.type === '布材');
      const brackets = g.parts.filter((p) => p.type === 'ブラケット');
      const baseDir = g.meta?.line ? angleFromLine(g.meta.line) : 0;

      for (const p of g.parts) {
        if (p.type !== '柱') continue;
        if ((p.marker ?? 'circle') !== 'triangle') continue; // 三角以外は無視
        if (String(p.meta?.markerFrom || '') === 'beam-frame') continue; // 梁枠確定由来は除外
        const rawDir = Number(p.meta?.markerDirection);
        // 方向未設定の三角は「見た目=上向き（270°）」とみなす
        const triDir = Number.isFinite(rawDir) ? rawDir : 270;
        // 逆向きは単純に +180°（markerDirection は見た目の方向を表現している）
        const opp = (triDir + 180) % 360;
        let picked: number | undefined = undefined;
        let pickedEnd: { x: number; y: number } | undefined = undefined;

        // 1) ブラケット優先
        for (const b of brackets) {
          const bdir = Number(b.meta?.direction ?? baseDir);
          const w = Number(b.meta?.width ?? 0);
          if (!(HANE_LENGTHS as readonly number[]).includes(w) || w <= 0) continue;
          const v = degToUnitVector(bdir);
          const startPos = { x: b.position.x, y: b.position.y };
          const endPos = { x: b.position.x + v.x * mmToPx(w, DEFAULT_SCALE), y: b.position.y + v.y * mmToPx(w, DEFAULT_SCALE) };
          const triAtStart = isNear(startPos.x, startPos.y, p.position.x, p.position.y, 8);
          const triAtEnd = isNear(endPos.x, endPos.y, p.position.x, p.position.y, 8);
          if (triAtStart && angleDiff(bdir, opp) <= 20) {
            picked = w;
            pickedEnd = endPos;
            break;
          }
          if (triAtEnd && angleDiff((bdir + 180) % 360, opp) <= 20) {
            picked = w;
            pickedEnd = startPos;
            break;
          }
        }
        // 2) 見つからなければ布材
        if (picked == null) {
          for (const c of cloths) {
            const l = Number(c.meta?.length ?? 0);
            if (!(HANE_LENGTHS as readonly number[]).includes(l) || l <= 0) continue;
            const cdir0 = Number.isFinite(Number(c.meta?.direction)) ? Number(c.meta?.direction) : baseDir;
            const candidates = [cdir0, (cdir0 + 180) % 360, (baseDir + 90) % 360, (baseDir + 270) % 360];
            for (const cdir of candidates) {
              const v = degToUnitVector(cdir);
              const startPos = { x: c.position.x, y: c.position.y };
              const endPos = { x: c.position.x + v.x * mmToPx(l, DEFAULT_SCALE), y: c.position.y + v.y * mmToPx(l, DEFAULT_SCALE) };
              const triAtStart = isNear(startPos.x, startPos.y, p.position.x, p.position.y, 8);
              const triAtEnd = isNear(endPos.x, endPos.y, p.position.x, p.position.y, 8);
              if (triAtStart && angleDiff(cdir, opp) <= 20) {
                picked = l;
                pickedEnd = endPos;
                break;
              }
              if (triAtEnd && angleDiff((cdir + 180) % 360, opp) <= 20) {
                picked = l;
                pickedEnd = startPos;
                break;
              }
            }
            if (picked != null) break;
          }
        }
        // 3) その先に必ず柱があること（終端近傍に柱が存在）
        if (picked != null && pickedEnd) {
          const hasPillarAtEnd = g.parts.some((q) => q.type === '柱' && isNear(q.position.x, q.position.y, pickedEnd!.x, pickedEnd!.y, 8));
          if (hasPillarAtEnd) sums[picked] += 1;
        }
      }
    }
    return sums;
  })();

  // ジャッキの自動集計
  // 仕様:
  // - 柱パーツのうち「丸マーカー（marker==='circle' もしくは未設定=既定の丸）」のみカウント対象
  // - 色が red の丸マーカー → 「下屋ジャッキ」へ加算
  // - 色が white/black/blue/green の丸マーカー → 「ジャッキ」へ加算
  // - 三角や四角（triangle/square）は集計しない
  const jackSums = (() => {
    let jack = 0;
    let shitaya = 0;
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== '柱') continue;
        const marker = (p.marker ?? 'circle') as 'circle' | 'triangle' | 'square';
        if (marker !== 'circle') continue; // 丸以外は集計しない
        const color = String(p.color || '').toLowerCase();
        if (color === 'red') shitaya += 1;
        else if (color === 'white' || color === 'black' || color === 'blue' || color === 'green') jack += 1;
      }
    }
    return { jack, shitaya };
  })();

  // 梁枠の自動集計（寸法ごと）: パーツ種別 '梁枠' の meta.length をカウント
  // - 対象は 5400 / 3600 / 2700
  const BEAM_FRAME_LENGTHS = [5400, 3600, 2700] as const;
  const beamFrameSums: Record<number, number> = (() => {
    const sums: Record<number, number> = Object.fromEntries(
      BEAM_FRAME_LENGTHS.map((l) => [l, 0])
    );
    for (const g of scaffoldGroups) {
      for (const p of g.parts) {
        if (p.type !== '梁枠') continue;
        const len = Number(p.meta?.length ?? 0);
        const qty = Number(p.meta?.quantity ?? 1);
        if (!Number.isFinite(len) || !Number.isFinite(qty)) continue;
        if ((BEAM_FRAME_LENGTHS as readonly number[]).includes(len) && qty > 0) {
          sums[len] += qty;
        }
      }
    }
    return sums;
  })();

  return (
    <div className="grid grid-cols-3 gap-2">
      {sections.map((section) => (
        <div
          key={section.name}
          className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-2 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60"
        >
          {/* セクション見出し */}
          <div className="mb-1 text-[11px] font-semibold tracking-wide text-slate-700 dark:text-slate-200 text-center">
            {section.name}
          </div>
          {/* アイテム一覧（スクロール可） */}
          <div className="max-h-48 overflow-y-auto overflow-x-hidden pr-0.5">
            {section.items.map((item) => {
              const state = values[item.key] || { qty: '', memo: '' };
              // 自動集計対象セクション
              const isPillar = section.name === '柱';
              const isCloth = section.name === '布材';
              const isBracket = section.name === 'ブラケット';
              const isAnti = section.name === 'アンチ';
              const pillarKey = item.label as PillarType;
              const autoQtyPillar = isPillar ? Number(pillarSums[pillarKey] ?? 0) : undefined;
              const autoQtyCloth = isCloth ? Number(clothSums[Number(item.label)] ?? 0) : undefined;
              const autoQtyBracket = isBracket ? Number(bracketSums[Number(item.label)] ?? 0) : undefined;
              // アンチはキーから W/S と寸法を判別（例: key="アンチ:W1800" / "アンチ:S355"）
              let autoQtyAnti: number | undefined = undefined;
              if (isAnti) {
                const key = item.key; // 形式: アンチ:W1800 or アンチ:S900 など
                const kind = key.includes('アンチ:W') ? 'W' : key.includes('アンチ:S') ? 'S' : undefined;
                const lenStr = key.replace('アンチ:W', '').replace('アンチ:S', '');
                const len = Number(lenStr);
                if (kind === 'W') autoQtyAnti = Number(antiSumsW[len] ?? 0);
                else if (kind === 'S') autoQtyAnti = Number(antiSumsS[len] ?? 0);
              }
              const isStair = section.name === '階段' && (STAIR_LENGTHS as readonly number[]).includes(Number(item.label));
              const autoQtyStair = isStair ? Number(stairSums[Number(item.label)] ?? 0) : undefined;
              const isBeamFrame = section.name === '梁枠' && (BEAM_FRAME_LENGTHS as readonly number[]).includes(Number(item.label));
              const autoQtyBeam = isBeamFrame ? Number(beamFrameSums[Number(item.label)] ?? 0) : undefined;
              const isJack = section.name === 'ジャッキ';
              const isJackAutoItem = isJack && (item.label === 'ジャッキ' || item.label === '下屋ジャッキ');
              const autoQtyJack = isJackAutoItem
                ? item.label === 'ジャッキ'
                  ? jackSums.jack
                  : jackSums.shitaya
                : undefined;
              const isBrace = section.name === '筋交' && (BRACE_LENGTHS as readonly number[]).includes(Number(item.label));
              const autoQtyBrace = isBrace ? Number(braceSums[Number(item.label)] ?? 0) : undefined;
              const isHane = section.name === 'ハネ' && (HANE_LENGTHS as readonly number[]).includes(Number(item.label));
              const autoQtyHane = isHane ? Number(haneSums[Number(item.label)] ?? 0) : undefined;
              return (
                <div key={item.key} className="mb-1.5 rounded-lg bg-white/40 p-1 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1">
                    <span className="flex-1 truncate text-[10px] text-slate-600 dark:text-slate-300" title={item.label}>
                      {item.label}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="w-14 rounded-md border border-slate-300 bg-white/80 px-1 py-0.5 text-right text-[11px] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-700"
                      placeholder="0"
                      value={
                        isPillar
                          ? String(autoQtyPillar)
                          : isCloth
                            ? String(autoQtyCloth)
                            : isBracket
                              ? String(autoQtyBracket)
                              : isAnti
                                ? String(autoQtyAnti ?? 0)
                                : isStair
                                  ? String(autoQtyStair ?? 0)
                                  : isBrace
                                    ? String(autoQtyBrace ?? 0)
                                    : isBeamFrame
                                      ? String(autoQtyBeam ?? 0)
                                      : isJackAutoItem
                                        ? String(autoQtyJack ?? 0)
                                        : isHane
                                          ? String(autoQtyHane ?? 0)
                                        : state.qty
                      }
                      onChange={(e) => !(isPillar || isCloth || isBracket || isAnti || isStair || isBrace || isBeamFrame || isJackAutoItem || isHane) && setQty(item.key, e.target.value)}
                      readOnly={isPillar || isCloth || isBracket || isAnti || isStair || isBrace || isBeamFrame || isJackAutoItem || isHane}
                      aria-readonly={isPillar || isCloth || isBracket || isAnti || isStair || isBrace || isBeamFrame || isJackAutoItem || isHane}
                      aria-label={`${section.name} ${item.label} の数量`}
                    />
                  </div>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white/80 px-1.5 py-1 text-[10px] outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="メモ"
                    value={state.memo}
                    onChange={(e) => setMemo(item.key, e.target.value)}
                    aria-label={`${section.name} ${item.label} のメモ`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
