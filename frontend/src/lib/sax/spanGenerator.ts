/**
 * スパン自動生成エンジン
 * 始点→終点の線から足場部材を自動生成
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ScaffoldGroup,
  ScaffoldPart,
  SpanInput,
  BracketSize,
} from '@/types/scaffold';
import {
  calculateDistanceMm,
  mmToPx,
  DEFAULT_SCALE,
} from '../utils/scale';
import { calculateDirection } from './directionRules';

/**
 * 布材の標準長さ（mm）
 * 足場の布材は基本的に1800mm単位
 */
const CLOTH_LENGTH = 1800;

/**
 * ブラケットのサイズ定義（mm）
 */
const BRACKET_SIZES: Record<BracketSize, number> = {
  W: 600, // W（ワイド）
  S: 355, // S（スモール）
};

/**
 * スパン入力から足場グループを生成
 *
 * @param input - スパン入力情報（始点、終点、設定）
 * @returns 生成された足場グループ
 *
 * @example
 * // 3600mmのスパン生成
 * const group = generateScaffoldSpan({
 *   start: { x: 0, y: 0 },
 *   end: { x: 360, y: 0 }, // 3600mm → 360px (scale=10)
 *   settings: {
 *     bracketSize: 'W',
 *     reversed: false,
 *     currentColor: 'white'
 *   }
 * });
 * // → 布材2本、柱3本、ブラケット3本、アンチ2枚
 */
export function generateScaffoldSpan(input: SpanInput): ScaffoldGroup {
  const { start, end, settings } = input;

  // スパンの長さを計算（mm）
  const spanLengthMm = calculateDistanceMm(start, end, DEFAULT_SCALE);

  // 必要な布材の本数を計算
  const clothCount = Math.ceil(spanLengthMm / CLOTH_LENGTH);

  // 部材の向きを計算
  const direction = calculateDirection(start, end, settings.reversed);

  // 各部材を生成
  const parts: ScaffoldPart[] = [];

  // 1. 布材を生成（1800mm間隔）
  for (let i = 0; i < clothCount; i++) {
    parts.push(
      createClothPart(
        start,
        end,
        i,
        settings.currentColor,
        direction
      )
    );
  }

  // 2. 柱を生成（布材の本数+1本、0mm, 1800mm, 3600mm...の位置）
  for (let i = 0; i <= clothCount; i++) {
    parts.push(
      createPillarPart(
        start,
        end,
        i,
        settings.currentColor,
        direction
      )
    );
  }

  // 3. ブラケットを生成（柱と同じ位置）
  for (let i = 0; i <= clothCount; i++) {
    parts.push(
      createBracketPart(
        start,
        end,
        i,
        settings.currentColor,
        settings.bracketSize,
        direction
      )
    );
  }

  // 4. アンチを生成（布材と同じ本数）
  for (let i = 0; i < clothCount; i++) {
    parts.push(
      createAntiPart(
        start,
        end,
        i,
        settings.currentColor,
        direction
      )
    );
  }

  // 足場グループとしてまとめる
  const group: ScaffoldGroup = {
    id: uuidv4(),
    parts,
    meta: {
      spanLength: spanLengthMm,
      line: {
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
      },
      settings: {
        bracketSize: settings.bracketSize,
        reversed: settings.reversed,
      },
    },
  };

  return group;
}

/**
 * 布材（cloth material）を生成
 *
 * @param start - スパンの始点
 * @param end - スパンの終点
 * @param index - 布材のインデックス（0から）
 * @param color - 部材の色
 * @param direction - 部材の向き（度数法）
 * @returns 布材の ScaffoldPart
 */
function createClothPart(
  start: { x: number; y: number },
  end: { x: number; y: number },
  index: number,
  color: string,
  direction: number
): ScaffoldPart {
  // 布材の位置を計算（スパンの方向に沿ってindex * CLOTH_LENGTH進む）
  const position = calculatePositionAlongLine(start, end, index * CLOTH_LENGTH);

  return {
    id: uuidv4(),
    type: '布材',
    position,
    color,
    meta: {
      length: CLOTH_LENGTH,
      direction,
      index,
    },
  };
}

/**
 * 柱（pillar）を生成
 *
 * @param start - スパンの始点
 * @param end - スパンの終点
 * @param index - 柱のインデックス（0から）
 * @param color - 部材の色
 * @param direction - 部材の向き（度数法）
 * @returns 柱の ScaffoldPart
 */
function createPillarPart(
  start: { x: number; y: number },
  end: { x: number; y: number },
  index: number,
  color: string,
  direction: number
): ScaffoldPart {
  // 柱の位置を計算（0mm, 1800mm, 3600mm...の位置）
  const position = calculatePositionAlongLine(start, end, index * CLOTH_LENGTH);

  return {
    id: uuidv4(),
    type: '柱',
    position,
    color,
    marker: 'circle', // デフォルトは通常柱（集計対象）
    meta: {
      direction,
      index,
    },
  };
}

/**
 * ブラケット（bracket）を生成
 *
 * @param start - スパンの始点
 * @param end - スパンの終点
 * @param index - ブラケットのインデックス（0から）
 * @param color - 部材の色
 * @param bracketSize - ブラケットのサイズ（W/S）
 * @param direction - 部材の向き（度数法）
 * @returns ブラケットの ScaffoldPart
 */
function createBracketPart(
  start: { x: number; y: number },
  end: { x: number; y: number },
  index: number,
  color: string,
  bracketSize: BracketSize,
  direction: number
): ScaffoldPart {
  // ブラケットの位置を計算（柱と同じ位置）
  const position = calculatePositionAlongLine(start, end, index * CLOTH_LENGTH);

  return {
    id: uuidv4(),
    type: 'ブラケット',
    position,
    color,
    meta: {
      bracketSize,
      width: BRACKET_SIZES[bracketSize],
      direction,
      index,
    },
  };
}

/**
 * アンチ（anti）を生成
 *
 * @param start - スパンの始点
 * @param end - スパンの終点
 * @param index - アンチのインデックス（0から）
 * @param color - 部材の色
 * @param direction - 部材の向き（度数法）
 * @returns アンチの ScaffoldPart
 */
function createAntiPart(
  start: { x: number; y: number },
  end: { x: number; y: number },
  index: number,
  color: string,
  direction: number
): ScaffoldPart {
  // アンチの位置を計算（布材の中間、つまり index * 1800 + 900mm の位置）
  const offsetMm = index * CLOTH_LENGTH + CLOTH_LENGTH / 2;
  const position = calculatePositionAlongLine(start, end, offsetMm);

  return {
    id: uuidv4(),
    type: 'アンチ',
    position,
    color,
    meta: {
      direction,
      index,
    },
  };
}

/**
 * スパンの線に沿って、指定距離（mm）進んだ位置を計算
 *
 * @param start - スパンの始点（px）
 * @param end - スパンの終点（px）
 * @param distanceMm - 始点からの距離（mm）
 * @returns 計算された位置（px）
 */
function calculatePositionAlongLine(
  start: { x: number; y: number },
  end: { x: number; y: number },
  distanceMm: number
): { x: number; y: number } {
  // スパンの全長（mm）
  const spanLengthMm = calculateDistanceMm(start, end, DEFAULT_SCALE);

  // 進行率を計算（0.0 〜 1.0）
  const ratio = Math.min(distanceMm / spanLengthMm, 1.0);

  // 線形補間で位置を計算
  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  };
}
