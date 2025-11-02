/**
 * ViewModeInfoCard.tsx
 * ビューモード時に部材ホバーで表示される情報カード
 *
 * 機能:
 * - 部材の種類・本数・柱種別などの情報を表示
 * - 数量未確定の場合は警告表示
 */

'use client';

import * as React from 'react';
import type { ScaffoldPart } from '@/types/scaffold';

interface ViewModeInfoCardProps {
  /** カードの表示位置（スクリーン座標） */
  screenPosition: { x: number; y: number };
  /** 対象の部材 */
  part: ScaffoldPart;
  /** グループID */
  groupId: string;
}

/**
 * 部材の数量情報を取得
 */
function getQuantityInfo(part: ScaffoldPart): {
  isConfirmed: boolean;
  displayText: string;
  pillarTypes?: string[];
} {
  const meta = part.meta || {};

  switch (part.type) {
    case '柱': {
      const counts = meta.pillarCounts as Record<string, number> | undefined;
      const isConfirmed = meta.quantityConfirmed === true || (counts && Object.values(counts).some((v) => Number(v || 0) > 0));
      
      if (counts) {
        const types: string[] = [];
        for (const [type, qty] of Object.entries(counts)) {
          if (Number(qty || 0) > 0) {
            types.push(`${type}×${qty}`);
          }
        }
        return {
          isConfirmed,
          displayText: types.length > 0 ? types.join(', ') : '未設定',
          pillarTypes: types.length > 0 ? types : undefined,
        };
      }
      
      // 旧フィールド対応
      const legacyType = meta.pillarType as string | undefined;
      const legacyQty = Number(meta.quantity || 0);
      if (legacyType && legacyQty > 0) {
        return {
          isConfirmed: true,
          displayText: `${legacyType}×${legacyQty}`,
          pillarTypes: [`${legacyType}×${legacyQty}`],
        };
      }
      
      return {
        isConfirmed: false,
        displayText: '未設定',
      };
    }

    case '布材': {
      const qty = Number(meta.quantity || 0);
      const tsubo = Number(meta.tsubo || 0);
      const braceQty = Number(meta.braceQty || 0);
      const isConfirmed = meta.quantityConfirmed === true || qty > 0 || braceQty > 0;
      
      const parts: string[] = [];
      if (qty > 0) parts.push(`本数: ${qty}`);
      if (tsubo > 0) parts.push(`ツボ: ${tsubo}`);
      if (braceQty > 0) parts.push(`筋交: ${braceQty}`);
      
      return {
        isConfirmed,
        displayText: parts.length > 0 ? parts.join(', ') : '未設定',
      };
    }

    case 'ブラケット': {
      const qty = Number(meta.quantity || 0);
      const size = meta.bracketSize === 'W' ? 'W(600mm)' : meta.bracketSize === 'S' ? 'S(355mm)' : '-';
      const isConfirmed = meta.quantityConfirmed === true || qty > 0;
      
      return {
        isConfirmed,
        displayText: qty > 0 ? `${size} × ${qty}` : `サイズ: ${size}, 未設定`,
      };
    }

    case 'アンチ': {
      const wQty = Number(meta.antiW || 0);
      const sQty = Number(meta.antiS || 0);
      const levels = Number(meta.levels || 0);
      const isConfirmed = meta.quantityConfirmed === true || wQty > 0 || sQty > 0;
      
      const parts: string[] = [];
      if (wQty > 0) parts.push(`W: ${wQty}枚`);
      if (sQty > 0) parts.push(`S: ${sQty}枚`);
      if (levels > 0) parts.push(`段数: ${levels}`);
      
      return {
        isConfirmed,
        displayText: parts.length > 0 ? parts.join(', ') : '未設定',
      };
    }

    case '階段': {
      const qty = Number(meta.quantity || 0);
      const length = Number(meta.length || 0);
      const isConfirmed = meta.quantityConfirmed === true || qty > 0;
      
      return {
        isConfirmed,
        displayText: qty > 0 ? `本数: ${qty}, 長さ: ${length}mm` : `長さ: ${length}mm, 未設定`,
      };
    }

    case '梁枠': {
      const qty = Number(meta.quantity || 0);
      const isConfirmed = meta.quantityConfirmed === true || qty > 0;
      
      return {
        isConfirmed,
        displayText: qty > 0 ? `本数: ${qty}` : '未設定',
      };
    }

    default:
      return {
        isConfirmed: false,
        displayText: '-',
      };
  }
}

/**
 * ビューモード情報カード
 */
export default function ViewModeInfoCard({ screenPosition, part, groupId }: ViewModeInfoCardProps) {
  const { isConfirmed, displayText, pillarTypes } = getQuantityInfo(part);

  // スクリーン座標での配置スタイル
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${screenPosition.x + 12}px`,
    top: `${screenPosition.y - 8}px`,
    zIndex: 50,
    pointerEvents: 'none',
  };

  return (
    <div
      style={style}
      className="glass-scope view-mode-info-card rounded-lg border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 px-2 py-1.5 text-[11px] dark:border-slate-700/60 dark:shadow-slate-900/50"
    >
      {/* 部材種別 */}
      <div className="font-semibold text-slate-700 dark:text-slate-200 mb-0.5">
        {part.type}
      </div>
      
      {/* 数量情報 */}
      <div className={`${isConfirmed ? 'text-slate-600 dark:text-slate-300' : 'text-red-500 dark:text-red-400 font-semibold'}`}>
        {displayText}
      </div>
      
      {/* 柱の場合、種別を個別に表示 */}
      {part.type === '柱' && pillarTypes && pillarTypes.length > 1 && (
        <div className="mt-1 pt-1 border-t border-white/20 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400">
          {pillarTypes.map((type, i) => (
            <div key={i}>{type}</div>
          ))}
        </div>
      )}
    </div>
  );
}

