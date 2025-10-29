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
import { useDrawingModeStore } from '@/stores/drawingModeStore';
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
  const { scaffoldGroups, updateScaffoldGroup, editTargetType, canvasScale } = useDrawingStore();
  const { currentMode } = useDrawingModeStore();
  const { isDark } = useTheme();

  // ダーク/ライトでの白色変換対応
  const colorToStroke = (color: string) =>
    getCanvasColor(color as 'white' | 'red' | 'blue' | 'green', isDark);

  // 発光表現のサイズをズームに追従（画面上の見た目をほぼ一定に）
  // canvasScaleが大きいときは発光半径を小さく、逆に小さいときは大きくする
  const invScale = Math.max(0.5, Math.min(2, 1 / canvasScale));
  const GLOW = {
    gradRadius: 12 * invScale,
    ringRadius: 9 * invScale,
    ringStroke: 6 * invScale,
    coreRadius: 5 * invScale,
    shadowBlur: 14 * invScale,
  } as const;
  const TIP_GLOW = {
    gradRadius: 9 * invScale,
    ringRadius: 6.5 * invScale,
    ringStroke: 4 * invScale,
    coreRadius: 4 * invScale,
    shadowBlur: 12 * invScale,
  } as const;
  // 布材（ライン）用の発光設定（ズーム追従）
  const CLOTH_GLOW = {
    glowWidth: 10 * invScale,
    shadowBlur: 18 * invScale,
  } as const;
  // ブラケット（ライン）用の発光設定（ズーム追従）
  const BRACKET_GLOW = {
    glowWidth: 9 * invScale,
    shadowBlur: 16 * invScale,
  } as const;
  // 布材の中点発光（青）設定
  const CLOTH_MID_GLOW = {
    gradRadius: 9.5 * invScale,
    ringRadius: 7.5 * invScale,
    ringStroke: 4.5 * invScale,
    coreRadius: 4 * invScale,
    shadowBlur: 12 * invScale,
    colorCore: 'rgba(59,130,246,0.9)', // blue-500 近似
    colorRing: '#60A5FA', // blue-400
  } as const;
  // アンチ（矩形）用の発光設定（ズーム追従）
  const ANTI_GLOW = {
    ringStroke: 8 * invScale,
    shadowBlur: 20 * invScale,
  } as const;
  // アンチ中点（青）の発光設定
  const ANTI_MID_GLOW = {
    gradRadius: 10 * invScale,
    ringRadius: 8 * invScale,
    ringStroke: 5 * invScale,
    coreRadius: 4.5 * invScale,
    shadowBlur: 14 * invScale,
    colorCore: 'rgba(59,130,246,0.9)',
    colorRing: '#60A5FA',
  } as const;

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

        // 梁枠選択時の布材ハイライト（シーケンス検出）
        // 規則:
        // - [1800,1800] の並び → 黄色
        // - [1800,1800,1800] の並び → 青色
        // - [1800,900] or [900,1800] の並び → 緑色
        // 優先度: 青(三連) > 黄/緑(二連)。重複する場合は先に決まった色を維持。
        const clothFrameHighlightMap: Map<string, 'yellow' | 'blue' | 'green'> = new Map();
        if (currentMode === 'edit' && editTargetType === '梁枠') {
          const clothPartsOrdered = group.parts
            .filter((p) => p.type === '布材')
            .sort(
              (a, b) => (a.meta?.offsetMm ?? 0) - (b.meta?.offsetMm ?? 0)
            );

          // 三連(1800,1800,1800) → 青
          for (let i = 0; i <= clothPartsOrdered.length - 3; i++) {
            const l0 = clothPartsOrdered[i].meta?.length ?? 0;
            const l1 = clothPartsOrdered[i + 1].meta?.length ?? 0;
            const l2 = clothPartsOrdered[i + 2].meta?.length ?? 0;
            if (l0 === 1800 && l1 === 1800 && l2 === 1800) {
              [i, i + 1, i + 2].forEach((idx) => {
                const id = clothPartsOrdered[idx].id;
                if (!clothFrameHighlightMap.has(id)) {
                  clothFrameHighlightMap.set(id, 'blue');
                }
              });
            }
          }

          // 二連(1800,1800) → 黄、(1800,900) or (900,1800) → 緑
          for (let i = 0; i <= clothPartsOrdered.length - 2; i++) {
            const l0 = clothPartsOrdered[i].meta?.length ?? 0;
            const l1 = clothPartsOrdered[i + 1].meta?.length ?? 0;
            const id0 = clothPartsOrdered[i].id;
            const id1 = clothPartsOrdered[i + 1].id;
            // 青で既に塗られている場合は優先
            const canPaintPair = (id: string) => clothFrameHighlightMap.get(id) !== 'blue';
            if (l0 === 1800 && l1 === 1800) {
              if (canPaintPair(id0) && !clothFrameHighlightMap.has(id0))
                clothFrameHighlightMap.set(id0, 'yellow');
              if (canPaintPair(id1) && !clothFrameHighlightMap.has(id1))
                clothFrameHighlightMap.set(id1, 'yellow');
            } else if (
              (l0 === 1800 && l1 === 900) ||
              (l0 === 900 && l1 === 1800)
            ) {
              if (canPaintPair(id0) && !clothFrameHighlightMap.has(id0))
                clothFrameHighlightMap.set(id0, 'green');
              if (canPaintPair(id1) && !clothFrameHighlightMap.has(id1))
                clothFrameHighlightMap.set(id1, 'green');
            }
          }
        }

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
              // 柱ハイライト
              const highlightPillarYellow =
                currentMode === 'edit' && editTargetType === '柱' && part.type === '柱';
              const highlightPillarBlue =
                currentMode === 'edit' && editTargetType === 'ブラケット' && part.type === '柱';
              const isPillarHighlighted = highlightPillarYellow || highlightPillarBlue;
              switch (part.type) {
                case '柱':
                  return (
                    <Group key={part.id}>
                      {/* 発光レイヤー（控えめ・ズーム追従） */}
                      {isPillarHighlighted && (
                        <>
                          {/* 放射グロー（加算合成） */}
                          <Circle
                            x={part.position.x}
                            y={part.position.y}
                            radius={GLOW.gradRadius}
                            listening={false}
                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                            fillRadialGradientStartRadius={0}
                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                            fillRadialGradientEndRadius={GLOW.gradRadius}
                            fillRadialGradientColorStops={[
                              0,
                              highlightPillarBlue
                                ? 'rgba(59,130,246,0.95)'
                                : 'rgba(250,204,21,0.95)',
                              1,
                              highlightPillarBlue
                                ? 'rgba(59,130,246,0)'
                                : 'rgba(250,204,21,0)',
                            ]}
                            opacity={0.9}
                            globalCompositeOperation="lighter"
                          />
                          {/* 外周リング（加算合成） */}
                          <Circle
                            x={part.position.x}
                            y={part.position.y}
                            radius={GLOW.ringRadius}
                            stroke={highlightPillarBlue ? '#60A5FA' : '#FACC15'}
                            strokeWidth={GLOW.ringStroke}
                            opacity={0.95}
                            shadowColor={highlightPillarBlue ? '#60A5FA' : '#FACC15'}
                            shadowBlur={GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        </>
                      )}
                      {/* 本体（マーカー自体も軽く発光） */}
                      <Circle
                        x={part.position.x}
                        y={part.position.y}
                        radius={5}
                        fill={stroke}
                        stroke={isDark ? '#0f172a' : '#334155'}
                        strokeWidth={1}
                        shadowColor={
                          isPillarHighlighted
                            ? highlightPillarBlue
                              ? '#60A5FA'
                              : '#FACC15'
                            : undefined
                        }
                        shadowBlur={isPillarHighlighted ? GLOW.shadowBlur : 0}
                        shadowOpacity={isPillarHighlighted ? 0.8 : 0}
                      />
                      {isPillarHighlighted && (
                        <Circle
                          x={part.position.x}
                          y={part.position.y}
                          radius={GLOW.coreRadius}
                          fill={
                            highlightPillarBlue
                              ? 'rgba(59,130,246,0.85)'
                              : 'rgba(250,204,21,0.85)'
                          }
                          opacity={0.9}
                          globalCompositeOperation="lighter"
                          listening={false}
                        />
                      )}
                    </Group>
                  );

                case '布材': {
                  // 布材はラインと平行に1800mm描画
                  const clothLengthMm = part.meta?.length ?? 1800;
                  const lengthPx = mmToPx(clothLengthMm, DEFAULT_SCALE);
                  const x2 = part.position.x + t.x * lengthPx;
                  const y2 = part.position.y + t.y * lengthPx;
                  const highlightCloth =
                    currentMode === 'edit' && editTargetType === '布材' && part.type === '布材';
                  // 階段選択時: 1800 or 900 の布材のみ対象
                  const highlightStairCloth =
                    currentMode === 'edit' &&
                    editTargetType === '階段' &&
                    part.type === '布材' &&
                    (clothLengthMm === 1800 || clothLengthMm === 900);
                  // 梁枠選択時: シーケンス規則に該当する布材を色分け発光
                  const frameColor = clothFrameHighlightMap.get(part.id);
                  const highlightFrameCloth =
                    currentMode === 'edit' && editTargetType === '梁枠' && Boolean(frameColor);
                  const frameStroke =
                    frameColor === 'blue'
                      ? '#60A5FA'
                      : frameColor === 'green'
                      ? '#34D399'
                      : '#FACC15';
                  // 共通: ライン黄色発光の表示可否
                  const highlightClothLine = highlightCloth || highlightStairCloth || highlightFrameCloth;
                  // 150mmの短スパンは中点発光を抑制
                  const showMidGlowCloth = highlightCloth && clothLengthMm !== 150;
                  // 階段は 1800/900 のみ中点発光
                  const showMidGlowStair = highlightStairCloth;
                  // 中点座標（各スパンの中心）
                  const midX = part.position.x + t.x * (lengthPx / 2);
                  const midY = part.position.y + t.y * (lengthPx / 2);
                  return (
                    <Group key={part.id}>
                      {/* 発光下地（太めのイエロー、加算合成） */}
                      {highlightClothLine && (
                        <Line
                          points={[part.position.x, part.position.y, x2, y2]}
                          stroke={highlightFrameCloth ? frameStroke : '#FACC15'}
                          strokeWidth={CLOTH_GLOW.glowWidth}
                          opacity={0.9}
                          shadowColor={highlightFrameCloth ? frameStroke : '#FACC15'}
                          shadowBlur={CLOTH_GLOW.shadowBlur}
                          shadowOpacity={0.95}
                          globalCompositeOperation="lighter"
                          listening={false}
                        />
                      )}
                      {/* 本体ライン */}
                      <Line
                        points={[part.position.x, part.position.y, x2, y2]}
                        stroke={stroke}
                        strokeWidth={2}
                        shadowColor={highlightClothLine ? (highlightFrameCloth ? frameStroke : '#FACC15') : undefined}
                        shadowBlur={highlightClothLine ? CLOTH_GLOW.shadowBlur * 0.6 : 0}
                        shadowOpacity={highlightClothLine ? 0.7 : 0}
                      />
                      {/* 中点の青色発光（加算合成の○） */}
                      {(showMidGlowCloth || showMidGlowStair) && (
                        <>
                          <Circle
                            x={midX}
                            y={midY}
                            radius={CLOTH_MID_GLOW.gradRadius}
                            listening={false}
                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                            fillRadialGradientStartRadius={0}
                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                            fillRadialGradientEndRadius={CLOTH_MID_GLOW.gradRadius}
                            fillRadialGradientColorStops={[0, 'rgba(59,130,246,0.95)', 1, 'rgba(59,130,246,0)']}
                            opacity={0.95}
                            globalCompositeOperation="lighter"
                          />
                          <Circle
                            x={midX}
                            y={midY}
                            radius={CLOTH_MID_GLOW.ringRadius}
                            stroke={CLOTH_MID_GLOW.colorRing}
                            strokeWidth={CLOTH_MID_GLOW.ringStroke}
                            opacity={0.95}
                            shadowColor={CLOTH_MID_GLOW.colorRing}
                            shadowBlur={CLOTH_MID_GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                          <Circle
                            x={midX}
                            y={midY}
                            radius={CLOTH_MID_GLOW.coreRadius}
                            fill={CLOTH_MID_GLOW.colorCore}
                            opacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        </>
                      )}
                    </Group>
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
                  const highlightBracketTip = currentMode === 'edit' && editTargetType === '柱';
                  const highlightBracketLine = currentMode === 'edit' && editTargetType === 'ブラケット';
                  return (
                    <Group key={part.id}>
                      {/* ブラケットラインの黄色発光（編集対象がブラケットのとき） */}
                      {highlightBracketLine && (
                        <Line
                          points={[part.position.x, part.position.y, x2, y2]}
                          stroke={'#FACC15'}
                          strokeWidth={BRACKET_GLOW.glowWidth}
                          opacity={0.9}
                          shadowColor={'#FACC15'}
                          shadowBlur={BRACKET_GLOW.shadowBlur}
                          shadowOpacity={0.95}
                          globalCompositeOperation="lighter"
                          listening={false}
                        />
                      )}
                      {/* 先端の青色発光（柱編集時） */}
                      {highlightBracketTip && (
                        <>
                          {/* 放射グロー（青） */}
                          <Circle
                            x={x2}
                            y={y2}
                            radius={TIP_GLOW.gradRadius}
                            listening={false}
                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                            fillRadialGradientStartRadius={0}
                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                            fillRadialGradientEndRadius={TIP_GLOW.gradRadius}
                            fillRadialGradientColorStops={[0, 'rgba(59,130,246,0.95)', 1, 'rgba(59,130,246,0)']}
                            opacity={0.95}
                            globalCompositeOperation="lighter"
                          />
                          {/* 外周リング（青） */}
                          <Circle
                            x={x2}
                            y={y2}
                            radius={TIP_GLOW.ringRadius}
                            stroke={'#60A5FA'}
                            strokeWidth={TIP_GLOW.ringStroke}
                            opacity={0.95}
                            shadowColor={'#60A5FA'}
                            shadowBlur={TIP_GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                          {/* コア（青） */}
                          <Circle
                            x={x2}
                            y={y2}
                            radius={TIP_GLOW.coreRadius}
                            fill={'rgba(59,130,246,0.85)'}
                            opacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        </>
                      )}
                      {/* 本体ライン */}
                      <Line
                        points={[part.position.x, part.position.y, x2, y2]}
                        stroke={stroke}
                        strokeWidth={2}
                        shadowColor={highlightBracketLine ? '#FACC15' : undefined}
                        shadowBlur={highlightBracketLine ? BRACKET_GLOW.shadowBlur * 0.6 : 0}
                        shadowOpacity={highlightBracketLine ? 0.7 : 0}
                      />
                    </Group>
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
                  const highlightAnti = currentMode === 'edit' && editTargetType === 'アンチ';
                  // Rectのpositionは左上なので、中心基準にするためoffsetを設定
                  return (
                    <Group key={part.id} listening={false}>
                      {/* アンチの黄色発光（枠の外周・加算合成） */}
                      {highlightAnti && (
                        <Rect
                          x={part.position.x}
                          y={part.position.y}
                          width={lengthPx}
                          height={widthPx}
                          offsetX={lengthPx / 2}
                          offsetY={widthPx / 2}
                          rotation={angle}
                          stroke={'#FACC15'}
                          strokeWidth={ANTI_GLOW.ringStroke}
                          opacity={0.95}
                          shadowColor={'#FACC15'}
                          shadowBlur={ANTI_GLOW.shadowBlur}
                          shadowOpacity={0.95}
                          globalCompositeOperation="lighter"
                          listening={false}
                          cornerRadius={2}
                        />
                      )}
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
                      {/* アンチの中点に青色発光○（中心はpart.position） */}
                      {highlightAnti && (
                        <>
                          <Circle
                            x={part.position.x}
                            y={part.position.y}
                            radius={ANTI_MID_GLOW.gradRadius}
                            listening={false}
                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                            fillRadialGradientStartRadius={0}
                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                            fillRadialGradientEndRadius={ANTI_MID_GLOW.gradRadius}
                            fillRadialGradientColorStops={[0, 'rgba(59,130,246,0.95)', 1, 'rgba(59,130,246,0)']}
                            opacity={0.95}
                            globalCompositeOperation="lighter"
                          />
                          <Circle
                            x={part.position.x}
                            y={part.position.y}
                            radius={ANTI_MID_GLOW.ringRadius}
                            stroke={ANTI_MID_GLOW.colorRing}
                            strokeWidth={ANTI_MID_GLOW.ringStroke}
                            opacity={0.95}
                            shadowColor={ANTI_MID_GLOW.colorRing}
                            shadowBlur={ANTI_MID_GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                          <Circle
                            x={part.position.x}
                            y={part.position.y}
                            radius={ANTI_MID_GLOW.coreRadius}
                            fill={ANTI_MID_GLOW.colorCore}
                            opacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        </>
                      )}
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
