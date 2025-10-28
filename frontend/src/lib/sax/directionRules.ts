/**
 * 方向ルールロジック
 * スパンの線から足場部材の向きを決定
 */

import { calculateAngleDegrees } from '../utils/scale';

/**
 * 方向ルール：スパンの向きから足場部材の方向を決定
 *
 * ルール:
 * - 左→右（0度）: 下向き（270度）
 * - 上→下（90度）: 左向き（180度）
 * - 右→左（180度）: 上向き（90度）
 * - 下→上（270度）: 右向き（0度）
 *
 * つまり、スパンの方向に対して-90度（左に90度回転）が部材の向き
 *
 * @param start - スパンの始点座標（px）
 * @param end - スパンの終点座標（px）
 * @param reversed - 方向反転フラグ（Altキー押下時）
 * @returns 足場部材の方向（度数法：0=右、90=下、180=左、270=上）
 *
 * @example
 * // 左→右の線（0度）→ 下向き部材（270度）
 * calculateDirection({x: 0, y: 0}, {x: 100, y: 0}, false) // → 270
 *
 * // 上→下の線（90度）→ 左向き部材（180度）
 * calculateDirection({x: 0, y: 0}, {x: 0, y: 100}, false) // → 180
 *
 * // 左→右の線（0度）+ 反転 → 上向き部材（90度）
 * calculateDirection({x: 0, y: 0}, {x: 100, y: 0}, true) // → 90
 */
export function calculateDirection(
  start: { x: number; y: number },
  end: { x: number; y: number },
  reversed: boolean = false
): number {
  // スパンの角度を計算（0〜360度）
  const spanAngle = calculateAngleDegrees(start, end);

  // 基本方向：スパンの方向に対して-90度（左に90度回転）
  let direction = spanAngle - 90;

  // 角度を0〜360度の範囲に正規化
  if (direction < 0) {
    direction += 360;
  }

  // 方向反転フラグがtrueの場合、180度反転
  if (reversed) {
    direction = (direction + 180) % 360;
  }

  return direction;
}

/**
 * 方向を基準方向（0/90/180/270）に丸める
 * 足場部材は通常4方向のいずれかに配置される
 *
 * @param direction - 方向（度数法）
 * @returns 最も近い基準方向（0/90/180/270）
 *
 * @example
 * roundToCardinalDirection(85) // → 90
 * roundToCardinalDirection(95) // → 90
 * roundToCardinalDirection(190) // → 180
 */
export function roundToCardinalDirection(direction: number): number {
  // 0〜360度の範囲に正規化
  const normalizedDirection = ((direction % 360) + 360) % 360;

  // 最も近い基準方向を判定
  if (normalizedDirection < 45 || normalizedDirection >= 315) {
    return 0; // 右
  } else if (normalizedDirection >= 45 && normalizedDirection < 135) {
    return 90; // 下
  } else if (normalizedDirection >= 135 && normalizedDirection < 225) {
    return 180; // 左
  } else {
    return 270; // 上
  }
}

/**
 * 方向を人間が読みやすいテキストに変換
 *
 * @param direction - 方向（度数法）
 * @returns 方向のテキスト表現
 *
 * @example
 * directionToText(0) // → "右"
 * directionToText(90) // → "下"
 * directionToText(180) // → "左"
 * directionToText(270) // → "上"
 */
export function directionToText(direction: number): string {
  const cardinal = roundToCardinalDirection(direction);

  switch (cardinal) {
    case 0:
      return '右';
    case 90:
      return '下';
    case 180:
      return '左';
    case 270:
      return '上';
    default:
      return '不明';
  }
}

/**
 * 方向ルールの検証テスト用ヘルパー
 *
 * @param start - スパンの始点座標
 * @param end - スパンの終点座標
 * @param reversed - 方向反転フラグ
 * @returns 方向情報を含むオブジェクト
 */
export function getDirectionInfo(
  start: { x: number; y: number },
  end: { x: number; y: number },
  reversed: boolean = false
): {
  spanAngle: number;
  spanDirection: string;
  partDirection: number;
  partDirectionText: string;
  reversed: boolean;
} {
  const spanAngle = calculateAngleDegrees(start, end);
  const partDirection = calculateDirection(start, end, reversed);

  return {
    spanAngle,
    spanDirection: directionToText(spanAngle),
    partDirection,
    partDirectionText: directionToText(partDirection),
    reversed,
  };
}
