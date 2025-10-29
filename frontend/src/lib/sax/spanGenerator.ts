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
  calculateAngleDegrees,
} from '../utils/scale';
import { calculateDirection } from './directionRules';

/**
 * 使用可能なスパン長（mm）
 * 大きいものを優先（貪欲）し、必要に応じて300回避の調整を行う
 */
const ALLOWED_SPANS_DESC = [1800, 1500, 1200, 900, 600, 300, 150] as const;

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
  const rawSpanLengthMm = calculateDistanceMm(start, end, DEFAULT_SCALE);
  // 150mm単位に正規化（グリッド最小単位）
  const spanLengthMm = Math.round(rawSpanLengthMm / 150) * 150;

  // スパンを許容長で分割（例: 3000 → [1800,1200]、3900 → [1800,1500,600]）
  const segments = splitSpanIntoSegments(spanLengthMm);

  // 方向関連の基準角度を計算
  // spanAngle: スパン（ライン）と平行な角度（度数法）
  // outwardDirection: ラインに対して外向き（法線）方向（度数法）
  const spanAngle = calculateAngleDegrees(start, end);
  const outwardDirection = calculateDirection(start, end, settings.reversed);

  // 各部材を生成
  const parts: ScaffoldPart[] = [];

  // 1. 布材を生成（各セグメント長）
  let offsetMm = 0;
  for (let i = 0; i < segments.length; i++) {
    const segLen = segments[i];
    parts.push(
      createClothPart(
        start,
        end,
        offsetMm,
        segLen,
        settings.currentColor,
        spanAngle
      )
    );
    offsetMm += segLen;
  }

  // 2. 柱を生成（各境界：0, seg1, seg1+seg2, ...）
  offsetMm = 0;
  for (let i = 0; i <= segments.length; i++) {
    parts.push(
      createPillarPart(
        start,
        end,
        offsetMm,
        settings.currentColor,
        outwardDirection
      )
    );
    if (i < segments.length) offsetMm += segments[i];
  }

  // 3. ブラケットを生成（柱と同じ位置）
  offsetMm = 0;
  for (let i = 0; i <= segments.length; i++) {
    parts.push(
      createBracketPart(
        start,
        end,
        offsetMm,
        settings.currentColor,
        settings.bracketSize,
        settings.reversed
      )
    );
    if (i < segments.length) offsetMm += segments[i];
  }

  // 4. アンチを生成（各セグメントごと）
  offsetMm = 0;
  for (let i = 0; i < segments.length; i++) {
    const segLen = segments[i];
    parts.push(
      createAntiPart(
        start,
        end,
        offsetMm,
        segLen,
        settings.currentColor,
        settings.bracketSize,
        spanAngle,
        settings.reversed
      )
    );
    offsetMm += segLen;
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
  offsetMm: number,
  lengthMm: number,
  color: string,
  angle: number
): ScaffoldPart {
  // 布材の開始位置（沿い方向のオフセット）
  const position = calculatePositionAlongLine(start, end, offsetMm);

  return {
    id: uuidv4(),
    type: '布材',
    position,
    color,
    meta: {
      length: lengthMm,
      // 布材の長手はスパンと平行
      direction: angle,
      offsetMm,
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
  offsetMm: number,
  color: string,
  direction: number
): ScaffoldPart {
  // 柱の位置を計算（各境界のオフセット）
  const position = calculatePositionAlongLine(start, end, offsetMm);

  return {
    id: uuidv4(),
    type: '柱',
    position,
    color,
    marker: 'circle', // デフォルトは通常柱（集計対象）
    meta: {
      direction,
      offsetMm,
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
  offsetMm: number,
  color: string,
  bracketSize: BracketSize,
  reversed: boolean
): ScaffoldPart {
  // ブラケットの位置を計算（柱と同じ位置＝各境界のオフセット）
  const position = calculatePositionAlongLine(start, end, offsetMm);

  // アンチと同じ外向き法線方向に伸ばすため、法線ベクトル→角度へ変換
  const n = getOutwardNormalUnit(start, end, reversed);
  const direction = ((Math.atan2(n.y, n.x) * 180) / Math.PI + 360) % 360;

  return {
    id: uuidv4(),
    type: 'ブラケット',
    position,
    color,
    meta: {
      bracketSize,
      width: BRACKET_SIZES[bracketSize],
      direction,
      offsetMm,
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
  offsetMm: number,
  lengthMm: number,
  color: string,
  bracketSize: BracketSize,
  spanAngle: number,
  reversed: boolean
): ScaffoldPart {
  /**
   * アンチの配置ロジック（MVP仕様）
   * - 長手（1800mm）はラインと常に平行（spanAngle）
   * - 各1800mm区間の中点（index*1800 + 900mm）を基準点とする
   * - 外向き法線方向に中心をオフセット
   *   - W: 内側長辺150mm + 半幅200mm = 350mm
   *   - S: 内側長辺 50mm + 半幅120mm = 170mm（Sのアンチ幅は240mm）
   * - Alt（reversed）がtrueのときは法線方向を反転
   */

  // 1) ライン上の中点（各セグメントの中間）を取得
  const alongMm = offsetMm + lengthMm / 2;
  const basePos = calculatePositionAlongLine(start, end, alongMm);

  // 2) 外向きの単位法線ベクトル（px単位の方向のみ）
  const n = getOutwardNormalUnit(start, end, reversed);

  // 3) 中心オフセット量（mm）を決定
  const antiWidthMm = bracketSize === 'W' ? 400 : 240;
  const innerClearMm = bracketSize === 'W' ? 150 : 50;
  const centerOffsetMm = innerClearMm + antiWidthMm / 2; // W=350mm, S=170mm
  const centerOffsetPx = mmToPx(centerOffsetMm, DEFAULT_SCALE);

  // 4) 中心座標 = ライン中点 + 法線×中心オフセット
  const position = {
    x: basePos.x + n.x * centerOffsetPx,
    y: basePos.y + n.y * centerOffsetPx,
  };

  return {
    id: uuidv4(),
    type: 'アンチ',
    position,
    color,
    meta: {
      // 長手はスパンと平行
      direction: spanAngle,
      // 寸法情報
      length: lengthMm,
      width: antiWidthMm, // W:400mm, S:240mm
      bracketSize,
      offsetMm,
    },
  };
}

/**
 * ラインの外向き単位法線ベクトルを返す
 * 既定はスパン方向に対して-90°（左回転）。reversed=trueで反転。
 * 戻り値はpx座標系の単位ベクトル（大きさ1、方向のみ）
 */
function getOutwardNormalUnit(
  start: { x: number; y: number },
  end: { x: number; y: number },
  reversed: boolean
): { x: number; y: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // 接線の単位ベクトル
  const tx = dx / len;
  const ty = dy / len;
  // -90°回転（左回転）の法線
  let nx = -ty;
  let ny = tx;
  // 反転指定があれば符号反転
  if (reversed) {
    nx = -nx;
    ny = -ny;
  }
  return { x: nx, y: ny };
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

/**
 * スパン長（mm）を許容長へ分割する
 * - 大きい長さを優先（貪欲）
 * - 300mmが含まれる場合は、可能なら直前のセグメントから300mmを引いて600mmへ置換
 *   例: 3900 → [1800,1800,300] → [1800,1500,600]
 */
function splitSpanIntoSegments(totalMm: number): number[] {
  const segments: number[] = [];
  let remaining = totalMm;

  // まずは貪欲に分割
  for (const s of ALLOWED_SPANS_DESC) {
    while (remaining >= s) {
      segments.push(s);
      remaining -= s;
    }
  }

  // 万一残ったら最も近い150へ丸め（安全策）
  if (remaining > 0) {
    const snapped = Math.round(remaining / 150) * 150;
    if (snapped > 0) segments.push(snapped);
    remaining = 0;
  }

  // 300mm回避: 末尾に300がある場合、可能なら直前の大きいセグメントを-300し、300→600へ
  let idx300 = segments.lastIndexOf(300);
  if (idx300 !== -1) {
    // 後ろから直前のセグメントで900以上のものを探す（600→300は避けたい）
    for (let j = idx300 - 1; j >= 0; j--) {
      const s = segments[j];
      if (s >= 900 && ALLOWED_SPANS_DESC.includes((s - 300) as any)) {
        segments[j] = s - 300; // 例: 1800→1500, 1500→1200 等
        segments[idx300] = 600; // 300を600へ置換
        break;
      }
    }
  }

  return segments;
}
