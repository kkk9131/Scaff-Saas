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

import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Group, Line, Circle, Rect, Text, RegularPolygon } from 'react-konva';
import { useDrawingStore } from '@/stores/drawingStore';
import { useDrawingModeStore } from '@/stores/drawingModeStore';
import type { ScaffoldGroup, ScaffoldPart } from '@/types/scaffold';
import { useTheme } from '@/contexts/ThemeContext';
import { getCanvasColor } from '@/lib/utils/colorUtils';
import { mmToPx, DEFAULT_SCALE } from '@/lib/utils/scale';
import { calculateDirection } from '@/lib/sax/directionRules';

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
export default function ScaffoldRenderer({
  stageWidth,
  stageHeight,
  onPillarClick,
  onClothClick,
  onStairClick,
  onStairBraceClick,
  onBracketClick,
  onAntiClick,
  onAntiLevelClick,
  onBracketConfigClick,
  onClothSplitStart,
}: {
  stageWidth: number;
  stageHeight: number;
  /**
   * 柱の黄色発光部分クリック時に呼び出されるコールバック
   * 画面外HTMLオーバーレイを出すためにキャンバス座標のアンカーと対象IDを渡す
   */
  onPillarClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /**
   * 布材編集時の黄色発光ラインクリックで呼び出すコールバック
   */
  onClothClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /**
   * 階段編集時の黄色発光ラインクリックで呼び出すコールバック
   */
  onStairClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /**
   * 階段編集時の青色発光「中点」クリックで呼び出すコールバック（筋交数量カード）
   */
  onStairBraceClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /**
   * ブラケット編集時の黄色発光ラインクリックで呼び出すコールバック
   */
  onBracketClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /**
   * アンチ編集時の黄色発光矩形クリックで呼び出すコールバック
   */
  onAntiClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /**
   * アンチ編集時の青色発光円クリックで呼び出すコールバック（段数調整）
   */
  onAntiLevelClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /**
   * ブラケット編集時の青色発光柱クリックで呼び出すコールバック（方向と寸法選択）
   */
  onBracketConfigClick?: (args: {
    anchor: { x: number; y: number };
    groupId: string;
    partId: string;
  }) => void;
  /** 布材のスパン分割（ドラッグ開始） */
  onClothSplitStart?: (args: { groupId: string; partId: string }) => void;
}) {
  const { scaffoldGroups, updateScaffoldGroup, editTargetType, canvasScale, canvasPosition } = useDrawingStore();
  const { currentMode } = useDrawingModeStore();
  const { isDark } = useTheme();

  // ホバー中の柱（マーカー変更対象）
  const [hoveredPillar, setHoveredPillar] = React.useState<
    | { groupId: string; partId: string }
    | null
  >(null);
  // 階段の矢印ホバー中（スペースキーで数量追加用）
  const [hoveredStair, setHoveredStair] = React.useState<
    | { groupId: string; partId: string }
    | null
  >(null);

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

  // 画面内判定（キャンバス座標→スクリーン座標へ変換して可視チェック）
  const isOnScreenPoint = (x: number, y: number, margin = 48) => {
    const sx = x * canvasScale + canvasPosition.x;
    const sy = y * canvasScale + canvasPosition.y;
    return sx >= -margin && sy >= -margin && sx <= stageWidth + margin && sy <= stageHeight + margin;
  };

  // 簡易ハッシュ（0..1）: 各IDに位相オフセットを付与して群れの同期を避ける
  const hash01 = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h % 1000) / 1000;
  };

  // パルスアニメーション（編集モード中のみ駆動、約30fps）
  const [pulseTime, setPulseTime] = React.useState(0);
  React.useEffect(() => {
    if (currentMode !== 'edit') return; // 編集時のみ
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last >= 33) {
        setPulseTime(t / 1000);
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [currentMode]);

  // スペースキー: 階段（1800）矢印ホバー中に数量を+1
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (!(currentMode === 'edit' && editTargetType === '階段')) return;
      if (!hoveredStair) return;
      e.preventDefault();
      const { groupId, partId } = hoveredStair;
      const group = useDrawingStore.getState().scaffoldGroups.find((g) => g.id === groupId);
      if (!group) return;
      const target = group.parts.find((p) => p.id === partId);
      if (!target || target.type !== '階段') return;
      const len = Number(target.meta?.length ?? 0);
      if (len !== 1800) return; // 対象は1800のみ
      const nextQty = Math.max(1, Number(target.meta?.quantity ?? 1) + 1);
      useDrawingStore.getState().updateScaffoldGroup(groupId, {
        parts: group.parts.map((p) =>
          p.id === partId ? ({ ...p, meta: { ...(p.meta || {}), quantity: nextQty } } as any) : p
        ),
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hoveredStair, currentMode, editTargetType]);

  // パルスから不透明度・半径スケールを算出
  const getPulseOpacity = (base: number, id: string, anchor: { x: number; y: number }) => {
    if (!isOnScreenPoint(anchor.x, anchor.y)) return base;
    const off = hash01(id) * Math.PI * 2;
    const wave = 0.7 + 0.3 * Math.sin(pulseTime * 2.0 + off);
    return Math.max(0, Math.min(1, base * wave));
  };
  const getRadiusScale = (id: string, anchor: { x: number; y: number }) => {
    if (!isOnScreenPoint(anchor.x, anchor.y)) return 1;
    const off = hash01(id) * Math.PI * 2;
    return 0.95 + 0.10 * Math.sin(pulseTime * 1.6 + off);
  };
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
      {/* スペースキーでマーカー種別を切替（ホバー中の柱が対象） */}
      {React.useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.code !== 'Space') return;
          if (!hoveredPillar) return;
          if (!(currentMode === 'edit' && editTargetType === '柱')) return;
          e.preventDefault();
          const { groupId, partId } = hoveredPillar;
          // 現在のグループを取得
          const group = scaffoldGroups.find((g) => g.id === groupId);
          if (!group) return;
          const parts = group.parts.map((p) => {
            if (p.id !== partId) return p;
            // 現在のマーカー種別と方向を取得
            const current = p.marker || 'circle';
            const dir = typeof p.meta?.markerDirection === 'number' ? p.meta!.markerDirection : 0;
            let nextMarker: 'circle' | 'triangle' | 'square' = 'circle';
            let nextDir = 0;
            if (current === 'circle') {
              nextMarker = 'triangle';
              nextDir = 0; // 右（0°）
            } else if (current === 'triangle') {
              // 0→90→180→270→square
              const seq = [0, 90, 180, 270] as const;
              const idx = Math.max(0, seq.indexOf(dir as any));
              if (idx < seq.length - 1) {
                nextMarker = 'triangle';
                nextDir = seq[idx + 1];
              } else {
                nextMarker = 'square';
                nextDir = 0;
              }
            } else if (current === 'square') {
              nextMarker = 'circle';
              nextDir = 0;
            }
            return {
              ...p,
              marker: nextMarker,
              meta: { ...(p.meta || {}), markerDirection: nextDir },
            };
          });
          updateScaffoldGroup(groupId, { parts });
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [hoveredPillar, currentMode, editTargetType, scaffoldGroups, updateScaffoldGroup])}
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
                    <Group
                      key={part.id}
                      onClick={(e) => {
                        // ブラケット編集時は設定カードを表示
                        if (currentMode === 'edit' && editTargetType === 'ブラケット') {
                          e.cancelBubble = true;
                          // この柱に関連するブラケットを探す
                          const relatedBracket = group.parts.find(
                            (p) =>
                              p.type === 'ブラケット' &&
                              Math.abs(p.position.x - part.position.x) < 1 &&
                              Math.abs(p.position.y - part.position.y) < 1
                          );
                          if (relatedBracket) {
                            onBracketConfigClick?.({
                              anchor: { x: part.position.x, y: part.position.y },
                              groupId: group.id,
                              partId: relatedBracket.id,
                            });
                          }
                          return;
                        }
                        // 編集モードで柱が対象のときのみクリックを処理
                        if (!(currentMode === 'edit' && editTargetType === '柱')) return;
                        e.cancelBubble = true; // 親のドラッグ等へバブルさせない
                        onPillarClick?.({
                          anchor: { x: part.position.x, y: part.position.y },
                          groupId: group.id,
                          partId: part.id,
                        });
                      }}
                      onTap={(e) => {
                        // ブラケット編集時は設定カードを表示
                        if (currentMode === 'edit' && editTargetType === 'ブラケット') {
                          e.cancelBubble = true;
                          // この柱に関連するブラケットを探す
                          const relatedBracket = group.parts.find(
                            (p) =>
                              p.type === 'ブラケット' &&
                              Math.abs(p.position.x - part.position.x) < 1 &&
                              Math.abs(p.position.y - part.position.y) < 1
                          );
                          if (relatedBracket) {
                            onBracketConfigClick?.({
                              anchor: { x: part.position.x, y: part.position.y },
                              groupId: group.id,
                              partId: relatedBracket.id,
                            });
                          }
                          return;
                        }
                        if (!(currentMode === 'edit' && editTargetType === '柱')) return;
                        e.cancelBubble = true;
                        onPillarClick?.({
                          anchor: { x: part.position.x, y: part.position.y },
                          groupId: group.id,
                          partId: part.id,
                        });
                      }}
                      onMouseEnter={(e) => {
                        if (currentMode === 'edit' && (editTargetType === '柱' || editTargetType === 'ブラケット')) {
                          e.target.getStage()?.container().style &&
                            (e.target.getStage()!.container().style.cursor = 'pointer');
                          if (editTargetType === '柱') {
                            setHoveredPillar({ groupId: group.id, partId: part.id });
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.getStage()?.container().style &&
                          (e.target.getStage()!.container().style.cursor = 'default');
                        setHoveredPillar((h) => (h && h.partId === part.id ? null : h));
                      }}
                    >
                      {/* 発光レイヤー（控えめ・ズーム追従） */}
                      {isPillarHighlighted && (() => {
                        const anchor = { x: part.position.x, y: part.position.y };
                        const rScale = getRadiusScale(part.id, anchor);
                        const opGrad = getPulseOpacity(0.9, part.id, anchor);
                        const opRing = getPulseOpacity(0.95, part.id, anchor);
                        return (
                        <>
                          {/* 放射グロー（加算合成） */}
                          <Circle
                            x={part.position.x}
                            y={part.position.y}
                            radius={GLOW.gradRadius * rScale}
                            listening={false}
                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                            fillRadialGradientStartRadius={0}
                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                            fillRadialGradientEndRadius={GLOW.gradRadius * rScale}
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
                            opacity={opGrad}
                            globalCompositeOperation="lighter"
                          />
                          {/* 外周リング（加算合成） */}
                          <Circle
                            x={part.position.x}
                            y={part.position.y}
                            radius={GLOW.ringRadius * rScale}
                            stroke={highlightPillarBlue ? '#60A5FA' : '#FACC15'}
                            strokeWidth={GLOW.ringStroke}
                            opacity={opRing}
                            shadowColor={highlightPillarBlue ? '#60A5FA' : '#FACC15'}
                            shadowBlur={GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        </>
                        );
                      })()}
                      {/* 本体（マーカー自体も軽く発光）: circle / triangle / square */}
                      {(() => {
                        const marker = part.marker || 'circle';
                        const commonProps = {
                          x: part.position.x,
                          y: part.position.y,
                          fill: stroke,
                          stroke: isDark ? '#0f172a' : '#334155',
                          strokeWidth: 1,
                          shadowColor: isPillarHighlighted
                            ? highlightPillarBlue
                              ? '#60A5FA'
                              : '#FACC15'
                            : undefined,
                          shadowBlur: isPillarHighlighted ? GLOW.shadowBlur : 0,
                          shadowOpacity: isPillarHighlighted ? 0.8 : 0,
                        } as any;
                        if (marker === 'square') {
                          const size = 10;
                          return (
                            <Rect
                              {...commonProps}
                              width={size}
                              height={size}
                              offsetX={size / 2}
                              offsetY={size / 2}
                              cornerRadius={2}
                            />
                          );
                        }
                        if (marker === 'triangle') {
                          // マーカー方向（0=右,90=下,180=左,270=上）をKonva回転へ変換（0=上基準のため+90）
                          const rotation = ((part.meta?.markerDirection ?? 0) + 90) % 360 as number;
                          return (
                            <RegularPolygon
                              {...commonProps}
                              sides={3}
                              radius={7}
                              rotation={rotation}
                            />
                          );
                        }
                        // circle (default)
                        return <Circle {...commonProps} radius={5} />;
                      })()}
                      {isPillarHighlighted && (() => {
                        const anchor = { x: part.position.x, y: part.position.y };
                        const rScale = getRadiusScale(part.id, anchor);
                        const op = getPulseOpacity(0.9, part.id, anchor);
                        return (
                        <Circle
                          x={part.position.x}
                          y={part.position.y}
                          radius={GLOW.coreRadius * rScale}
                          fill={
                            highlightPillarBlue
                              ? 'rgba(59,130,246,0.85)'
                              : 'rgba(250,204,21,0.85)'
                          }
                          opacity={op}
                          globalCompositeOperation="lighter"
                          listening={false}
                        />
                        );
                      })()}
                    </Group>
                  );

                case '布材': {
                  // 布材の向き: meta.direction があればそれを優先（ブラケットと同方向に重ねる用途）
                  // 無ければスパン方向ベクトル t（通常の布材）
                  const clothLengthMm = part.meta?.length ?? 1800;
                  const lengthPx = mmToPx(clothLengthMm, DEFAULT_SCALE);
                  const dirVec =
                    typeof part.meta?.direction === 'number'
                      ? degToUnitVector(part.meta.direction)
                      : t;
                  const x2 = part.position.x + dirVec.x * lengthPx;
                  const y2 = part.position.y + dirVec.y * lengthPx;
                  const highlightCloth =
                    currentMode === 'edit' && editTargetType === '布材' && part.type === '布材';
                  // 階段編集: ライン黄色発光は 1800/900 の布材すべて対象
                  const highlightStairLine =
                    currentMode === 'edit' &&
                    editTargetType === '階段' &&
                    part.type === '布材' &&
                    (clothLengthMm === 1800 || clothLengthMm === 900);
                  // 中点の青色発光は「階段が作図されたスパン」に限定
                  const highlightStairHasStair = (() => {
                    if (!(currentMode === 'edit' && editTargetType === '階段')) return false;
                    if (!(part.type === '布材' && (clothLengthMm === 1800 || clothLengthMm === 900))) return false;
                    const off = Number(part.meta?.offsetMm ?? NaN);
                    if (!Number.isFinite(off)) return false;
                    const centerMm = off + clothLengthMm / 2;
                    return group.parts.some(
                      (q) =>
                        q.type === '階段' &&
                        Number(q.meta?.length ?? -1) === clothLengthMm &&
                        Math.round(Number(q.meta?.offsetMm ?? NaN)) === Math.round(centerMm)
                    );
                  })();
                  // 階段編集時: 矢印の向きと反対側にある600mm布材のみ緑発光
                  // 判定: 階段中心C、布材中点M、矢印ベクトルv に対して (M - C)・v < 0
                  const highlightStairOpposite600 =
                    currentMode === 'edit' &&
                    editTargetType === '階段' &&
                    part.type === '布材' &&
                    clothLengthMm === 600 &&
                    (() => {
                      const stairs = group.parts.filter((p) => p.type === '階段');
                      if (stairs.length === 0) return false;
                      const mx = part.position.x + dirVec.x * (lengthPx / 2);
                      const my = part.position.y + dirVec.y * (lengthPx / 2);
                      return stairs.some((st) => {
                        const vStair = degToUnitVector(Number(st.meta?.direction ?? 0));
                        const cx = st.position.x;
                        const cy = st.position.y;
                        const d = (mx - cx) * vStair.x + (my - cy) * vStair.y;
                        return d < 0; // 反対側（例: 左向き矢印なら右側）
                      });
                    })();

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
                  const stairStroke = '#FACC15';
                  const stairOppStroke = '#34D399'; // 反対側600mm用の緑
                  // 共通: ライン黄色発光の表示可否
                  const highlightClothLine =
                    highlightCloth || highlightStairLine || highlightFrameCloth || highlightStairOpposite600;
                  // 発光色の選択（優先度: 梁枠色 > 階段反対側600(緑) > 階段通常(黄)）
                  const highlightStroke = highlightFrameCloth
                    ? frameStroke
                    : highlightStairOpposite600
                    ? stairOppStroke
                    : stairStroke;
                  // 150mmの短スパンは中点発光を抑制
                  const showMidGlowCloth = highlightCloth && clothLengthMm !== 150;
                  // 階段は 1800/900 かつ階段有りスパン、かつ階段用の並行布材（stairParallel）にのみ中点発光
                  const showMidGlowStair = highlightStairHasStair && Boolean((part.meta as any)?.stairParallel);
                  // 中点座標（各スパンの中心）
                  const midX = part.position.x + dirVec.x * (lengthPx / 2);
                  const midY = part.position.y + dirVec.y * (lengthPx / 2);
                  return (
                    <Group key={part.id}>
                      {/* 発光下地（太めのイエロー、加算合成） */}
                      {highlightClothLine && (() => {
                        const anchor = { x: (part.position.x + x2) / 2, y: (part.position.y + y2) / 2 };
                        const op = getPulseOpacity(0.9, part.id, anchor);
                        return (
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke={highlightStroke}
                            strokeWidth={CLOTH_GLOW.glowWidth}
                            opacity={op}
                            shadowColor={highlightStroke}
                            shadowBlur={CLOTH_GLOW.shadowBlur}
                            shadowOpacity={0.95}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        );
                      })()}
                      {/* 本体ライン */}
                      <Line
                        points={[part.position.x, part.position.y, x2, y2]}
                        stroke={stroke}
                        strokeWidth={2}
                        shadowColor={highlightClothLine ? highlightStroke : undefined}
                        shadowBlur={highlightClothLine ? CLOTH_GLOW.shadowBlur * 0.6 : 0}
                        shadowOpacity={highlightClothLine ? 0.7 : 0}
                        onMouseEnter={(e) => {
                          // 布材編集時 or 階段編集時の黄色発光領域はクリックしやすいように手のカーソルに
                          if (currentMode === 'edit' && (editTargetType === '布材' || editTargetType === '階段')) {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'default';
                        }}
                        onClick={(e) => {
                          // 布材編集 or 階段編集
                          if (!(currentMode === 'edit' && (editTargetType === '布材' || editTargetType === '階段'))) return;
                          e.cancelBubble = true;
                          const args = { anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id } as const;
                          if (editTargetType === '布材') onClothClick?.(args);
                          else onStairClick?.(args);
                        }}
                        onTap={(e) => {
                          if (!(currentMode === 'edit' && (editTargetType === '布材' || editTargetType === '階段'))) return;
                          e.cancelBubble = true;
                          const args = { anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id } as const;
                          if (editTargetType === '布材') onClothClick?.(args);
                          else onStairClick?.(args);
                        }}
                      />
                      {/* 階段編集時のクリック領域（最前面に配置、黄色発光部分全域をカバー） */}
                      {highlightStairLine && (
                        <Line
                          points={[part.position.x, part.position.y, x2, y2]}
                          stroke="rgba(0,0,0,0)"
                          strokeWidth={Math.max(CLOTH_GLOW.glowWidth + 8, 20 * invScale)}
                          listening={true}
                          onClick={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === '階段')) return;
                            e.cancelBubble = true;
                            const args = { anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id } as const;
                            onStairClick?.(args);
                          }}
                          onTap={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === '階段')) return;
                            e.cancelBubble = true;
                            const args = { anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id } as const;
                            onStairClick?.(args);
                          }}
                          onMouseEnter={(e) => {
                            if (currentMode === 'edit' && editTargetType === '階段') {
                              const stage = e.target.getStage?.();
                              if (stage) stage.container().style.cursor = 'pointer';
                            }
                          }}
                          onMouseLeave={(e) => {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'default';
                          }}
                        />
                      )}
                      {/* 中点の青色発光（加算合成の○） */}
                      {(showMidGlowCloth || showMidGlowStair) && (() => {
                        const anchor = { x: midX, y: midY };
                        const rScale = getRadiusScale(part.id + '-mid', anchor);
                        const opGrad = getPulseOpacity(0.95, part.id + '-mid', anchor);
                        const opRing = getPulseOpacity(0.95, part.id + '-mid', anchor);
                        const opCore = getPulseOpacity(0.9, part.id + '-mid', anchor);
                        return (
                          <>
                            <Circle
                              x={midX}
                              y={midY}
                              radius={CLOTH_MID_GLOW.gradRadius * rScale}
                              listening={false}
                              fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                              fillRadialGradientStartRadius={0}
                              fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                              fillRadialGradientEndRadius={CLOTH_MID_GLOW.gradRadius * rScale}
                              fillRadialGradientColorStops={[0, 'rgba(59,130,246,0.95)', 1, 'rgba(59,130,246,0)']}
                              opacity={opGrad}
                              globalCompositeOperation="lighter"
                            />
                            <Circle
                              x={midX}
                              y={midY}
                              radius={CLOTH_MID_GLOW.ringRadius * rScale}
                              stroke={CLOTH_MID_GLOW.colorRing}
                              strokeWidth={CLOTH_MID_GLOW.ringStroke}
                              opacity={opRing}
                              shadowColor={CLOTH_MID_GLOW.colorRing}
                              shadowBlur={CLOTH_MID_GLOW.shadowBlur}
                              shadowOpacity={0.9}
                              globalCompositeOperation="lighter"
                              listening={false}
                            />
                            <Circle
                              x={midX}
                              y={midY}
                              radius={CLOTH_MID_GLOW.coreRadius * rScale}
                              fill={CLOTH_MID_GLOW.colorCore}
                              opacity={opCore}
                              globalCompositeOperation="lighter"
                              listening={false}
                            />
                            {/* 階段編集時のみ: 青色発光「中点」クリックで筋交数量カードを開く */}
                            {currentMode === 'edit' && editTargetType === '階段' && (
                              <Circle
                                x={midX}
                                y={midY}
                                radius={Math.max(CLOTH_MID_GLOW.ringRadius * rScale + 8, 16 * invScale)}
                                fill={'rgba(0,0,0,0)'}
                                listening={true}
                                onClick={(e) => {
                                  e.cancelBubble = true;
                                  onStairBraceClick?.({ anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id });
                                }}
                                onTap={(e) => {
                                  e.cancelBubble = true;
                                  onStairBraceClick?.({ anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id });
                                }}
                              />
                            )}
                            {/* ドラッグ開始ハンドル（布材編集時のみ） */}
                            {currentMode === 'edit' && editTargetType === '布材' && (
                              <Circle
                                x={midX}
                                y={midY}
                                radius={Math.max(CLOTH_MID_GLOW.ringRadius * rScale + 8, 16 * invScale)}
                                fill={'rgba(0,0,0,0)'}
                                listening={true}
                                onMouseDown={(e) => {
                                  e.cancelBubble = true;
                                  onClothSplitStart?.({ groupId: group.id, partId: part.id });
                                }}
                                onDragStart={(e) => {
                                  e.cancelBubble = true;
                                }}
                              />
                            )}
                          </>
                        );
                      })()}
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
                      {highlightBracketLine && (() => {
                        const anchor = { x: (part.position.x + x2) / 2, y: (part.position.y + y2) / 2 };
                        const op = getPulseOpacity(0.9, part.id, anchor);
                        return (
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke={'#FACC15'}
                            strokeWidth={BRACKET_GLOW.glowWidth}
                            opacity={op}
                            shadowColor={'#FACC15'}
                            shadowBlur={BRACKET_GLOW.shadowBlur}
                            shadowOpacity={0.95}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        );
                      })()}
                      {/* 先端の青色発光（柱編集時） */}
                      {highlightBracketTip && (() => {
                        const anchor = { x: x2, y: y2 };
                        const rScale = getRadiusScale(part.id + '-tip', anchor);
                        const opGrad = getPulseOpacity(0.95, part.id + '-tip', anchor);
                        const opRing = getPulseOpacity(0.95, part.id + '-tip', anchor);
                        const opCore = getPulseOpacity(0.9, part.id + '-tip', anchor);
                        return (
                        <>
                          {/* 放射グロー（青） */}
                          <Circle
                            x={x2}
                            y={y2}
                            radius={TIP_GLOW.gradRadius * rScale}
                            listening={false}
                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                            fillRadialGradientStartRadius={0}
                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                            fillRadialGradientEndRadius={TIP_GLOW.gradRadius * rScale}
                            fillRadialGradientColorStops={[0, 'rgba(59,130,246,0.95)', 1, 'rgba(59,130,246,0)']}
                            opacity={opGrad}
                            globalCompositeOperation="lighter"
                          />
                          {/* 外周リング（青） */}
                          <Circle
                            x={x2}
                            y={y2}
                            radius={TIP_GLOW.ringRadius * rScale}
                            stroke={'#60A5FA'}
                            strokeWidth={TIP_GLOW.ringStroke}
                            opacity={opRing}
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
                            radius={TIP_GLOW.coreRadius * rScale}
                            fill={'rgba(59,130,246,0.85)'}
                            opacity={opCore}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                          {/* クリック領域（透明）: 青色発光部をクリックで柱を追加 */}
                          <Circle
                            x={x2}
                            y={y2}
                            radius={Math.max(TIP_GLOW.ringRadius * rScale + 8, 16 * invScale)}
                            fill={'rgba(0,0,0,0)'}
                            listening={true}
                            onClick={(e) => {
                              e.cancelBubble = true;
                              // 作図モードで生成される柱と同じ仕様で追加
                              const newPillar = {
                                id: uuidv4(),
                                type: '柱' as const,
                                position: { x: x2, y: y2 }, // 先端を中心に配置
                                color: part.color,
                                marker: 'circle' as const,
                                meta: {
                                  direction: part.meta?.direction, // 外向き
                                  offsetMm: part.meta?.offsetMm, // ライン上の位置
                                },
                              };
                              // 追加: ブラケットと同じ長さの布材を同境界位置に作図（スパン方向）
                              let nextParts = [...group.parts, newPillar];
                              try {
                                const offsetMm = part.meta?.offsetMm as number | undefined;
                                const spanLenMm = group.meta?.spanLength as number | undefined;
                                const line = group.meta?.line;
                                const lengthMm = part.meta?.width ?? (part.meta?.bracketSize === 'W' ? 600 : 355);
                                const bracketDir = part.meta?.direction ?? 0;
                                if (offsetMm != null && spanLenMm && line && lengthMm) {
                                  // ブラケットと同じ向き（法線方向）で布材を作図
                                  const ratio = Math.max(0, Math.min(1, offsetMm / spanLenMm));
                                  const startX = line.start.x + (line.end.x - line.start.x) * ratio;
                                  const startY = line.start.y + (line.end.y - line.start.y) * ratio;
                                  nextParts = [
                                    ...group.parts,
                                    newPillar,
                                    {
                                      id: uuidv4(),
                                      type: '布材',
                                      position: { x: startX, y: startY },
                                      color: part.color,
                                      meta: {
                                        length: lengthMm,
                                        direction: bracketDir,
                                        offsetMm: offsetMm,
                                      },
                                    },
                                  ];
                                }
                              } catch {}
                              updateScaffoldGroup(group.id, { parts: nextParts });
                            }}
                            onTap={(e) => {
                              e.cancelBubble = true;
                              const newPillar = {
                                id: uuidv4(),
                                type: '柱' as const,
                                position: { x: x2, y: y2 },
                                color: part.color,
                                marker: 'circle' as const,
                                meta: {
                                  direction: part.meta?.direction,
                                  offsetMm: part.meta?.offsetMm,
                                },
                              };
                              let nextParts = [...group.parts, newPillar];
                              try {
                                const offsetMm = part.meta?.offsetMm as number | undefined;
                                const spanLenMm = group.meta?.spanLength as number | undefined;
                                const line = group.meta?.line;
                                const lengthMm = part.meta?.width ?? (part.meta?.bracketSize === 'W' ? 600 : 355);
                                const bracketDir = part.meta?.direction ?? 0;
                                if (offsetMm != null && spanLenMm && line && lengthMm) {
                                  // ブラケットと同じ向きで布材を作図
                                  const ratio = Math.max(0, Math.min(1, offsetMm / spanLenMm));
                                  const startX = line.start.x + (line.end.x - line.start.x) * ratio;
                                  const startY = line.start.y + (line.end.y - line.start.y) * ratio;
                                  nextParts = [
                                    ...group.parts,
                                    newPillar,
                                    {
                                      id: uuidv4(),
                                      type: '布材',
                                      position: { x: startX, y: startY },
                                      color: part.color,
                                      meta: {
                                        length: lengthMm,
                                        direction: bracketDir,
                                        offsetMm: offsetMm,
                                      },
                                    },
                                  ];
                                }
                              } catch {}
                              updateScaffoldGroup(group.id, { parts: nextParts });
                            }}
                          />
                        </>
                        );
                      })()}
                      {/* 本体ライン */}
                      <Line
                        points={[part.position.x, part.position.y, x2, y2]}
                        stroke={stroke}
                        strokeWidth={2}
                        shadowColor={highlightBracketLine ? '#FACC15' : undefined}
                        shadowBlur={highlightBracketLine ? BRACKET_GLOW.shadowBlur * 0.6 : 0}
                        shadowOpacity={highlightBracketLine ? 0.7 : 0}
                        onMouseEnter={(e) => {
                          if (currentMode === 'edit' && editTargetType === 'ブラケット') {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'default';
                        }}
                        onClick={(e) => {
                          // ブラケット編集時のみカードを出す
                          if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                          e.cancelBubble = true;
                          const midX = (part.position.x + x2) / 2;
                          const midY = (part.position.y + y2) / 2;
                          onBracketClick?.({
                            anchor: { x: midX, y: midY },
                            groupId: group.id,
                            partId: part.id,
                          });
                        }}
                        onTap={(e) => {
                          if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                          e.cancelBubble = true;
                          const midX = (part.position.x + x2) / 2;
                          const midY = (part.position.y + y2) / 2;
                          onBracketClick?.({
                            anchor: { x: midX, y: midY },
                            groupId: group.id,
                            partId: part.id,
                          });
                        }}
                      />
                      {/* ブラケット編集時のクリック領域（最前面に配置、アンチと重なってもクリック可能） */}
                      {highlightBracketLine && (
                        <Line
                          points={[part.position.x, part.position.y, x2, y2]}
                          stroke="rgba(0,0,0,0)"
                          strokeWidth={Math.max(BRACKET_GLOW.glowWidth + 8, 20 * invScale)}
                          listening={true}
                          onClick={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                            e.cancelBubble = true;
                            const midX = (part.position.x + x2) / 2;
                            const midY = (part.position.y + y2) / 2;
                            onBracketClick?.({
                              anchor: { x: midX, y: midY },
                              groupId: group.id,
                              partId: part.id,
                            });
                          }}
                          onTap={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                            e.cancelBubble = true;
                            const midX = (part.position.x + x2) / 2;
                            const midY = (part.position.y + y2) / 2;
                            onBracketClick?.({
                              anchor: { x: midX, y: midY },
                              groupId: group.id,
                              partId: part.id,
                            });
                          }}
                          onMouseEnter={(e) => {
                            if (currentMode === 'edit' && editTargetType === 'ブラケット') {
                              const stage = e.target.getStage?.();
                              if (stage) stage.container().style.cursor = 'pointer';
                            }
                          }}
                          onMouseLeave={(e) => {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'default';
                          }}
                        />
                      )}
                    </Group>
                  );
                }

                case '階段': {
                  // 階段は meta.width を使用（既定: 400mm）。levels が指定されていればその段数で等分線を描く。
                  // ※ 既存互換: lengthが 1800/900 の場合は従来の等分（8/4）をデフォルトに維持。
                  const lengthMm = part.meta?.length ?? 1800;
                  const widthMm = part.meta?.width ?? 400; // 既定はW相当
                  const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
                  const widthPx = mmToPx(widthMm, DEFAULT_SCALE);
                  const angle = part.meta?.direction ?? 0; // スパン方向と平行
                  const stroke = colorToStroke(part.color);
                  const v = degToUnitVector(angle);
                  // 直交方向（矩形短辺方向）
                  const n = { x: -v.y, y: v.x };
                  // ステップ線の数（等分線の本数 = 分割数-1）
                  // meta.levels があればそれを優先（例: 2 段 → 中央に1本）。無ければ既存の 1800→8, 900→4。
                  const levels = typeof part.meta?.levels === 'number' ? Math.max(0, Math.floor(Number(part.meta?.levels))) : undefined;
                  const div = levels && levels > 1 ? levels : lengthMm === 1800 ? 8 : lengthMm === 900 ? 4 : 0;
                  const lines = [] as JSX.Element[];
                  for (let i = 1; i < div; i++) {
                    const t = (i / div) * lengthPx - lengthPx / 2; // 中央基準のオフセット（px）
                    const cx = part.position.x + v.x * t;
                    const cy = part.position.y + v.y * t;
                    const x1 = cx - n.x * (widthPx / 2);
                    const y1 = cy - n.y * (widthPx / 2);
                    const x2 = cx + n.x * (widthPx / 2);
                    const y2 = cy + n.y * (widthPx / 2);
                    lines.push(
                      <Line
                        key={`${part.id}-step-${i}`}
                        points={[x1, y1, x2, y2]}
                        stroke={stroke}
                        strokeWidth={1}
                        opacity={0.9}
                        listening={false}
                      />
                    );
                  }
                  // 矢印（矩形中心に向き表示）: 軸方向に短い矢印を描く
                  const cx = part.position.x;
                  const cy = part.position.y;
                  const arrowLen = Math.min(lengthPx * 0.35, 60); // ほどよい長さ
                  const headLen = Math.min(widthPx * 0.35, 18);
                  const baseX = cx - v.x * (arrowLen / 2);
                  const baseY = cy - v.y * (arrowLen / 2);
                  const tipX = cx + v.x * (arrowLen / 2);
                  const tipY = cy + v.y * (arrowLen / 2);
                  // 矢印ヘッド（±30°）
                  const rad = (30 * Math.PI) / 180;
                  const hx1 = tipX - (v.x * Math.cos(rad) - v.y * Math.sin(rad)) * headLen;
                  const hy1 = tipY - (v.y * Math.cos(rad) + v.x * Math.sin(rad)) * headLen;
                  const hx2 = tipX - (v.x * Math.cos(-rad) - v.y * Math.sin(-rad)) * headLen;
                  const hy2 = tipY - (v.y * Math.cos(-rad) + v.x * Math.sin(-rad)) * headLen;
                  return (
                    <Group key={part.id}>
                      {/* 外枠 */}
                      <Rect
                        x={part.position.x}
                        y={part.position.y}
                        width={lengthPx}
                        height={widthPx}
                        offsetX={lengthPx / 2}
                        offsetY={widthPx / 2}
                        rotation={angle}
                        stroke={stroke}
                        strokeWidth={1.5}
                        cornerRadius={2}
                        fill={stroke + '22'}
                        listening={false}
                      />
                      {/* 等分線 */}
                      {lines}
                      {/* 方向矢印（中央） */}
                      <Line points={[baseX, baseY, tipX, tipY]} stroke={stroke} strokeWidth={1.5} listening={false} opacity={0.95} />
                      <Line points={[tipX, tipY, hx1, hy1]} stroke={stroke} strokeWidth={1.5} listening={false} opacity={0.95} />
                      <Line points={[tipX, tipY, hx2, hy2]} stroke={stroke} strokeWidth={1.5} listening={false} opacity={0.95} />
                      {/* クリック領域（矢印上）: クリックで向き反転 / Shift+クリックでアンチに変換 */}
                      <Line
                        points={[baseX, baseY, tipX, tipY]}
                        stroke={'rgba(0,0,0,0)'}
                        strokeWidth={Math.max(10, 16 * invScale)}
                        listening={true}
                        onMouseEnter={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'pointer';
                          // 1800階段の矢印ホバー中にスペースキーで数量追加できるよう記録
                          setHoveredStair({ groupId: group.id, partId: part.id });
                        }}
                        onMouseLeave={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'default';
                          setHoveredStair((h) => (h && h.partId === part.id ? null : h));
                        }}
                        onClick={(e) => {
                          e.cancelBubble = true;
                          const withShift = e.evt?.shiftKey;
                          // Shift+クリック: アンチへ変換
                          if (withShift) {
                            const lineMeta = group.meta?.line;
                            const spanLenMm = Number(group.meta?.spanLength ?? 0);
                            const offsetCenterMm = Number(part.meta?.offsetMm ?? 0); // 中心の沿い方向オフセット（mm）
                            const antiWidthMm = 400; // W
                            if (lineMeta && spanLenMm > 0) {
                              // スパン方向ベクトル（px）
                              const spanAngleDeg = angle; // 階段の長手方向はスパン方向
                              const vr = degToUnitVector(spanAngleDeg);
                              // 左法線（reversed=false）をベクトルで算出（calculateDirection依存を避ける）
                              const dxL = lineMeta.end.x - lineMeta.start.x;
                              const dyL = lineMeta.end.y - lineMeta.start.y;
                              const lenL = Math.sqrt(dxL * dxL + dyL * dyL) || 1;
                              const nLeft = { x: -dyL / lenL, y: dxL / lenL };
                              // ライン上の中心点（offsetCenterMm / spanLenMm）
                              const r = Math.max(0, Math.min(1, offsetCenterMm / spanLenMm));
                              const base = {
                                x: lineMeta.start.x + (lineMeta.end.x - lineMeta.start.x) * r,
                                y: lineMeta.start.y + (lineMeta.end.y - lineMeta.start.y) * r,
                              };
                              // 既存の階段矩形の中心そのままにアンチを配置（矩形は既に350mm側にある想定）
                              const pos = { x: part.position.x, y: part.position.y };
                              // offsetMm は区間の開始オフセット（中心から長手/2 引く）
                              const offsetStartMm = offsetCenterMm - lengthMm / 2;
                              const antiPart = {
                                id: part.id,
                                type: 'アンチ' as const,
                                position: pos, // 正しい350mm中心位置
                                color: part.color,
                                meta: {
                                  length: lengthMm,
                                  width: antiWidthMm,
                                  bracketSize: 'W',
                                  direction: spanAngleDeg, // 長手はスパンと平行
                                  offsetMm: offsetStartMm, // 始点からの開始オフセット
                                },
                              };
                              // 追加: 元ライン中心に S 幅（240mm）のアンチを追加作図
                              const sAntiPart = {
                                id: uuidv4(),
                                type: 'アンチ' as const,
                                position: { x: base.x, y: base.y }, // ライン上の中心
                                color: part.color,
                                meta: {
                                  length: lengthMm,
                                  width: 240, // S 幅
                                  bracketSize: 'S',
                                  direction: spanAngleDeg,
                                  offsetMm: offsetStartMm,
                                },
                              };
                              const replaced = group.parts.map((p) =>
                                p.id === part.id ? (antiPart as any) : p
                              );
                              updateScaffoldGroup(group.id, {
                                parts: [...replaced, sAntiPart],
                              });
                              return;
                            }
                          }
                          // 通常クリック: 矢印向きを反転（180°）
                          const dir = Number(part.meta?.direction ?? 0);
                          const flipped = (dir + 180) % 360;
                          updateScaffoldGroup(group.id, {
                            parts: group.parts.map((p) =>
                              p.id === part.id
                                ? ({
                                    ...p,
                                    meta: { ...(p.meta || {}), direction: flipped },
                                  } as any)
                                : p
                            ),
                          });
                        }}
                      />
                      {/* 矢印近くに数量表示（×2 など）。quantity>1 のときのみ表示 */}
                      {Number(part.meta?.quantity ?? 1) > 1 && (() => {
                        // 矩形内側の端から少し内側に寄せた位置（回転に追従）
                        const margin = Math.min(12, widthPx / 2 - 6);
                        const labelX = cx + n.x * (widthPx / 2 - margin);
                        const labelY = cy + n.y * (widthPx / 2 - margin);
                        return (
                          <Text
                            x={labelX}
                            y={labelY}
                            text={`×${Number(part.meta?.quantity ?? 1)}`}
                            fontSize={12}
                            fill={stroke}
                            listening={false}
                          />
                        );
                      })()}
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
                    <Group key={part.id}>
                      {/* アンチの黄色発光（枠の外周・加算合成） */}
                      {highlightAnti && (() => {
                        const anchor = { x: part.position.x, y: part.position.y };
                        const op = getPulseOpacity(0.95, part.id, anchor);
                        return (
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
                            opacity={op}
                            shadowColor={'#FACC15'}
                            shadowBlur={ANTI_GLOW.shadowBlur}
                            shadowOpacity={0.95}
                            globalCompositeOperation="lighter"
                            listening={false}
                            cornerRadius={2}
                          />
                        );
                      })()}
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
                        onMouseEnter={(e) => {
                          if (currentMode === 'edit' && editTargetType === 'アンチ') {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'default';
                        }}
                        onClick={(e) => {
                          // アンチ編集時のみカードを出す
                          if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                          e.cancelBubble = true;
                          onAntiClick?.({
                            anchor: { x: part.position.x, y: part.position.y },
                            groupId: group.id,
                            partId: part.id,
                          });
                        }}
                        onTap={(e) => {
                          if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                          e.cancelBubble = true;
                          onAntiClick?.({
                            anchor: { x: part.position.x, y: part.position.y },
                            groupId: group.id,
                            partId: part.id,
                          });
                        }}
                      />
                      {/* クリック領域（透明、矩形全体をカバー、ただし青色発光部分は除外） */}
                      {highlightAnti && (
                        <Rect
                          x={part.position.x}
                          y={part.position.y}
                          width={lengthPx}
                          height={widthPx}
                          offsetX={lengthPx / 2}
                          offsetY={widthPx / 2}
                          rotation={angle}
                          fill="rgba(0,0,0,0)"
                          listening={true}
                          onClick={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                            // クリック位置が青色発光部分の範囲内かチェック
                            const stage = e.target.getStage();
                            if (stage) {
                              const stagePos = stage.getPointerPosition();
                              if (stagePos) {
                                const canvasPos = {
                                  x: (stagePos.x - canvasPosition.x) / canvasScale,
                                  y: (stagePos.y - canvasPosition.y) / canvasScale,
                                };
                                const dx = canvasPos.x - part.position.x;
                                const dy = canvasPos.y - part.position.y;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                const glowRadius = ANTI_MID_GLOW.gradRadius * getRadiusScale(part.id + '-anti-mid', { x: part.position.x, y: part.position.y });
                                // 青色発光部分の範囲内の場合はクリックを無視
                                if (distance <= glowRadius) {
                                  return;
                                }
                              }
                            }
                            e.cancelBubble = true;
                            onAntiClick?.({
                              anchor: { x: part.position.x, y: part.position.y },
                              groupId: group.id,
                              partId: part.id,
                            });
                          }}
                          onTap={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                            // タップ位置が青色発光部分の範囲内かチェック
                            const stage = e.target.getStage();
                            if (stage) {
                              const stagePos = stage.getPointerPosition();
                              if (stagePos) {
                                const canvasPos = {
                                  x: (stagePos.x - canvasPosition.x) / canvasScale,
                                  y: (stagePos.y - canvasPosition.y) / canvasScale,
                                };
                                const dx = canvasPos.x - part.position.x;
                                const dy = canvasPos.y - part.position.y;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                const glowRadius = ANTI_MID_GLOW.gradRadius * getRadiusScale(part.id + '-anti-mid', { x: part.position.x, y: part.position.y });
                                // 青色発光部分の範囲内の場合はクリックを無視
                                if (distance <= glowRadius) {
                                  return;
                                }
                              }
                            }
                            e.cancelBubble = true;
                            onAntiClick?.({
                              anchor: { x: part.position.x, y: part.position.y },
                              groupId: group.id,
                              partId: part.id,
                            });
                          }}
                        />
                      )}
                      {/* アンチの中点に青色発光○（中心はpart.position） */}
                      {highlightAnti && (() => {
                        const anchor = { x: part.position.x, y: part.position.y };
                        const rScale = getRadiusScale(part.id + '-anti-mid', anchor);
                        const opGrad = getPulseOpacity(0.95, part.id + '-anti-mid', anchor);
                        const opRing = getPulseOpacity(0.95, part.id + '-anti-mid', anchor);
                        const opCore = getPulseOpacity(0.9, part.id + '-anti-mid', anchor);
                        return (
                          <>
                            <Circle
                              x={part.position.x}
                              y={part.position.y}
                              radius={ANTI_MID_GLOW.gradRadius * rScale}
                              listening={false}
                              fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                              fillRadialGradientStartRadius={0}
                              fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                              fillRadialGradientEndRadius={ANTI_MID_GLOW.gradRadius * rScale}
                              fillRadialGradientColorStops={[0, 'rgba(59,130,246,0.95)', 1, 'rgba(59,130,246,0)']}
                              opacity={opGrad}
                              globalCompositeOperation="lighter"
                            />
                            <Circle
                              x={part.position.x}
                              y={part.position.y}
                              radius={ANTI_MID_GLOW.ringRadius * rScale}
                              stroke={ANTI_MID_GLOW.colorRing}
                              strokeWidth={ANTI_MID_GLOW.ringStroke}
                              opacity={opRing}
                              shadowColor={ANTI_MID_GLOW.colorRing}
                              shadowBlur={ANTI_MID_GLOW.shadowBlur}
                              shadowOpacity={0.9}
                              globalCompositeOperation="lighter"
                              listening={false}
                            />
                            <Circle
                              x={part.position.x}
                              y={part.position.y}
                              radius={ANTI_MID_GLOW.coreRadius * rScale}
                              fill={ANTI_MID_GLOW.colorCore}
                              opacity={opCore}
                              globalCompositeOperation="lighter"
                              listening={false}
                            />
                            {/* 青色発光部分のクリック領域（最前面に配置） */}
                            <Circle
                              x={part.position.x}
                              y={part.position.y}
                              radius={ANTI_MID_GLOW.gradRadius * rScale}
                              fill="rgba(0,0,0,0)"
                              listening={true}
                              onClick={(e) => {
                                if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                                e.cancelBubble = true;
                                onAntiLevelClick?.({
                                  anchor: { x: part.position.x, y: part.position.y },
                                  groupId: group.id,
                                  partId: part.id,
                                });
                              }}
                              onTap={(e) => {
                                if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                                e.cancelBubble = true;
                                onAntiLevelClick?.({
                                  anchor: { x: part.position.x, y: part.position.y },
                                  groupId: group.id,
                                  partId: part.id,
                                });
                              }}
                            />
                          </>
                        );
                      })()}
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
