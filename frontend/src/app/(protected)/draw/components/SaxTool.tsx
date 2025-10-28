/**
 * SaxTool - サックスモード描画ツール
 * キャンバス上でスパン描画のプレビュー線を表示
 */

'use client';

import { Line } from 'react-konva';

/**
 * SaxToolコンポーネント
 *
 * プレビュー線を描画するだけのシンプルなコンポーネント
 * イベントハンドリングは親コンポーネント（CanvasStage）で行う
 */
interface SaxToolProps {
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  color: string;
}

export default function SaxTool({
  startPoint,
  currentPoint,
  color,
}: SaxToolProps) {
  // 始点または終点がnullの場合は何も描画しない
  if (!startPoint || !currentPoint) {
    return null;
  }

  return (
    <Line
      points={[startPoint.x, startPoint.y, currentPoint.x, currentPoint.y]}
      stroke={color}
      strokeWidth={2}
      dash={[10, 5]} // 破線でプレビュー
      opacity={0.7}
      listening={false} // イベントを受け取らない
    />
  );
}
