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
  onHaneConfigClick,
  onClothSplitStart,
  onViewPartHover,
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
   * ハネ編集時、柱クリックで方向・寸法カードを出す
   */
  onHaneConfigClick?: (args: {
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
  /**
   * ビューモード時の部材ホバー情報を渡すコールバック
   */
  onViewPartHover?: (args: {
    groupId: string;
    partId: string;
    screenPosition: { x: number; y: number };
  } | null) => void;
}) {
  const {
    scaffoldGroups,
    updateScaffoldGroup,
    editTargetType,
    canvasScale,
    canvasPosition,
    editSelectionMode,
    selectedScaffoldPartKeys,
    toggleSelectScaffoldPart,
  } = useDrawingStore();
  const { currentMode } = useDrawingModeStore();
  const { isDark } = useTheme();

  /**
   * 梁枠パターンの選択・ホバー状態
   * - frameSelection: グループID|startMm-endMm -> 選択インデックス
   * - hoveredFrameKey: ホバー中の領域キー（手カーソルと視覚強調）
   */
  const [frameSelection, setFrameSelection] = React.useState<Record<string, number>>({});
  const [hoveredFrameKey, setHoveredFrameKey] = React.useState<string | null>(null);
  // 確定済み梁枠のホバー（数量×2のUI表示・Spaceで加算）
  const [hoveredBeamFrame, setHoveredBeamFrame] = React.useState<{ groupId: string; partId: string } | null>(null);

  /**
   * Cmd/Ctrl + Enter で梁枠を確定
   * - 選択中のパターンについて、間柱を三角化し、該当布材を点線化
   * - 布材はデータへ反映（meta.lineStyle='dashed'）し、以後の描画で常に点線表示
   */
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && (e.key === 'Enter' || e.code === 'Enter'))) return;
      // 梁枠編集時のみ有効
      const { editTargetType, scaffoldGroups, updateScaffoldGroup } = useDrawingStore.getState();
      if (editTargetType !== '梁枠') return;

      // すべてのグループに対して、frameSelection の対象を確定反映
      for (const group of scaffoldGroups) {
        // グループ内の布材をオフセット順に
        const cloths = group.parts
          .filter((p) => p.type === '布材' && p.meta?.lineStyle !== 'dashed')
          .sort((a, b) => (a.meta?.offsetMm ?? 0) - (b.meta?.offsetMm ?? 0));

        // パターン検出（描画部と同等）
        type FrameMatch = { start: number; length: number; name: 'P2_1800_1800' | 'P3_1800_1800_1800' | 'P2_1800_900' | 'P2_900_1800' };
        const matches: FrameMatch[] = [];
        for (let i = 0; i < cloths.length; i++) {
          const l0 = cloths[i]?.meta?.length ?? 0;
          const l1 = cloths[i + 1]?.meta?.length ?? 0;
          const l2 = cloths[i + 2]?.meta?.length ?? 0;
          if (i + 1 < cloths.length && l0 === 1800 && l1 === 1800) matches.push({ start: i, length: 2, name: 'P2_1800_1800' });
          if (i + 2 < cloths.length && l0 === 1800 && l1 === 1800 && l2 === 1800) matches.push({ start: i, length: 3, name: 'P3_1800_1800_1800' });
          if (i + 1 < cloths.length && l0 === 1800 && l1 === 900) matches.push({ start: i, length: 2, name: 'P2_1800_900' });
          if (i + 1 < cloths.length && l0 === 900 && l1 === 1800) matches.push({ start: i, length: 2, name: 'P2_900_1800' });
        }

        // グルーピング（安定キー: 先頭布材ID-末尾布材ID）
        type FrameGroup = { key: string; startId: string; endId: string; matches: FrameMatch[] };
        const toInterval = (m: FrameMatch) => {
          const first = cloths[m.start];
          const last = cloths[m.start + m.length - 1];
          const s = Number(first?.meta?.offsetMm ?? 0);
          const e = Number(last?.meta?.offsetMm ?? 0) + Number(last?.meta?.length ?? 0);
          return { s, e, m };
        };
        const ivs = matches.map(toInterval).sort((a, b) => (a.s === b.s ? a.e - b.e : a.s - b.s));
        const fgs: FrameGroup[] = [];
        let cur: typeof ivs = [];
        const flush = () => {
          if (!cur.length) return;
          const s = Math.min(...cur.map((c) => c.s));
          const e = Math.max(...cur.map((c) => c.e));
          const first = cur[0];
          const last = cur.reduce((p, c) => (c.e >= p.e ? c : p), cur[0]);
          const firstId = cloths[first.m.start]?.id ?? `s${s}`;
          const lastId = cloths[last.m.start + last.m.length - 1]?.id ?? `e${e}`;
          const key = `${group.id}|${firstId}-${lastId}`;
          fgs.push({ key, startId: firstId, endId: lastId, matches: cur.map((c) => c.m) });
          cur = [];
        };
        for (const iv of ivs) {
          if (!cur.length) cur.push(iv);
          else {
            const lastEnd = Math.max(...cur.map((c) => c.e));
            if (iv.s <= lastEnd) cur.push(iv);
            else {
              flush();
              cur.push(iv);
            }
          }
        }
        flush();

        // 対象キー: hoveredFrameKey があればそれを最優先。なければ frameSelection に存在するキー。
        let changed = false;
        let parts = group.parts.map((p) => ({ ...p }));

        const keysToConfirm = new Set<string>();
        if (hoveredFrameKey) keysToConfirm.add(hoveredFrameKey);
        for (const k of Object.keys(frameSelection)) keysToConfirm.add(k);

        // スパン方向ベクトル（px）
        const t = group.meta?.line
          ? normalize(
              group.meta.line.end.x - group.meta.line.start.x,
              group.meta.line.end.y - group.meta.line.start.y
            )
          : { x: 1, y: 0 };

        for (const fg of fgs) {
          if (!keysToConfirm.has(fg.key)) continue;
          const sel = frameSelection[fg.key] ?? 0;
          const idx = Math.max(0, Math.min(sel, fg.matches.length - 1));
          const active = fg.matches[idx];
          // 1) 布材を点線化（対象 cloths[active.start..start+length-1]）
          const clothIds = new Set(
            Array.from({ length: active.length }, (_, i) => cloths[active.start + i]?.id).filter(Boolean) as string[]
          );
          parts = parts.map((p) =>
            p.type === '布材' && clothIds.has(p.id)
              ? ({ ...p, meta: { ...(p.meta || {}), lineStyle: 'dashed' } } as any)
              : p
          );
          // 2) 間柱を三角化（境界オフセットで柱を検索）
          const first = cloths[active.start];
          let offMm = Number(first?.meta?.offsetMm ?? 0);
          for (let i = 1; i <= active.length - 1; i++) {
            const prev = cloths[active.start + i - 1];
            const len = Number(prev?.meta?.length ?? 0);
            const boundary = offMm + len;
            offMm = boundary;
            parts = parts.map((p) => {
              if (
                p.type === '柱' &&
                Math.abs(Number(p.meta?.offsetMm ?? 1e9) - boundary) <= 1
              ) {
                return { ...p, marker: 'triangle' as const, meta: { ...(p.meta || {}), markerFrom: 'beam-frame' } };
              }
              return p;
            });
          }
          // 3) 梁枠パーツを追加（数量表の自動集計対象）
          // 長さ（mm）: 対象 cloth の合計
          const combinedLen = Array.from({ length: active.length }, (_, i) => Number(cloths[active.start + i]?.meta?.length ?? 0)).reduce((a, b) => a + b, 0);
          // アンカー（px）: 先頭布材の始点と末尾布材の終点の中点
          const firstCloth = cloths[active.start];
          const lastCloth = cloths[active.start + active.length - 1];
          const lastDir = typeof lastCloth?.meta?.direction === 'number' ? degToUnitVector(Number(lastCloth?.meta?.direction)) : t;
          const lastLenPx = mmToPx(Number(lastCloth?.meta?.length ?? 0), DEFAULT_SCALE);
          const startPos = { x: firstCloth.position.x, y: firstCloth.position.y };
          const endPos = { x: lastCloth.position.x + lastDir.x * lastLenPx, y: lastCloth.position.y + lastDir.y * lastLenPx };
          const anchor = { x: (startPos.x + endPos.x) / 2, y: (startPos.y + endPos.y) / 2 };
          parts.push({
            id: uuidv4(),
            type: '梁枠',
            position: anchor,
            color: 'green',
            meta: { length: combinedLen, quantity: 1, startOffsetMm: Number(first?.meta?.offsetMm ?? 0), endOffsetMm: offMm },
          } as any);
          changed = true;
        }

        if (changed) updateScaffoldGroup(group.id, { parts });
      }

      // 反映後は選択状態をクリア
      if (Object.keys(frameSelection).length > 0) {
        e.preventDefault();
        setHoveredFrameKey(null);
        setFrameSelection({});
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [frameSelection, hoveredFrameKey]);

  // スペースキーで確定済み梁枠の数量を+1（ホバー中のみ、梁枠モード時）
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const { editTargetType, scaffoldGroups, updateScaffoldGroup } = useDrawingStore.getState();
      if (!(editTargetType === '梁枠' && hoveredBeamFrame)) return;
      e.preventDefault();
      const { groupId, partId } = hoveredBeamFrame;
      const group = scaffoldGroups.find((g) => g.id === groupId);
      if (!group) return;
      const parts = group.parts.map((p) =>
        p.id === partId ? ({ ...p, meta: { ...(p.meta || {}), quantity: Number(p.meta?.quantity ?? 1) + 1 } } as any) : p
      );
      updateScaffoldGroup(groupId, { parts });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hoveredBeamFrame]);

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
  
  // ビューモード時のホバー中の部材（情報カード表示用）
  const [hoveredViewPart, setHoveredViewPart] = React.useState<{
    groupId: string;
    partId: string;
    screenPosition: { x: number; y: number };
  } | null>(null);

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

  /**
   * 数量が確定しているかの判定
   * - 汎用フラグ meta.quantityConfirmed を最優先
   * - 互換: 値が入っている場合（pillarCounts/quantity/antiW/antiS/braceQty）も確定扱い
   */
  const isQuantityConfirmed = (p: ScaffoldPart): boolean => {
    const m: any = p.meta || {};
    if (m.quantityConfirmed === true) return true;
    switch (p.type) {
      case '柱': {
        const counts = m.pillarCounts as Record<string, number> | undefined;
        if (counts) {
          for (const k of Object.keys(counts)) {
            if (Number(counts[k] || 0) > 0) return true;
          }
        }
        return false;
      }
      case '布材':
        return (
          Number(m.quantity || 0) > 0 ||
          Number(m.braceQty || 0) > 0
        );
      case 'ブラケット':
        return Number(m.quantity || 0) > 0;
      case 'アンチ':
        return Number(m.antiW || 0) > 0 || Number(m.antiS || 0) > 0;
      default:
        return false;
    }
  };

  // パルスアニメーション（編集モード中のみ駆動、約30fps）
  const [pulseTime, setPulseTime] = React.useState(0);
  React.useEffect(() => {
    if (currentMode !== 'edit' && currentMode !== 'view') return; // 編集時とビューモード時のみ
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
            .filter((p) => p.type === '布材' && p.meta?.lineStyle !== 'dashed')
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

        // ドラッグ完全無効化（作図済みグループは動かせない）
        const canDrag = false;
        return (
          <Group
            key={group.id}
            draggable={canDrag}
            onDragEnd={(e) => {
              if (!canDrag) return;
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
                currentMode === 'edit' && (editTargetType === '柱' || editTargetType === 'ハネ') && part.type === '柱';
              const highlightPillarBlue =
                currentMode === 'edit' && editTargetType === 'ブラケット' && part.type === '柱';
              const isSelected = selectedScaffoldPartKeys.includes(`${group.id}:${part.id}`);
              const isPillarHighlighted = highlightPillarYellow || highlightPillarBlue || isSelected;
              switch (part.type) {
                case '梁枠': {
                  // 確定済みの梁枠（数量表の自動集計対象）
                  const qty = Number(part.meta?.quantity ?? 1);
                  const showLabel = currentMode === 'edit' && editTargetType === '梁枠' && qty > 1;
                  return (
                    <Group
                      key={part.id}
                      onMouseEnter={(e) => {
                        if (currentMode === 'edit' && editTargetType === '梁枠') {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'pointer';
                          setHoveredBeamFrame({ groupId: group.id, partId: part.id });
                        }
                      }}
                      onMouseLeave={(e) => {
                        const stage = e.target.getStage?.();
                        if (stage) stage.container().style.cursor = 'default';
                        setHoveredBeamFrame((cur) => (cur && cur.partId === part.id ? null : cur));
                      }}
                    >
                      {/* 数量表示（×2 など）。qty>1 のときのみ表示 */}
                      {showLabel && (
                        <Text
                          x={part.position.x}
                          y={part.position.y}
                          text={`×${qty}`}
                          fontSize={12}
                          fill={isDark ? '#FFFFFF' : '#000000'}
                        />
                      )}
                      {/* クリック領域（透明） */}
                      <Circle x={part.position.x} y={part.position.y} radius={18 * invScale} fill={'rgba(0,0,0,0)'} listening={true} />
                    </Group>
                  );
                }
                case '柱':
                  return (
                    <Group
                      key={part.id}
                      onClick={(e) => {
                        // ビューモードでは編集を無効化
                        if (currentMode === 'view') {
                          e.cancelBubble = true;
                          return;
                        }
                        // ブラケット編集時
                        if (currentMode === 'edit' && editTargetType === 'ブラケット') {
                          e.cancelBubble = true;
                          // 選択系モード（select/lasso/bulk）では、青色発光中の柱を複数選択できるようトグルにする
                          // → Enterで方向・寸法カード（複数用）を開く挙動に繋げる
                          if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            useDrawingStore.getState().setBulkAntiAction?.('quantity');
                            return;
                          }
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
                        // ハネ編集時
                        if (currentMode === 'edit' && editTargetType === 'ハネ') {
                          e.cancelBubble = true;
                          // 選択/投げ縄/一括モードでは選択トグル
                          if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            return;
                          }
                          // 非選択モード時は単体カードを表示
                          onHaneConfigClick?.({
                            anchor: { x: part.position.x, y: part.position.y },
                            groupId: group.id,
                            partId: part.id,
                          });
                          return;
                        }
                        // 編集モードで柱が対象のときのみクリックを処理
                        if (!(currentMode === 'edit' && editTargetType === '柱')) return;
                        e.cancelBubble = true; // 親のドラッグ等へバブルさせない
                        // 選択/投げ縄/一括モードでは選択トグル
                        if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                          toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                          return;
                        }
                        // 既存: 単体編集ポップ
                        onPillarClick?.({
                          anchor: { x: part.position.x, y: part.position.y },
                          groupId: group.id,
                          partId: part.id,
                        });
                      }}
                      onTap={(e) => {
                        // ビューモードでは編集を無効化
                        if (currentMode === 'view') {
                          e.cancelBubble = true;
                          return;
                        }
                        // ハネ編集時
                        if (currentMode === 'edit' && editTargetType === 'ハネ') {
                          e.cancelBubble = true;
                          if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            return;
                          }
                          onHaneConfigClick?.({
                            anchor: { x: part.position.x, y: part.position.y },
                            groupId: group.id,
                            partId: part.id,
                          });
                          return;
                        }
                        // ブラケット編集時
                        if (currentMode === 'edit' && editTargetType === 'ブラケット') {
                          e.cancelBubble = true;
                          // 選択系モード（select/lasso/bulk）では、青色発光中の柱を複数選択できるようトグルにする
                          if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            return;
                          }
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
                        if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                          toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                          return;
                        }
                        onPillarClick?.({
                          anchor: { x: part.position.x, y: part.position.y },
                          groupId: group.id,
                          partId: part.id,
                        });
                      }}
                      onMouseEnter={(e) => {
                        if (currentMode === 'view') {
                          // ビューモード: 情報カードを表示
                          const stage = e.target.getStage();
                          if (stage) {
                            const container = stage.container();
                            const rect = container.getBoundingClientRect();
                            const screenX = (part.position.x * canvasScale + canvasPosition.x) + rect.left;
                            const screenY = (part.position.y * canvasScale + canvasPosition.y) + rect.top;
                            setHoveredViewPart({
                              groupId: group.id,
                              partId: part.id,
                              screenPosition: { x: screenX, y: screenY },
                            });
                            onViewPartHover?.({
                              groupId: group.id,
                              partId: part.id,
                              screenPosition: { x: screenX, y: screenY },
                            });
                            container.style.cursor = 'default';
                          }
                        } else if (currentMode === 'edit' && (editTargetType === '柱' || editTargetType === 'ブラケット')) {
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
                        if (currentMode === 'view') {
                          setHoveredViewPart((h) => (h && h.partId === part.id ? null : h));
                          onViewPartHover?.(null);
                        }
                      }}
                    >
                      {/* ビューモード時の数量未確定発光（赤色） */}
                      {currentMode === 'view' && !isQuantityConfirmed(part) && (() => {
                        const anchor = { x: part.position.x, y: part.position.y };
                        const rScale = getRadiusScale(part.id, anchor);
                        const opGrad = getPulseOpacity(0.9, part.id, anchor);
                        const opRing = getPulseOpacity(0.95, part.id, anchor);
                        return (
                          <>
                            {/* 赤色の放射グロー */}
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
                                'rgba(239,68,68,0.95)',
                                1,
                                'rgba(239,68,68,0)',
                              ]}
                              opacity={opGrad}
                              globalCompositeOperation="lighter"
                            />
                            {/* 赤色の外周リング */}
                            <Circle
                              x={part.position.x}
                              y={part.position.y}
                              radius={GLOW.ringRadius * rScale}
                              stroke="#EF4444"
                              strokeWidth={GLOW.ringStroke}
                              opacity={opRing}
                              shadowColor="#EF4444"
                              shadowBlur={GLOW.shadowBlur}
                              shadowOpacity={0.9}
                              globalCompositeOperation="lighter"
                              listening={false}
                            />
                          </>
                        );
                      })()}
                      {/* 発光レイヤー（控えめ・ズーム追従） */}
                      {isPillarHighlighted && (() => {
                        const anchor = { x: part.position.x, y: part.position.y };
                        const confirmed = isQuantityConfirmed(part);
                        const rScale = confirmed ? 1 : getRadiusScale(part.id, anchor);
                        const opGrad = confirmed ? 0.9 : getPulseOpacity(0.9, part.id, anchor);
                        const opRing = confirmed ? 0.95 : getPulseOpacity(0.95, part.id, anchor);
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
                          {/* 選択時の強調リング（シアン） */}
                          {isSelected && (
                            <Circle
                              x={part.position.x}
                              y={part.position.y}
                              radius={GLOW.ringRadius * 1.2 * rScale}
                              stroke={'#06B6D4'}
                              strokeWidth={Math.max(1, GLOW.ringStroke * 0.8)}
                              opacity={0.95}
                              listening={false}
                              globalCompositeOperation="lighter"
                            />
                          )}
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
                  const isSelectedCloth = selectedScaffoldPartKeys.includes(`${group.id}:${part.id}`);
                  return (
                    <Group key={part.id}>
                      {/* ビューモード時の数量未確定発光（赤色） */}
                      {currentMode === 'view' && !isQuantityConfirmed(part) && (() => {
                        const anchor = { x: midX, y: midY };
                        const op = getPulseOpacity(0.9, part.id, anchor);
                        return (
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke="#EF4444"
                            strokeWidth={CLOTH_GLOW.glowWidth}
                            opacity={op}
                            shadowColor="#EF4444"
                            shadowBlur={CLOTH_GLOW.shadowBlur}
                            shadowOpacity={0.95}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        );
                      })()}
                      {/* 発光下地（太めのイエロー、加算合成） */}
                      {highlightClothLine && (() => {
                        const anchor = { x: (part.position.x + x2) / 2, y: (part.position.y + y2) / 2 };
                        const op = isQuantityConfirmed(part) ? 0.9 : getPulseOpacity(0.9, part.id, anchor);
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
                      {/* 本体ライン（確定済みは点線描画） */}
                      <Line
                        points={[part.position.x, part.position.y, x2, y2]}
                        stroke={stroke}
                        strokeWidth={2}
                        dash={part.meta?.lineStyle === 'dashed' ? [6 * invScale, 6 * invScale] : undefined}
                        shadowColor={highlightClothLine ? highlightStroke : undefined}
                        shadowBlur={highlightClothLine ? CLOTH_GLOW.shadowBlur * 0.6 : 0}
                        shadowOpacity={highlightClothLine ? 0.7 : 0}
                        onMouseEnter={(e) => {
                          if (currentMode === 'view') {
                            // ビューモード: 情報カードを表示
                            const stage = e.target.getStage();
                            if (stage) {
                              const container = stage.container();
                              const rect = container.getBoundingClientRect();
                              const screenX = (midX * canvasScale + canvasPosition.x) + rect.left;
                              const screenY = (midY * canvasScale + canvasPosition.y) + rect.top;
                              setHoveredViewPart({
                                groupId: group.id,
                                partId: part.id,
                                screenPosition: { x: screenX, y: screenY },
                              });
                              onViewPartHover?.({
                                groupId: group.id,
                                partId: part.id,
                                screenPosition: { x: screenX, y: screenY },
                              });
                              container.style.cursor = 'default';
                            }
                          } else if (currentMode === 'edit' && (editTargetType === '布材' || editTargetType === '階段')) {
                            // 布材編集時 or 階段編集時の黄色発光領域はクリックしやすいように手のカーソルに
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'default';
                          if (currentMode === 'view') {
                            setHoveredViewPart((h) => (h && h.partId === part.id ? null : h));
                            onViewPartHover?.(null);
                          }
                        }}
                        onClick={(e) => {
                          // ビューモードでは編集を無効化
                          if (currentMode === 'view') {
                            e.cancelBubble = true;
                            return;
                          }
                          // 布材編集 or 階段編集
                          if (!(currentMode === 'edit' && (editTargetType === '布材' || editTargetType === '階段'))) return;
                          e.cancelBubble = true;
                          // 選択モード時（select/lasso/bulk）かつ黄色発光対象なら選択トグル（布材編集時のみ）
                          if (editTargetType === '布材' && (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') && highlightClothLine) {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            return;
                          }
                          const args = { anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id } as const;
                          if (editTargetType === '布材') onClothClick?.(args); else onStairClick?.(args);
                        }}
                        onTap={(e) => {
                          // ビューモードでは編集を無効化
                          if (currentMode === 'view') {
                            e.cancelBubble = true;
                            return;
                          }
                          if (!(currentMode === 'edit' && (editTargetType === '布材' || editTargetType === '階段'))) return;
                          e.cancelBubble = true;
                          if (editTargetType === '布材' && (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') && highlightClothLine) {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            return;
                          }
                          const args = { anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id } as const;
                          if (editTargetType === '布材') onClothClick?.(args); else onStairClick?.(args);
                        }}
                      />
                      {/* 選択時の強調ライン（シアン） */}
                      {currentMode === 'edit' && editTargetType === '布材' && isSelectedCloth && (
                        <>
                          {/* 選択ハイライトのシアン発光（太めの下地） */}
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke={'#06B6D4'}
                            strokeWidth={Math.max(CLOTH_GLOW.glowWidth * 0.75, 10 * invScale)}
                            opacity={0.55}
                            shadowColor={'#06B6D4'}
                            shadowBlur={CLOTH_GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            lineCap="round"
                            lineJoin="round"
                            listening={false}
                            globalCompositeOperation="lighter"
                          />
                          {/* 選択ハイライトのシアン実線（細めの芯） */}
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke={'#06B6D4'}
                            strokeWidth={Math.max(3.5, 4 * invScale)}
                            opacity={0.98}
                            shadowColor={'#06B6D4'}
                            shadowBlur={CLOTH_GLOW.shadowBlur * 0.6}
                            shadowOpacity={0.95}
                            lineCap="round"
                            lineJoin="round"
                            listening={false}
                            globalCompositeOperation="lighter"
                          />
                        </>
                      )}
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
                      {/* 階段編集時の緑色発光部分のクリック領域（最前面に配置、緑色発光部分全域をカバー） */}
                      {highlightStairOpposite600 && (
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
                        const confirmed = isQuantityConfirmed(part);
                        const rScale = confirmed ? 1 : getRadiusScale(part.id + '-mid', anchor);
                        const opGrad = confirmed ? 0.95 : getPulseOpacity(0.95, part.id + '-mid', anchor);
                        const opRing = confirmed ? 0.95 : getPulseOpacity(0.95, part.id + '-mid', anchor);
                        const opCore = confirmed ? 0.9 : getPulseOpacity(0.9, part.id + '-mid', anchor);
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
                  const isSelectedBracket = selectedScaffoldPartKeys.includes(`${group.id}:${part.id}`);
                  return (
                    <Group key={part.id}>
                      {/* ビューモード時の数量未確定発光（赤色） */}
                      {currentMode === 'view' && !isQuantityConfirmed(part) && (() => {
                        const anchor = { x: (part.position.x + x2) / 2, y: (part.position.y + y2) / 2 };
                        const op = getPulseOpacity(0.9, part.id, anchor);
                        return (
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke="#EF4444"
                            strokeWidth={BRACKET_GLOW.glowWidth}
                            opacity={op}
                            shadowColor="#EF4444"
                            shadowBlur={BRACKET_GLOW.shadowBlur}
                            shadowOpacity={0.95}
                            globalCompositeOperation="lighter"
                            listening={false}
                          />
                        );
                      })()}
                      {/* ブラケットラインの黄色発光（編集対象がブラケットのとき） */}
                      {highlightBracketLine && (() => {
                        const anchor = { x: (part.position.x + x2) / 2, y: (part.position.y + y2) / 2 };
                        const confirmed = isQuantityConfirmed(part);
                        const op = confirmed ? 0.9 : getPulseOpacity(0.9, part.id, anchor);
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
                        const confirmed = isQuantityConfirmed(part);
                        const rScale = confirmed ? 1 : getRadiusScale(part.id + '-tip', anchor);
                        const opGrad = confirmed ? 0.95 : getPulseOpacity(0.95, part.id + '-tip', anchor);
                        const opRing = confirmed ? 0.95 : getPulseOpacity(0.95, part.id + '-tip', anchor);
                        const opCore = confirmed ? 0.9 : getPulseOpacity(0.9, part.id + '-tip', anchor);
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
                          if (currentMode === 'view') {
                            // ビューモード: 情報カードを表示
                            const stage = e.target.getStage();
                            if (stage) {
                              const container = stage.container();
                              const rect = container.getBoundingClientRect();
                              const midX = (part.position.x + x2) / 2;
                              const midY = (part.position.y + y2) / 2;
                              const screenX = (midX * canvasScale + canvasPosition.x) + rect.left;
                              const screenY = (midY * canvasScale + canvasPosition.y) + rect.top;
                              setHoveredViewPart({
                                groupId: group.id,
                                partId: part.id,
                                screenPosition: { x: screenX, y: screenY },
                              });
                              onViewPartHover?.({
                                groupId: group.id,
                                partId: part.id,
                                screenPosition: { x: screenX, y: screenY },
                              });
                              container.style.cursor = 'default';
                            }
                          } else if (currentMode === 'edit' && editTargetType === 'ブラケット') {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'default';
                          if (currentMode === 'view') {
                            setHoveredViewPart((h) => (h && h.partId === part.id ? null : h));
                            onViewPartHover?.(null);
                          }
                        }}
                        onClick={(e) => {
                          // ビューモードでは編集を無効化
                          if (currentMode === 'view') {
                            e.cancelBubble = true;
                            return;
                          }
                          // ブラケット編集時のみカードを出す
                          if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                          e.cancelBubble = true;
                          // 選択モード時は黄色発光中（highlightBracketLine）のみ選択トグル
                          if ((editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') && highlightBracketLine) {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            return;
                          }
                          const midX = (part.position.x + x2) / 2;
                          const midY = (part.position.y + y2) / 2;
                          onBracketClick?.({
                            anchor: { x: midX, y: midY },
                            groupId: group.id,
                            partId: part.id,
                          });
                        }}
                        onTap={(e) => {
                          // ビューモードでは編集を無効化
                          if (currentMode === 'view') {
                            e.cancelBubble = true;
                            return;
                          }
                          if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                          e.cancelBubble = true;
                          if ((editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') && highlightBracketLine) {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            return;
                          }
                          const midX = (part.position.x + x2) / 2;
                          const midY = (part.position.y + y2) / 2;
                          onBracketClick?.({
                            anchor: { x: midX, y: midY },
                            groupId: group.id,
                            partId: part.id,
                          });
                        }}
                      />
                      {/* ブラケット: 黄色発光上の選択専用ヒット領域（透明・太線） */}
                      {currentMode === 'edit' && editTargetType === 'ブラケット' && highlightBracketLine && (
                        <Line
                          points={[part.position.x, part.position.y, x2, y2]}
                          stroke="rgba(0,0,0,0)"
                          strokeWidth={Math.max(BRACKET_GLOW.glowWidth + 8, 20 * invScale)}
                          listening={true}
                          lineCap="round"
                          lineJoin="round"
                          onMouseEnter={(e) => {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
                          }}
                          onMouseLeave={(e) => {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'default';
                          }}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                          }}
                          onTap={(e) => {
                            e.cancelBubble = true;
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                          }}
                        />
                      )}
                      {/* 選択時の強調シアンライン */}
                      {currentMode === 'edit' && editTargetType === 'ブラケット' && isSelectedBracket && (
                        <>
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke={'#06B6D4'}
                            strokeWidth={Math.max(BRACKET_GLOW.glowWidth * 0.75, 10 * invScale)}
                            opacity={0.55}
                            shadowColor={'#06B6D4'}
                            shadowBlur={BRACKET_GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            lineCap="round"
                            lineJoin="round"
                            listening={false}
                            globalCompositeOperation="lighter"
                          />
                          <Line
                            points={[part.position.x, part.position.y, x2, y2]}
                            stroke={'#06B6D4'}
                            strokeWidth={Math.max(3.5, 4 * invScale)}
                            opacity={0.98}
                            shadowColor={'#06B6D4'}
                            shadowBlur={BRACKET_GLOW.shadowBlur * 0.6}
                            shadowOpacity={0.95}
                            lineCap="round"
                            lineJoin="round"
                            listening={false}
                            globalCompositeOperation="lighter"
                          />
                        </>
                      )}
                      {/* ブラケット編集時のクリック領域（最前面に配置、アンチと重なってもクリック可能） */}
                      {highlightBracketLine && (
                        <Line
                          points={[part.position.x, part.position.y, x2, y2]}
                          stroke="rgba(0,0,0,0)"
                          strokeWidth={Math.max(BRACKET_GLOW.glowWidth + 8, 20 * invScale)}
                          listening={true}
                          onClick={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                            // クリック位置（ステージ座標）を取得
                            const stage = e.target.getStage?.();
                            const ptr = stage?.getPointerPosition();
                            const nearBase = (() => {
                              if (!ptr) return false;
                              const dx = ptr.x - part.position.x;
                              const dy = ptr.y - part.position.y;
                              const dist = Math.hypot(dx, dy);
                              return dist <= Math.max(16 * invScale, 12);
                            })();
                            e.cancelBubble = true;
                            if (nearBase) {
                              // 柱の近傍クリックは柱の選択/単体カード表示を優先
                              const pillarAtBase = group.parts.find(
                                (pp) =>
                                  pp.type === '柱' &&
                                  Math.abs(pp.position.x - part.position.x) < 1 &&
                                  Math.abs(pp.position.y - part.position.y) < 1
                              );
                              if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                                if (pillarAtBase) toggleSelectScaffoldPart(`${group.id}:${pillarAtBase.id}`);
                                return;
                              }
                              // 選択モード解除時は方向・寸法カード（単体）を表示
                              onBracketConfigClick?.({ anchor: { x: part.position.x, y: part.position.y }, groupId: group.id, partId: part.id });
                              return;
                            }
                            // 近傍でない → 従来通り（選択モード: ブラケット選択 / 非選択モード: 数量カード）
                            if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                              toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                              return;
                            }
                            const midX = (part.position.x + x2) / 2;
                            const midY = (part.position.y + y2) / 2;
                            onBracketClick?.({ anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id });
                          }}
                          onTap={(e) => {
                            if (!(currentMode === 'edit' && editTargetType === 'ブラケット')) return;
                            const stage = e.target.getStage?.();
                            const ptr = stage?.getPointerPosition();
                            const nearBase = (() => {
                              if (!ptr) return false;
                              const dx = ptr.x - part.position.x;
                              const dy = ptr.y - part.position.y;
                              const dist = Math.hypot(dx, dy);
                              return dist <= Math.max(16 * invScale, 12);
                            })();
                            e.cancelBubble = true;
                            if (nearBase) {
                              const pillarAtBase = group.parts.find(
                                (pp) =>
                                  pp.type === '柱' &&
                                  Math.abs(pp.position.x - part.position.x) < 1 &&
                                  Math.abs(pp.position.y - part.position.y) < 1
                              );
                              if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                                if (pillarAtBase) toggleSelectScaffoldPart(`${group.id}:${pillarAtBase.id}`);
                                return;
                              }
                              onBracketConfigClick?.({ anchor: { x: part.position.x, y: part.position.y }, groupId: group.id, partId: part.id });
                              return;
                            }
                            if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                              toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                              return;
                            }
                            const midX = (part.position.x + x2) / 2;
                            const midY = (part.position.y + y2) / 2;
                            onBracketClick?.({ anchor: { x: midX, y: midY }, groupId: group.id, partId: part.id });
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

                      {/* 基部クリック専用オーバーレイ: ブラケット編集時は柱優先のクリック領域を最前面に追加 */}
                      {currentMode === 'edit' && editTargetType === 'ブラケット' && (
                        <Circle
                          x={part.position.x}
                          y={part.position.y}
                          radius={Math.max(16 * invScale, 12)}
                          fill={'rgba(0,0,0,0)'}
                          listening={true}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            const pillarAtBase = group.parts.find(
                              (pp) =>
                                pp.type === '柱' &&
                                Math.abs(pp.position.x - part.position.x) < 1 &&
                                Math.abs(pp.position.y - part.position.y) < 1
                            );
                            if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                              if (pillarAtBase) toggleSelectScaffoldPart(`${group.id}:${pillarAtBase.id}`);
                              return;
                            }
                            onBracketConfigClick?.({ anchor: { x: part.position.x, y: part.position.y }, groupId: group.id, partId: part.id });
                          }}
                          onTap={(e) => {
                            e.cancelBubble = true;
                            const pillarAtBase = group.parts.find(
                              (pp) =>
                                pp.type === '柱' &&
                                Math.abs(pp.position.x - part.position.x) < 1 &&
                                Math.abs(pp.position.y - part.position.y) < 1
                            );
                            if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                              if (pillarAtBase) toggleSelectScaffoldPart(`${group.id}:${pillarAtBase.id}`);
                              return;
                            }
                            onBracketConfigClick?.({ anchor: { x: part.position.x, y: part.position.y }, groupId: group.id, partId: part.id });
                          }}
                          onMouseEnter={(e) => {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
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
                  const isSelectedAnti = selectedScaffoldPartKeys.includes(`${group.id}:${part.id}`);
                  // Rectのpositionは左上なので、中心基準にするためoffsetを設定
                  return (
                    <Group key={part.id}>
                      {/* ビューモード時の数量未確定発光（赤色） */}
                      {currentMode === 'view' && !isQuantityConfirmed(part) && (
                        <Rect
                          x={part.position.x}
                          y={part.position.y}
                          width={lengthPx}
                          height={widthPx}
                          offsetX={lengthPx / 2}
                          offsetY={widthPx / 2}
                          rotation={angle}
                          stroke={'#EF4444'}
                          strokeWidth={ANTI_GLOW.ringStroke}
                          opacity={getPulseOpacity(0.95, part.id, { x: part.position.x, y: part.position.y })}
                          shadowColor={'#EF4444'}
                          shadowBlur={ANTI_GLOW.shadowBlur}
                          shadowOpacity={0.95}
                          globalCompositeOperation="lighter"
                          listening={false}
                          cornerRadius={2}
                        />
                      )}
                      {/* アンチの黄色発光（枠の外周・加算合成） */}
                      {highlightAnti ? (
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
                          opacity={getPulseOpacity(0.95, part.id, { x: part.position.x, y: part.position.y })}
                          shadowColor={'#FACC15'}
                          shadowBlur={ANTI_GLOW.shadowBlur}
                          shadowOpacity={0.95}
                          globalCompositeOperation="lighter"
                          listening={false}
                          cornerRadius={2}
                        />
                      ) : null}
                      {/* 選択時の強調シアン（下地＋芯の2段） */}
                      {currentMode === 'edit' && editTargetType === 'アンチ' && isSelectedAnti && (useDrawingStore.getState().bulkAntiAction !== 'level') && (
                        <>
                          <Rect
                            x={part.position.x}
                            y={part.position.y}
                            width={lengthPx}
                            height={widthPx}
                            offsetX={lengthPx / 2}
                            offsetY={widthPx / 2}
                            rotation={angle}
                            stroke={'#06B6D4'}
                            strokeWidth={Math.max(ANTI_GLOW.ringStroke * 0.75, 10 * invScale)}
                            opacity={0.55}
                            shadowColor={'#06B6D4'}
                            shadowBlur={ANTI_GLOW.shadowBlur}
                            shadowOpacity={0.9}
                            listening={false}
                            globalCompositeOperation="lighter"
                            cornerRadius={2}
                          />
                          <Rect
                            x={part.position.x}
                            y={part.position.y}
                            width={lengthPx}
                            height={widthPx}
                            offsetX={lengthPx / 2}
                            offsetY={widthPx / 2}
                            rotation={angle}
                            stroke={'#06B6D4'}
                            strokeWidth={Math.max(3.5, 4 * invScale)}
                            opacity={0.98}
                            shadowColor={'#06B6D4'}
                            shadowBlur={ANTI_GLOW.shadowBlur * 0.6}
                            shadowOpacity={0.95}
                            listening={false}
                            globalCompositeOperation="lighter"
                            cornerRadius={2}
                          />
                        </>
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
                        // アンチの基礎矩形は、ビューモードとアンチ編集時のみポインターイベントを受け付ける
                        // ブラケット編集時など他編集モードでは underlying（ブラケット）のクリックを通すために無効化
                        listening={currentMode === 'view' || (currentMode === 'edit' && editTargetType === 'アンチ')}
                        onMouseEnter={(e) => {
                          if (currentMode === 'view') {
                            // ビューモード: 情報カードを表示
                            const stage = e.target.getStage();
                            if (stage) {
                              const container = stage.container();
                              const rect = container.getBoundingClientRect();
                              const screenX = (part.position.x * canvasScale + canvasPosition.x) + rect.left;
                              const screenY = (part.position.y * canvasScale + canvasPosition.y) + rect.top;
                              setHoveredViewPart({
                                groupId: group.id,
                                partId: part.id,
                                screenPosition: { x: screenX, y: screenY },
                              });
                              onViewPartHover?.({
                                groupId: group.id,
                                partId: part.id,
                                screenPosition: { x: screenX, y: screenY },
                              });
                              container.style.cursor = 'default';
                            }
                          } else if (currentMode === 'edit' && editTargetType === 'アンチ') {
                            const stage = e.target.getStage?.();
                            if (stage) stage.container().style.cursor = 'pointer';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const stage = e.target.getStage?.();
                          if (stage) stage.container().style.cursor = 'default';
                          if (currentMode === 'view') {
                            setHoveredViewPart((h) => (h && h.partId === part.id ? null : h));
                            onViewPartHover?.(null);
                          }
                        }}
                        onClick={(e) => {
                          // ビューモードでは編集を無効化
                          if (currentMode === 'view') {
                            e.cancelBubble = true;
                            return;
                          }
                          // アンチ編集時のみカードを出す
                          if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                          e.cancelBubble = true;
                          // 青色発光（中心）近傍は黄色選択を抑止
                          try {
                            const stage = e.target.getStage?.();
                            const ptr = stage?.getPointerPosition();
                            if (ptr) {
                              const canvasPos = { x: (ptr.x - canvasPosition.x) / canvasScale, y: (ptr.y - canvasPosition.y) / canvasScale };
                              const dx = canvasPos.x - part.position.x;
                              const dy = canvasPos.y - part.position.y;
                              const dist = Math.sqrt(dx * dx + dy * dy);
                              const glowR = ANTI_MID_GLOW.gradRadius * getRadiusScale(part.id + '-anti-mid', { x: part.position.x, y: part.position.y });
                              if (dist <= glowR) return; // 中心はスルー（青用）
                            }
                          } catch {}
                          if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            useDrawingStore.getState().setBulkAntiAction?.('quantity');
                            return;
                          }
                          onAntiClick?.({ anchor: { x: part.position.x, y: part.position.y }, groupId: group.id, partId: part.id });
                        }}
                        onTap={(e) => {
                          // ビューモードでは編集を無効化
                          if (currentMode === 'view') {
                            e.cancelBubble = true;
                            return;
                          }
                          if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                          e.cancelBubble = true;
                          if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                            // 青色発光（中心）近傍は黄色選択を抑止
                            try {
                              const stage = e.target.getStage?.();
                              const ptr = stage?.getPointerPosition();
                              if (ptr) {
                                const canvasPos = { x: (ptr.x - canvasPosition.x) / canvasScale, y: (ptr.y - canvasPosition.y) / canvasScale };
                                const dx = canvasPos.x - part.position.x;
                                const dy = canvasPos.y - part.position.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                const glowR = ANTI_MID_GLOW.gradRadius * getRadiusScale(part.id + '-anti-mid', { x: part.position.x, y: part.position.y });
                                if (dist <= glowR) return; // 中心はスルー（青用）
                              }
                            } catch {}
                            toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                            useDrawingStore.getState().setBulkAntiAction?.('quantity');
                            return;
                          }
                          onAntiClick?.({ anchor: { x: part.position.x, y: part.position.y }, groupId: group.id, partId: part.id });
                        }}
                      />
                      {/* クリック領域（透明、矩形全体をカバー、ただし青色発光部分は除外） */}
                      {highlightAnti ? (
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
                            // ビューモードでは編集を無効化
                            if (currentMode === 'view') {
                              e.cancelBubble = true;
                              return;
                            }
                            if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                            // 選択系モードではトグル選択に切替
                            if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                              e.cancelBubble = true;
                              toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                              useDrawingStore.getState().setBulkAntiAction?.('quantity');
                              return;
                            }
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
                            // ビューモードでは編集を無効化
                            if (currentMode === 'view') {
                              e.cancelBubble = true;
                              return;
                            }
                            if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                            if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                              e.cancelBubble = true;
                              toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                              useDrawingStore.getState().setBulkAntiAction?.('quantity');
                              return;
                            }
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
                      ) : null}
                      {/* アンチの中点に青色発光○（中心はpart.position） */}
                      {highlightAnti && (() => {
                        const anchor = { x: part.position.x, y: part.position.y };
                        const confirmed = isQuantityConfirmed(part);
                        const rScale = confirmed ? 1 : getRadiusScale(part.id + '-anti-mid', anchor);
                        const opGrad = confirmed ? 0.95 : getPulseOpacity(0.95, part.id + '-anti-mid', anchor);
                        const opRing = confirmed ? 0.95 : getPulseOpacity(0.95, part.id + '-anti-mid', anchor);
                        const opCore = confirmed ? 0.9 : getPulseOpacity(0.9, part.id + '-anti-mid', anchor);
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
                            {/* 選択時のシアンリング（青色発光の上に重ねて見せる） */}
                            {currentMode === 'edit' && editTargetType === 'アンチ' && isSelectedAnti && (useDrawingStore.getState().bulkAntiAction === 'level') && (
                              <>
                                <Circle
                                  x={part.position.x}
                                  y={part.position.y}
                                  radius={ANTI_MID_GLOW.ringRadius * 1.25 * rScale}
                                  stroke={'#06B6D4'}
                                  strokeWidth={Math.max(2, ANTI_MID_GLOW.ringStroke * 0.9)}
                                  opacity={0.95}
                                  shadowColor={'#06B6D4'}
                                  shadowBlur={ANTI_MID_GLOW.shadowBlur}
                                  shadowOpacity={0.9}
                                  globalCompositeOperation="lighter"
                                  listening={false}
                                />
                                <Circle
                                  x={part.position.x}
                                  y={part.position.y}
                                  radius={Math.max(ANTI_MID_GLOW.coreRadius * 1.2 * rScale, 4)}
                                  stroke={'#06B6D4'}
                                  strokeWidth={2}
                                  opacity={0.98}
                                  shadowColor={'#06B6D4'}
                                  shadowBlur={ANTI_MID_GLOW.shadowBlur * 0.6}
                                  shadowOpacity={0.95}
                                  globalCompositeOperation="lighter"
                                  listening={false}
                                />
                              </>
                            )}
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
                                // 選択モード中は段数用の選択トグル（青色発光選択）
                                if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                                  useDrawingStore.getState().setBulkAntiAction?.('level');
                                  toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                                  return;
                                }
                                onAntiLevelClick?.({
                                  anchor: { x: part.position.x, y: part.position.y },
                                  groupId: group.id,
                                  partId: part.id,
                                });
                              }}
                              onTap={(e) => {
                                if (!(currentMode === 'edit' && editTargetType === 'アンチ')) return;
                                e.cancelBubble = true;
                                if (editSelectionMode === 'select' || editSelectionMode === 'lasso' || editSelectionMode === 'bulk') {
                                  useDrawingStore.getState().setBulkAntiAction?.('level');
                                  toggleSelectScaffoldPart(`${group.id}:${part.id}`);
                                  return;
                                }
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

            {/* 梁枠編集: パターン領域のクリックオーバーレイ＋選択表示（点線・三角） */}
            {(() => {
              if (!(currentMode === 'edit' && editTargetType === '梁枠')) return null;
              // 1) パターン検出（1800,1800 / 1800,1800,1800 / 1800,900 or 900,1800）
              type FrameMatch = { start: number; length: number; name: 'P2_1800_1800' | 'P3_1800_1800_1800' | 'P2_1800_900' | 'P2_900_1800' };
              const frameCloths = group.parts
                .filter((p) => p.type === '布材' && p.meta?.lineStyle !== 'dashed')
                .sort((a, b) => (a.meta?.offsetMm ?? 0) - (b.meta?.offsetMm ?? 0));
              const matches: FrameMatch[] = [];
              for (let i = 0; i < frameCloths.length; i++) {
                const l0 = frameCloths[i]?.meta?.length ?? 0;
                const l1 = frameCloths[i + 1]?.meta?.length ?? 0;
                const l2 = frameCloths[i + 2]?.meta?.length ?? 0;
                if (i + 1 < frameCloths.length && l0 === 1800 && l1 === 1800) matches.push({ start: i, length: 2, name: 'P2_1800_1800' });
                if (i + 2 < frameCloths.length && l0 === 1800 && l1 === 1800 && l2 === 1800) matches.push({ start: i, length: 3, name: 'P3_1800_1800_1800' });
                if (i + 1 < frameCloths.length && l0 === 1800 && l1 === 900) matches.push({ start: i, length: 2, name: 'P2_1800_900' });
                if (i + 1 < frameCloths.length && l0 === 900 && l1 === 1800) matches.push({ start: i, length: 2, name: 'P2_900_1800' });
              }
              if (matches.length === 0) return null;

              // 2) 重複マッチを一つの領域にグルーピング
              type FrameGroup = {
                key: string;
                rangeStartMm: number;
                rangeEndMm: number;
                startPos: { x: number; y: number };
                endPos: { x: number; y: number };
                matches: FrameMatch[];
              };
              const toInterval = (m: FrameMatch) => {
                const first = frameCloths[m.start];
                const last = frameCloths[m.start + m.length - 1];
                const startMm = Number(first?.meta?.offsetMm ?? 0);
                const endMm = Number(last?.meta?.offsetMm ?? 0) + Number(last?.meta?.length ?? 0);
                const dirVec = typeof last?.meta?.direction === 'number' ? degToUnitVector(Number(last?.meta?.direction)) : t;
                const lenPx = mmToPx(Number(last?.meta?.length ?? 0), DEFAULT_SCALE);
                const startPos = { x: first.position.x, y: first.position.y };
                const endPos = { x: last.position.x + dirVec.x * lenPx, y: last.position.y + dirVec.y * lenPx };
                return { startMm, endMm, startPos, endPos, m };
              };
              const ivs = matches.map(toInterval).sort((a, b) => (a.startMm === b.startMm ? a.endMm - b.endMm : a.startMm - b.startMm));
              const groups: FrameGroup[] = [];
              let cur: typeof ivs = [];
              const flush = () => {
                if (!cur.length) return;
                const startMm = Math.min(...cur.map((c) => c.startMm));
                const endMm = Math.max(...cur.map((c) => c.endMm));
                const first = cur[0];
                const last = cur.reduce((p, c) => (c.endMm >= p.endMm ? c : p), cur[0]);
                // 安定キー: 先頭布材ID-末尾布材ID
                const firstId = frameCloths[first.m.start]?.id ?? `s${startMm}`;
                const lastId = frameCloths[last.m.start + last.m.length - 1]?.id ?? `e${endMm}`;
                const key = `${group.id}|${firstId}-${lastId}`;
                groups.push({ key, rangeStartMm: startMm, rangeEndMm: endMm, startPos: first.startPos, endPos: last.endPos, matches: cur.map((c) => c.m) });
                cur = [];
              };
              for (const iv of ivs) {
                if (!cur.length) cur.push(iv);
                else {
                  const lastEnd = Math.max(...cur.map((c) => c.endMm));
                  if (iv.startMm <= lastEnd) cur.push(iv);
                  else {
                    flush();
                    cur.push(iv);
                  }
                }
              }
              flush();

              // 3) レンダリング（クリック切替＋視覚強調）
              const dashLen = 8 * invScale;
              return (
                <>
                  {groups.map((fg) => {
                    const k = fg.key;
                    const sel = Math.max(0, Math.min(frameSelection[k] ?? 0, fg.matches.length - 1));
                    const active = fg.matches[sel];
                    const showHover = hoveredFrameKey === k;
                    // 間柱（三角）の描画用ユーティリティ（±1mm でマッチ）
                    const triangles: React.ReactNode[] = [];
                    const first = frameCloths[active.start];
                    let offMm = Number(first?.meta?.offsetMm ?? 0);
                    for (let i = 1; i <= active.length - 1; i++) {
                      const prev = frameCloths[active.start + i - 1];
                      const len = Number(prev?.meta?.length ?? 0);
                      const boundaryMm = offMm + len;
                      offMm = boundaryMm;
                      const pillar = group.parts.find(
                        (p) => p.type === '柱' && Math.abs((Number(p.meta?.offsetMm ?? 1e9)) - boundaryMm) <= 1
                      );
                      if (pillar) {
                        triangles.push(
                          <RegularPolygon
                            key={`tri-${k}-${boundaryMm}`}
                            x={pillar.position.x}
                            y={pillar.position.y}
                            sides={3}
                            radius={6.5 * invScale}
                            fill="#EF4444"
                            stroke="#B91C1C"
                            strokeWidth={1}
                            listening={false}
                          />
                        );
                      }
                    }
                    // 選択中パターンの開始/終了座標（点線用）
                    const mFirst = frameCloths[active.start];
                    const mLast = frameCloths[active.start + active.length - 1];
                    const mDir = typeof mLast?.meta?.direction === 'number' ? degToUnitVector(Number(mLast?.meta?.direction)) : t;
                    const mLenPx = mmToPx(Number(mLast?.meta?.length ?? 0), DEFAULT_SCALE);
                    const mStartPos = { x: mFirst.position.x, y: mFirst.position.y };
                    const mEndPos = { x: mLast.position.x + mDir.x * mLenPx, y: mLast.position.y + mDir.y * mLenPx };
                    return (
                      <Group key={`frame-${k}`}>
                        {/* 点線の強調ライン（布材は非破壊、上から重ねる）*/}
                        <Line
                          points={[mStartPos.x, mStartPos.y, mEndPos.x, mEndPos.y]}
                          stroke="#3B82F6"
                          strokeWidth={3}
                          dash={[dashLen, dashLen]}
                          opacity={0.9}
                          listening={false}
                        />
                        {/* 間柱の三角マーカー（UI上のみ上書き表示） */}
                        {triangles}
                        {/* クリック当たり判定（広めの透明ライン、ホバーで確認しやすく） */}
                        <Line
                          points={[fg.startPos.x, fg.startPos.y, fg.endPos.x, fg.endPos.y]}
                          stroke={showHover ? 'rgba(250,204,21,0.25)' : 'rgba(0,0,0,0)'}
                          strokeWidth={Math.max(10 * invScale + 12, 22 * invScale)}
                          shadowColor={showHover ? '#FACC15' : undefined}
                          shadowBlur={showHover ? 16 * invScale : 0}
                          shadowOpacity={showHover ? 0.9 : 0}
                          listening={true}
                          hitStrokeWidth={24}
                          onMouseEnter={(e) => {
                            const st = e.target.getStage?.();
                            if (st) st.container().style.cursor = 'pointer';
                            setHoveredFrameKey(k);
                          }}
                          onMouseLeave={(e) => {
                            const st = e.target.getStage?.();
                            if (st) st.container().style.cursor = 'default';
                            setHoveredFrameKey((cur) => (cur === k ? null : cur));
                          }}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            setFrameSelection((prev) => ({ ...prev, [k]: ((prev[k] ?? 0) + 1) % fg.matches.length }));
                          }}
                          onTap={(e) => {
                            e.cancelBubble = true;
                            setFrameSelection((prev) => ({ ...prev, [k]: ((prev[k] ?? 0) + 1) % fg.matches.length }));
                          }}
                        />
                      </Group>
                    );
                  })}
                </>
              );
            })()}
          </Group>
        );
      })}
    </>
  );
}
