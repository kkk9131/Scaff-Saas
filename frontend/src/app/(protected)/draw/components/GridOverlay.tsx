/**
 * GridOverlay.tsx
 * 作図キャンバスのグリッド表示コンポーネント
 *
 * 機能:
 * - 150mm / 300mm グリッドの描画
 * - スケールに応じた動的なグリッド線の生成
 * - ライト/ダークモード対応
 */

'use client';

import { Line } from 'react-konva';
import { useDrawingStore } from '@/stores/drawingStore';
import { useTheme } from '@/contexts/ThemeContext';
import { DEFAULT_SCALE } from '@/lib/utils/scale';

interface GridOverlayProps {
  width: number;
  height: number;
  scale: number;
  position: { x: number; y: number };
}

/**
 * GridOverlayコンポーネント
 *
 * キャンバス上にグリッド線を描画する
 */
export default function GridOverlay({
  width,
  height,
  scale,
  position,
}: GridOverlayProps) {
  // Zustandストアからグリッド設定を取得
  const { gridSize, showGrid } = useDrawingStore();
  // テーマを取得
  const { theme } = useTheme();

  // グリッド非表示の場合は何も描画しない
  if (!showGrid) {
    return null;
  }

  // テーマに応じたグリッド線の色を設定
  const mainLineColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // ダーク: slate-400, ライト: slate-500
  const subLineColor = theme === 'dark' ? '#cbd5e1' : '#94a3b8'; // ダーク: slate-300, ライト: slate-400

  // グリッド間隔をピクセル単位に変換（DEFAULT_SCALE = 10mm/pxを考慮）
  // 例: gridSize=150mm → gridSpacing=15px → 実際の距離=15px×10mm/px=150mm
  const gridSpacing = gridSize / DEFAULT_SCALE;

  // 表示領域のキャンバス座標を計算（スケールとポジションを考慮）
  const startX = Math.floor(-position.x / scale / gridSpacing) * gridSpacing;
  const endX =
    Math.ceil((width - position.x) / scale / gridSpacing) * gridSpacing;
  const startY = Math.floor(-position.y / scale / gridSpacing) * gridSpacing;
  const endY =
    Math.ceil((height - position.y) / scale / gridSpacing) * gridSpacing;

  // グリッド線の配列を生成
  const lines: JSX.Element[] = [];

  // 垂直線を生成
  for (let x = startX; x <= endX; x += gridSpacing) {
    const isMainLine = x % (gridSpacing * 2) === 0; // メイン線（濃い線）の判定

    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, startY, x, endY]}
        stroke={isMainLine ? mainLineColor : subLineColor} // メイン線は濃く、補助線は薄く
        strokeWidth={isMainLine ? 0.8 / scale : 0.4 / scale} // スケールに応じて線幅を調整
        opacity={0.5}
        listening={false}
      />
    );
  }

  // 水平線を生成
  for (let y = startY; y <= endY; y += gridSpacing) {
    const isMainLine = y % (gridSpacing * 2) === 0; // メイン線（濃い線）の判定

    lines.push(
      <Line
        key={`h-${y}`}
        points={[startX, y, endX, y]}
        stroke={isMainLine ? mainLineColor : subLineColor} // メイン線は濃く、補助線は薄く
        strokeWidth={isMainLine ? 0.8 / scale : 0.4 / scale} // スケールに応じて線幅を調整
        opacity={0.5}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
