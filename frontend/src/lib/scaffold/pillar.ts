/**
 * 柱（Pillar）高さ関連のユーティリティ
 * - 将来の立面図や数量計算拡張で再利用することを想定
 * - 現在のUIには表示しない（非表示ロジック）
 */

import type { PillarType, ScaffoldPart } from '@/types/scaffold';

/**
 * 段（レベル）あたりの高さ（mm）
 * - 柱の基本ユニットとして 1900mm を採用
 * - TASK-306の要件: totalHeight = (levels × 1900) + jack.height
 */
export const PILLAR_LEVEL_HEIGHT_MM = 1900 as const;

/**
 * 柱の種別ごとの高さ（mm）マッピング
 * - 仕様で定義された固定値
 * - A, C, D, E, G, DG, EG, C-47, KD の9種
 */
export const PILLAR_TYPE_HEIGHTS_MM: Record<PillarType, number> = {
  /** A柱: 3800mm */
  A: 3800,
  /** C柱: 1900mm */
  C: 1900,
  /** D柱: 950mm */
  D: 950,
  /** E柱: 475mm */
  E: 475,
  /** G柱: 130mm */
  G: 130,
  /** DG柱: 1095mm */
  DG: 1095,
  /** EG柱: 610mm */
  EG: 610,
  /** C-47柱: 1230mm */
  'C-47': 1230,
  /** KD柱: 910mm */
  KD: 910,
};

/**
 * 指定した柱種別の高さ（mm）を取得する
 *
 * @param type - 柱の種別（A/C/D/E/G/DG/EG/C-47/KD）
 * @returns 高さ（mm）
 */
export function getPillarTypeHeightMm(type: PillarType): number {
  return PILLAR_TYPE_HEIGHTS_MM[type];
}

/**
 * 段数から柱の基本高さ（mm）を計算する
 *
 * @param levels - 段数（1以上の整数を推奨）
 * @returns 段数 × 1900mm
 */
export function computePillarLevelHeightMm(levels: number): number {
  const lv = Math.max(0, Math.floor(Number(levels) || 0));
  return lv * PILLAR_LEVEL_HEIGHT_MM;
}

/**
 * 柱の合計高さ（mm）を計算する
 * - 仕様: totalHeight = (levels × 1900) + jackHeightMm
 * - ジャッキ高さは外部（数量表や設定）から与える設計
 *
 * @param levels - 段数
 * @param jackHeightMm - ジャッキ高さ（mm）
 * @returns 合計高さ（mm）
 */
export function computePillarTotalHeightMm(levels: number, jackHeightMm: number): number {
  const base = computePillarLevelHeightMm(levels);
  const jack = Math.max(0, Math.floor(Number(jackHeightMm) || 0));
  return base + jack;
}

/**
 * 柱パーツへ高さ情報（mm）を付与する（不変更新）
 * - 現UIでは未使用（非表示）のため、将来の立面図やDXF拡張で利用想定
 *
 * @param part - 対象の柱パーツ（type==='柱' を想定）
 * @param levels - 段数（未指定時は part.meta.levels を使用）
 * @param jackHeightMm - ジャッキ高さ（mm）
 * @returns 高さ付与済みの新しいパーツ
 */
export function withPillarHeight(
  part: ScaffoldPart,
  { levels, jackHeightMm }: { levels?: number; jackHeightMm: number }
): ScaffoldPart {
  const lv = typeof levels === 'number' ? levels : Number(part.meta?.levels ?? 0);
  const total = computePillarTotalHeightMm(lv, jackHeightMm);
  return {
    ...part,
    meta: {
      ...(part.meta || {}),
      // 高さ（mm）をメタ情報として付与
      height: total,
    },
  };
}

