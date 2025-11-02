/**
 * MemoRenderer.tsx
 * メモをKonvaで描画するコンポーネント
 *
 * 機能:
 * - メモ領域を矩形として表示
 * - メモテキストを表示
 * - クリックでメモを選択可能
 * - ドラッグで移動可能
 */

'use client';

import { useRef, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Memo } from '@/stores/drawingStore';

interface MemoRendererProps {
  memo: Memo;
  /** クリック時のコールバック */
  onClick?: (memoId: string, anchor: { x: number; y: number }) => void;
  /** ドラッグ終了時のコールバック */
  onDragEnd?: (memoId: string, position: { x: number; y: number }) => void;
  /** キャンバスのスケール */
  scale: number;
  /** 選択中かどうか */
  isSelected?: boolean;
  /** Transformerの参照を設定 */
  setTransformerTarget?: (target: any) => void;
}

/**
 * メモレンダラー
 */
export default function MemoRenderer({
  memo,
  onClick,
  onDragEnd,
  scale,
  isSelected = false,
  setTransformerTarget,
}: MemoRendererProps) {
  const groupRef = useRef<any>(null);
  const { position, size, text } = memo;

  // Transformerのターゲットを設定
  useEffect(() => {
    if (isSelected && groupRef.current && setTransformerTarget) {
      setTransformerTarget(groupRef.current);
    }
  }, [isSelected, setTransformerTarget]);

  // テキストの行分割（改行文字で分割）
  const lines = text.split('\n').filter((line) => line.trim().length > 0 || text.includes('\n'));

  // フォントサイズ（スケールに応じて調整）
  const fontSize = Math.max(12, 14 / scale);
  const lineHeight = fontSize * 1.4;
  const padding = 8 / scale;

  // テキストの高さを計算
  const textHeight = lines.length > 0 ? lines.length * lineHeight : lineHeight;
  const rectHeight = Math.max(size.height, textHeight + padding * 2);

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    // イベント伝播を止めて、キャンバスのhandleMouseDownが呼ばれないようにする
    if (e.evt) {
      e.evt.stopPropagation();
    }
    e.cancelBubble = true;
    if (onClick) {
      onClick(memo.id, {
        x: position.x + size.width / 2,
        y: position.y + rectHeight / 2,
      });
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (onDragEnd) {
      const node = e.target;
      onDragEnd(memo.id, {
        x: node.x(),
        y: node.y(),
      });
      // Groupの位置を0にリセットし、positionを更新
      node.position({ x: 0, y: 0 });
    }
  };

  return (
    <Group
      ref={groupRef}
      id={`memo-group-${memo.id}`}
      x={position.x}
      y={position.y}
      draggable={isSelected}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      listening={true}
    >
      {/* 背景矩形（半透明の黄色） */}
      <Rect
        width={size.width}
        height={rectHeight}
        fill="rgba(255, 255, 200, 0.7)"
        stroke={isSelected ? "#F59E0B" : "#FCD34D"}
        strokeWidth={isSelected ? 2 / scale : 1 / scale}
        cornerRadius={4 / scale}
      />

      {/* テキスト表示 */}
      {lines.length > 0 ? (
        lines.map((line, index) => (
          <Text
            key={index}
            x={padding}
            y={padding + index * lineHeight}
            text={line}
            fontSize={fontSize}
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="#1F2937"
            width={size.width - padding * 2}
            wrap="word"
            align="left"
            verticalAlign="top"
          />
        ))
      ) : (
        <Text
          x={padding}
          y={padding}
          text="メモを入力..."
          fontSize={fontSize}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#9CA3AF"
          width={size.width - padding * 2}
          wrap="word"
          align="left"
          verticalAlign="top"
        />
      )}
    </Group>
  );
}

