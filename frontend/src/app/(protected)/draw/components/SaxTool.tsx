/**
 * SaxTool - サックスモード描画ツール
 * キャンバス上でスパン描画のプレビュー線を表示
 * スパンの長さ（mm）をリアルタイム表示
 */

'use client';

import { Line, Text } from 'react-konva';
import { useTheme } from '@/contexts/ThemeContext';
import { getCanvasColor } from '@/lib/utils/colorUtils';
import { calculateDistanceMm, DEFAULT_SCALE } from '@/lib/utils/scale';

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
  // テーマ情報を取得
  const { isDark } = useTheme();

  // 始点または終点がnullの場合は何も描画しない
  if (!startPoint || !currentPoint) {
    return null;
  }

  // テーマに応じた色を取得（ライトモード時は白→黒に変換）
  const displayColor = getCanvasColor(
    color as 'white' | 'red' | 'blue' | 'green',
    isDark
  );

  // スパンの長さを計算（mm単位）
  const spanLengthMm = Math.round(
    calculateDistanceMm(startPoint, currentPoint, DEFAULT_SCALE)
  );

  // テキストの表示位置を計算（スパンの中央）
  const textX = (startPoint.x + currentPoint.x) / 2;
  const textY = (startPoint.y + currentPoint.y) / 2;

  return (
    <>
      {/* プレビュー線 */}
      <Line
        points={[startPoint.x, startPoint.y, currentPoint.x, currentPoint.y]}
        stroke={displayColor}
        strokeWidth={2}
        dash={[10, 5]} // 破線でプレビュー
        opacity={0.7}
        listening={false} // イベントを受け取らない
      />

      {/* 寸法表示 */}
      <Text
        x={textX}
        y={textY - 20} // 線の少し上に表示
        text={`${spanLengthMm}mm`}
        fontSize={16}
        fill={displayColor}
        fontStyle="bold"
        align="center"
        offsetX={30} // テキストの中央揃え
        listening={false}
      />
    </>
  );
}
