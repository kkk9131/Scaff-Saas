/**
 * ScaffoldRenderer.tsx
 * サックスモードで生成された足場グループ（柱・布材・ブラケット・アンチ）を描画するコンポーネント
 *
 * 機能:
 * - Zustandストアの `scaffoldGroups` を購読し、Konva上に図形を描画
 * - グループ単位でドラッグ移動（ドラッグ終了時にストアへ反映）
 * - 各部材の描画（柱: 円、布材: 線、ブラケット: 線、アンチ: 矩形）
 */

'use client';

import { Group, Line, Circle, Rect, Text } from 'react-konva';
import { useDrawingStore } from '@/stores/drawingStore';
import type { ScaffoldGroup, ScaffoldPart } from '@/types/scaffold';
import { useTheme } from '@/contexts/ThemeContext';
import { getCanvasColor } from '@/lib/utils/colorUtils';
import { mmToPx, DEFAULT_SCALE } from '@/lib/utils/scale';

/**
 * 角度（度）から単位ベクトル（px座標系）へ変換
 * - 0度: 右、90度: 下、180度: 左、270度: 上
 */
function degToUnitVector(deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad), y: Math.sin(rad) };
}

/**
 * 2点の差分ベクトルを単位化
 * ゼロ除算を避けるため、長さ0のときは右向き(1,0)を返す
 */
function normalize(dx: number, dy: number): { x: number; y: number } {
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

/**
 * グループごとのオフセットドラッグを反映するユーティリティ
 *
 * @param group - 更新対象の足場グループ
 * @param dx - x方向の移動量（px）
 * @param dy - y方向の移動量（px）
 * @returns 更新済みの足場グループ
 */
function translateGroup(
  group: ScaffoldGroup,
  dx: number,
  dy: number
): ScaffoldGroup {
  return {
    ...group,
    parts: group.parts.map((p) => ({
      ...p,
      position: { x: p.position.x + dx, y: p.position.y + dy },
    })),
    meta: group.meta
      ? {
          ...group.meta,
          line: group.meta.line
            ? {
                start: {
                  x: group.meta.line.start.x + dx,
                  y: group.meta.line.start.y + dy,
                },
                end: {
                  x: group.meta.line.end.x + dx,
                  y: group.meta.line.end.y + dy,
                },
              }
            : undefined,
        }
      : undefined,
  };
}

/**
 * ScaffoldRendererコンポーネント
 * - ストアから足場グループを取得し、Konva要素として描画
 * - グループ単位でドラッグ可能
 */
export default function ScaffoldRenderer() {
  const { scaffoldGroups, updateScaffoldGroup } = useDrawingStore();
  const { isDark } = useTheme();

  // ダーク/ライトでの白色変換対応
  const colorToStroke = (color: string) =>
    getCanvasColor(color as 'white' | 'red' | 'blue' | 'green', isDark);

  return (
    <>
      {scaffoldGroups.map((group) => {
        // スパン方向の単位ベクトル（px）を計算（布材・アンチ描画に使用）
        const t = group.meta?.line
          ? normalize(
              group.meta.line.end.x - group.meta.line.start.x,
              group.meta.line.end.y - group.meta.line.start.y
            )
          : { x: 1, y: 0 };

        return (
          <Group
            key={group.id}
            draggable
            onDragEnd={(e) => {
              // Groupのドラッグ量（Konvaは相対ではなく絶対座標になるため差分を計算）
              // ここでは簡易的にドラッグ終了時のドラッグ量を取得するためにevt.targetのドラッグ変位を利用
              const node = e.target;
              const dx = node.x();
              const dy = node.y();
              // このGroup自体の座標を0に戻し、パーツ座標へ差分を反映
              node.position({ x: 0, y: 0 });
              const translated = translateGroup(group, dx, dy);
              updateScaffoldGroup(group.id, translated);
            }}
          >
            {group.parts.map((part) => {
              const stroke = colorToStroke(part.color);
              switch (part.type) {
                case '柱':
                  return (
                    <Circle
                      key={part.id}
                      x={part.position.x}
                      y={part.position.y}
                      radius={5}
                      fill={stroke}
                      stroke={isDark ? '#0f172a' : '#334155'}
                      strokeWidth={1}
                    />
                  );

                case '布材': {
                  // 布材はラインと平行に1800mm描画
                  const lengthPx = mmToPx(part.meta?.length ?? 1800, DEFAULT_SCALE);
                  const x2 = part.position.x + t.x * lengthPx;
                  const y2 = part.position.y + t.y * lengthPx;
                  return (
                    <Line
                      key={part.id}
                      points={[part.position.x, part.position.y, x2, y2]}
                      stroke={stroke}
                      strokeWidth={2}
                    />
                  );
                }

                case 'ブラケット': {
                  // ブラケットは柱位置から外向き法線方向へ（meta.width mm）
                  const widthMm = part.meta?.width ?? (part.meta?.bracketSize === 'W' ? 600 : 355);
                  const widthPx = mmToPx(widthMm, DEFAULT_SCALE);
                  const dir = part.meta?.direction ?? 0;
                  const v = degToUnitVector(dir);
                  const x2 = part.position.x + v.x * widthPx;
                  const y2 = part.position.y + v.y * widthPx;
                  return (
                    <Line
                      key={part.id}
                      points={[part.position.x, part.position.y, x2, y2]}
                      stroke={stroke}
                      strokeWidth={2}
                    />
                  );
                }

                case 'アンチ': {
                  // アンチは長手1800mm（ラインと平行）、幅はW:400mm / S:240mm
                  const lengthPx = mmToPx(part.meta?.length ?? 1800, DEFAULT_SCALE);
                  const widthPx = mmToPx(part.meta?.width ?? 400, DEFAULT_SCALE);
                  const angle = part.meta?.direction ?? 0; // 長手方向（ラインと平行）
                  const lengthMm = part.meta?.length ?? 1800;
                  const textColor = isDark ? '#FFFFFF' : '#000000';
                  const fontSize = Math.max(10, Math.min(12, widthPx - 6));
                  // Rectのpositionは左上なので、中心基準にするためoffsetを設定
                  return (
                    <Group key={part.id} listening={false}>
                      <Rect
                        x={part.position.x}
                        y={part.position.y}
                        width={lengthPx}
                        height={widthPx}
                        offsetX={lengthPx / 2}
                        offsetY={widthPx / 2}
                        rotation={angle}
                        fill={stroke + '33'} // 透明塗り（20%程度）
                        stroke={stroke}
                        strokeWidth={1}
                        cornerRadius={2}
                      />
                      {lengthMm !== 1800 ? (
                        <Group x={part.position.x} y={part.position.y} rotation={angle} listening={false}>
                          <Text
                            x={-lengthPx / 2}
                            y={-fontSize / 2}
                            width={lengthPx}
                            align="center"
                            text={String(lengthMm)}
                            fill={textColor}
                            fontSize={fontSize}
                            fontStyle="bold"
                            listening={false}
                          />
                        </Group>
                      ) : null}
                    </Group>
                  );
                }

                default:
                  return null;
              }
            })}
          </Group>
        );
      })}
    </>
  );
}
