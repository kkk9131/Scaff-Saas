/**
 * スケール変換ユーティリティ
 * mm（ミリメートル）とpx（ピクセル）の相互変換
 */

/**
 * デフォルトのスケール比率
 * 1px = 10mm として定義（調整可能）
 */
export const DEFAULT_SCALE = 10; // 1px = 10mm

/**
 * mm（ミリメートル）をpx（ピクセル）に変換
 *
 * @param mm - ミリメートル単位の値
 * @param scale - スケール比率（デフォルト: DEFAULT_SCALE）
 * @returns ピクセル単位の値
 *
 * @example
 * mmToPx(1800) // 1800mm → 180px
 * mmToPx(300) // 300mm → 30px
 * mmToPx(600) // 600mm → 60px
 */
export function mmToPx(mm: number, scale: number = DEFAULT_SCALE): number {
  return mm / scale;
}

/**
 * px（ピクセル）をmm（ミリメートル）に変換
 *
 * @param px - ピクセル単位の値
 * @param scale - スケール比率（デフォルト: DEFAULT_SCALE）
 * @returns ミリメートル単位の値
 *
 * @example
 * pxToMm(180) // 180px → 1800mm
 * pxToMm(30) // 30px → 300mm
 * pxToMm(60) // 60px → 600mm
 */
export function pxToMm(px: number, scale: number = DEFAULT_SCALE): number {
  return px * scale;
}

/**
 * グリッドにスナップする（mm単位）
 *
 * @param mm - ミリメートル単位の値
 * @param gridSize - グリッドサイズ（デフォルト: 150mm）
 * @returns グリッドにスナップされたミリメートル値
 *
 * @example
 * snapToGridMm(1650, 150) // → 1650mm（150の倍数）
 * snapToGridMm(1700, 150) // → 1650mm（最も近い150の倍数）
 * snapToGridMm(1750, 150) // → 1800mm（最も近い150の倍数）
 */
export function snapToGridMm(mm: number, gridSize: number = 150): number {
  return Math.round(mm / gridSize) * gridSize;
}

/**
 * グリッドにスナップする（px単位）
 *
 * @param px - ピクセル単位の値
 * @param gridSize - グリッドサイズ（デフォルト: 150mm）
 * @param scale - スケール比率（デフォルト: DEFAULT_SCALE）
 * @returns グリッドにスナップされたピクセル値
 *
 * @example
 * snapToGridPx(165, 150) // 165px → 1650mm → snap → 1650mm → 165px
 * snapToGridPx(170, 150) // 170px → 1700mm → snap → 1650mm → 165px
 */
export function snapToGridPx(
  px: number,
  gridSize: number = 150,
  scale: number = DEFAULT_SCALE
): number {
  const mm = pxToMm(px, scale);
  const snappedMm = snapToGridMm(mm, gridSize);
  return mmToPx(snappedMm, scale);
}

/**
 * 座標をグリッドにスナップ（px単位）
 *
 * @param position - {x, y} 座標
 * @param gridSize - グリッドサイズ（デフォルト: 150mm）
 * @param scale - スケール比率（デフォルト: DEFAULT_SCALE）
 * @returns グリッドにスナップされた座標
 */
export function snapPositionToGrid(
  position: { x: number; y: number },
  gridSize: number = 150,
  scale: number = DEFAULT_SCALE
): { x: number; y: number } {
  return {
    x: snapToGridPx(position.x, gridSize, scale),
    y: snapToGridPx(position.y, gridSize, scale),
  };
}

/**
 * 2点間の距離を計算（px単位）
 *
 * @param start - 始点座標
 * @param end - 終点座標
 * @returns ピクセル単位の距離
 */
export function calculateDistancePx(
  start: { x: number; y: number },
  end: { x: number; y: number }
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 2点間の距離を計算（mm単位）
 *
 * @param start - 始点座標（px）
 * @param end - 終点座標（px）
 * @param scale - スケール比率（デフォルト: DEFAULT_SCALE）
 * @returns ミリメートル単位の距離
 */
export function calculateDistanceMm(
  start: { x: number; y: number },
  end: { x: number; y: number },
  scale: number = DEFAULT_SCALE
): number {
  const distancePx = calculateDistancePx(start, end);
  return pxToMm(distancePx, scale);
}

/**
 * 2点間の角度を計算（ラジアン）
 *
 * @param start - 始点座標
 * @param end - 終点座標
 * @returns ラジアン単位の角度（-Math.PI 〜 Math.PI）
 */
export function calculateAngle(
  start: { x: number; y: number },
  end: { x: number; y: number }
): number {
  return Math.atan2(end.y - start.y, end.x - start.x);
}

/**
 * 2点間の角度を計算（度数法）
 *
 * @param start - 始点座標
 * @param end - 終点座標
 * @returns 度数法の角度（0 〜 360度）
 */
export function calculateAngleDegrees(
  start: { x: number; y: number },
  end: { x: number; y: number }
): number {
  const radians = calculateAngle(start, end);
  let degrees = (radians * 180) / Math.PI;
  // -180〜180を0〜360に変換
  if (degrees < 0) {
    degrees += 360;
  }
  return degrees;
}
