/**
 * SaxTool - サックスモード描画ツール
 * キャンバス上でスパン描画のプレビュー線を表示
 */

'use client';

import { Line } from 'react-konva';
import { useTheme } from '@/contexts/ThemeContext';
import { getCanvasColor } from '@/lib/utils/colorUtils';

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

  return (
    <Line
      points={[startPoint.x, startPoint.y, currentPoint.x, currentPoint.y]}
      stroke={displayColor}
      strokeWidth={2}
      dash={[10, 5]} // 破線でプレビュー
      opacity={0.7}
      listening={false} // イベントを受け取らない
    />
  );
}
