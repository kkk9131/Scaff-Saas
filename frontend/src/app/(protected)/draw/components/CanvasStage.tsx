/**
 * CanvasStage.tsx
 * Konva.jsを使った作図キャンバスのメインコンポーネント
 *
 * 機能:
 * - Konva Stageの初期化
 * - レイヤー構成（足場レイヤー、注記レイヤー）
 * - ズーム機能（ホイールズーム）
 * - パン機能（スペース+ドラッグ）
 * - サックスモード（スパン自動生成）
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect, Transformer, Line } from 'react-konva';
import { useShallow } from 'zustand/react/shallow';
import { useDrawingStore } from '@/stores/drawingStore';
import { useDrawingModeStore } from '@/stores/drawingModeStore';
import { generateScaffoldSpan } from '@/lib/sax/spanGenerator';
import { snapPositionToGrid, DEFAULT_SCALE, mmToPx, calculateAngleDegrees } from '@/lib/utils/scale';
import { calculateDirection } from '@/lib/sax/directionRules';
import GridOverlay from './GridOverlay';
import SaxTool from './SaxTool';
import ScaffoldRenderer from './ScaffoldRenderer';
import PillarQuantityCardUnified from './PillarQuantityCardUnified';
import ClothQuantityCardUnified from './ClothQuantityCardUnified';
import BracketQuantityCardUnified from './BracketQuantityCardUnified';
import BracketConfigCardBulk from './BracketConfigCardBulk';
import AntiQuantityCardUnified from './AntiQuantityCardUnified';
import AntiLevelCardUnified from './AntiLevelCardUnified';
import BracketConfigCard from './BracketConfigCard';
import HaneConfigCard from './HaneConfigCard';
import BraceQuantityCard from './BraceQuantityCard';
import MemoRenderer from './MemoRenderer';
import MemoCard from './MemoCard';
import ViewModeInfoCard from './ViewModeInfoCard';
import AntiAddCard from './AntiAddCard';
import DeleteSelectCard from './DeleteSelectCard';
import { useDrawingSave } from '@/hooks/useDrawingSave';
import { registerStage } from '@/lib/canvasStageExporter';
import { v4 as uuidv4 } from 'uuid';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ScaffoldPart } from '@/types/scaffold';

type BracketPart = ScaffoldPart & { type: 'ブラケット' };
type AntiPart = ScaffoldPart & { type: 'アンチ' };
type StairPart = ScaffoldPart & { type: '階段' };

const isBracketPart = (part: ScaffoldPart): part is BracketPart => part.type === 'ブラケット';
const isAntiPart = (part: ScaffoldPart): part is AntiPart => part.type === 'アンチ';
const isStairPart = (part: ScaffoldPart): part is StairPart => part.type === '階段';

/**
 * CanvasStageコンポーネント
 *
 * Konva Stageをラップし、ズーム・パン機能を提供する
 */
export default function CanvasStage() {
  // Konva Stageへの参照
  const stageRef = useRef<Konva.Stage | null>(null);

  // キャンバスのサイズ状態
  const [stageSize, setStageSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  const stageWidth = stageSize.width;
  const stageHeight = stageSize.height;

  // Zustandストアから状態と操作を取得
  const {
    canvasScale,
    canvasPosition,
    currentTool,
    currentColor,
    bracketSize,
    directionReversed,
    selectedScaffoldPartKeys,
    editSelectionMode,
    editTargetType,
    scaffoldGroups,
    bulkPillarScope,
    bulkClothScope,
    bulkBracketScope,
    memos,
    selectedMemoId,
      lassoGlowColor,
      snapToGrid,
      gridSize,
      snapToRightAngle,
    } = useDrawingStore(
      useShallow((state) => ({
        canvasScale: state.canvasScale,
        canvasPosition: state.canvasPosition,
        currentTool: state.currentTool,
        currentColor: state.currentColor,
        bracketSize: state.bracketSize,
        directionReversed: state.directionReversed,
        selectedScaffoldPartKeys: state.selectedScaffoldPartKeys,
        editSelectionMode: state.editSelectionMode,
        editTargetType: state.editTargetType,
        scaffoldGroups: state.scaffoldGroups,
        bulkPillarScope: state.bulkPillarScope,
        bulkClothScope: state.bulkClothScope,
        bulkBracketScope: state.bulkBracketScope,
        memos: state.memos,
        selectedMemoId: state.selectedMemoId,
        lassoGlowColor: state.lassoGlowColor,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        snapToRightAngle: state.snapToRightAngle,
      }))
    );
  const setCanvasScale = useDrawingStore((state) => state.setCanvasScale);
  const setCanvasPosition = useDrawingStore((state) => state.setCanvasPosition);
  const setMousePosition = useDrawingStore((state) => state.setMousePosition);
  const addScaffoldGroup = useDrawingStore((state) => state.addScaffoldGroup);
  const setBracketSize = useDrawingStore((state) => state.setBracketSize);
  const setDirectionReversed = useDrawingStore((state) => state.setDirectionReversed);
  const updateScaffoldGroup = useDrawingStore((state) => state.updateScaffoldGroup);
  const setEditSelectionMode = useDrawingStore((state) => state.setEditSelectionMode);
  const setBulkPillarScope = useDrawingStore((state) => state.setBulkPillarScope);
  const setBulkClothScope = useDrawingStore((state) => state.setBulkClothScope);
  const setBulkBracketScope = useDrawingStore((state) => state.setBulkBracketScope);
  const addMemo = useDrawingStore((state) => state.addMemo);
  const updateMemo = useDrawingStore((state) => state.updateMemo);
  const setSelectedMemoId = useDrawingStore((state) => state.setSelectedMemoId);
  const setLassoSelectionArea = useDrawingStore((state) => state.setLassoSelectionArea);
  const selectScaffoldParts = useDrawingStore((state) => state.selectScaffoldParts);

  const canvasOffsetX = canvasPosition.x;
  const canvasOffsetY = canvasPosition.y;
  const visibleBounds = useMemo(() => {
    const safeScale = Math.abs(canvasScale) < 0.0001 ? 1 : canvasScale;
    const inv = 1 / safeScale;
    const left = (-canvasOffsetX) * inv;
    const top = (-canvasOffsetY) * inv;
    const right = left + stageWidth * inv;
    const bottom = top + stageHeight * inv;
    return { left, right, top, bottom };
  }, [canvasOffsetX, canvasOffsetY, canvasScale, stageWidth, stageHeight]);
  const VIEWPORT_MARGIN = 480;
  const isPartWithinViewport = (part: ScaffoldPart): boolean => {
    const { left, right, top, bottom } = visibleBounds;
    const pointInViewport = (x: number, y: number, margin = VIEWPORT_MARGIN) =>
      x >= left - margin &&
      x <= right + margin &&
      y >= top - margin &&
      y <= bottom + margin;
    const rectIntersectsViewport = (minX: number, maxX: number, minY: number, maxY: number) =>
      maxX >= left - VIEWPORT_MARGIN &&
      minX <= right + VIEWPORT_MARGIN &&
      maxY >= top - VIEWPORT_MARGIN &&
      minY <= bottom + VIEWPORT_MARGIN;

    if (pointInViewport(part.position.x, part.position.y)) {
      return true;
    }

    switch (part.type) {
      case '布材': {
        const lengthMm = Number(part.meta?.length ?? 0);
        if (!(lengthMm > 0)) {
          return rectIntersectsViewport(part.position.x, part.position.x, part.position.y, part.position.y);
        }
        const directionDeg = Number(part.meta?.direction ?? 0);
        const rad = (directionDeg * Math.PI) / 180;
        const dir = { x: Math.cos(rad), y: Math.sin(rad) };
        const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
        const endX = part.position.x + dir.x * lengthPx;
        const endY = part.position.y + dir.y * lengthPx;
        if (pointInViewport(endX, endY)) {
          return true;
        }
        const minX = Math.min(part.position.x, endX);
        const maxX = Math.max(part.position.x, endX);
        const minY = Math.min(part.position.y, endY);
        const maxY = Math.max(part.position.y, endY);
        return rectIntersectsViewport(minX, maxX, minY, maxY);
      }
      case 'ブラケット': {
        const widthMmRaw = part.meta?.width ?? (part.meta?.bracketSize === 'W' ? 600 : 355);
        const widthMm = Number(widthMmRaw);
        if (!(widthMm > 0)) {
          return rectIntersectsViewport(part.position.x, part.position.x, part.position.y, part.position.y);
        }
        const dirDeg = Number(part.meta?.direction ?? 0);
        const rad = (dirDeg * Math.PI) / 180;
        const dir = { x: Math.cos(rad), y: Math.sin(rad) };
        const widthPx = mmToPx(widthMm, DEFAULT_SCALE);
        const endX = part.position.x + dir.x * widthPx;
        const endY = part.position.y + dir.y * widthPx;
        if (pointInViewport(endX, endY)) {
          return true;
        }
        const minX = Math.min(part.position.x, endX);
        const maxX = Math.max(part.position.x, endX);
        const minY = Math.min(part.position.y, endY);
        const maxY = Math.max(part.position.y, endY);
        return rectIntersectsViewport(minX, maxX, minY, maxY);
      }
      case 'アンチ':
      case '階段': {
        const lengthMmRaw = part.meta?.length ?? 0;
        const widthMmRaw = part.meta?.width ?? (part.type === 'アンチ' ? 400 : 0);
        const lengthMm = Number(lengthMmRaw);
        const widthMm = Number(widthMmRaw);
        if (!(lengthMm > 0 && widthMm > 0)) {
          return rectIntersectsViewport(part.position.x, part.position.x, part.position.y, part.position.y);
        }
        const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
        const widthPx = mmToPx(widthMm, DEFAULT_SCALE);
        const halfLen = lengthPx / 2;
        const halfWidth = widthPx / 2;
        const directionDeg = Number(part.meta?.direction ?? 0);
        const rad = (directionDeg * Math.PI) / 180;
        const dir = { x: Math.cos(rad), y: Math.sin(rad) };
        const normal = { x: -dir.y, y: dir.x };
        const corners = [
          {
            x: part.position.x + dir.x * halfLen + normal.x * halfWidth,
            y: part.position.y + dir.y * halfLen + normal.y * halfWidth,
          },
          {
            x: part.position.x + dir.x * halfLen - normal.x * halfWidth,
            y: part.position.y + dir.y * halfLen - normal.y * halfWidth,
          },
          {
            x: part.position.x - dir.x * halfLen + normal.x * halfWidth,
            y: part.position.y - dir.y * halfLen + normal.y * halfWidth,
          },
          {
            x: part.position.x - dir.x * halfLen - normal.x * halfWidth,
            y: part.position.y - dir.y * halfLen - normal.y * halfWidth,
          },
        ];
        if (corners.some((corner) => pointInViewport(corner.x, corner.y))) {
          return true;
        }
        const xs = corners.map((c) => c.x);
        const ys = corners.map((c) => c.y);
        return rectIntersectsViewport(
          Math.min(...xs),
          Math.max(...xs),
          Math.min(...ys),
          Math.max(...ys)
        );
      }
      default:
        return rectIntersectsViewport(part.position.x, part.position.x, part.position.y, part.position.y);
    }
  };

  const { currentMode } = useDrawingModeStore();

  // 自動保存フック（10秒 or 10アクション）
  useDrawingSave({ intervalMs: 10_000, actionThreshold: 10 });

  // PNGエクスポート用に Stage を登録
  useEffect(() => {
    if (stageRef.current) registerStage(stageRef.current);
    return () => registerStage(null);
  }, []);

  // 布材分割ドラッグのプレビュー状態
  const [clothSplit, setClothSplit] = useState<
    | {
        groupId: string;
        partId: string;
        leftMm: number;
        rightMm: number;
        anchorCanvas: { x: number; y: number };
      }
    | null
  >(null);

  // 分割確定用カード
  const [splitConfirm, setSplitConfirm] = useState<
    | (NonNullable<typeof clothSplit> & { screen: { left: number; top: number } })
    | null
  >(null);

  // 筋交数量カード（階段編集時、青色発光の中点クリックで表示）
  const [braceCard, setBraceCard] = useState<
    | { anchor: { x: number; y: number }; groupId: string; partId: string }
    | null
  >(null);


  // パンモード（スペースキー押下中）の状態
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 });

  // スパン描画用の状態
  const [isDrawingSpan, setIsDrawingSpan] = useState(false);
  const [spanStart, setSpanStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [spanCurrent, setSpanCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // メモ作成用の状態
  const [isDrawingMemo, setIsDrawingMemo] = useState(false);
  const [memoStart, setMemoStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [memoCurrent, setMemoCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // 投げ縄モード用の状態
  const [isDrawingLasso, setIsDrawingLasso] = useState(false);
  const [lassoPath, setLassoPath] = useState<{ x: number; y: number }[]>([]);
  // パフォーマンス向上のため、パスをrefで保持
  const lassoPathRef = useRef<{ x: number; y: number }[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);

  // メモ編集カードの状態
  const [memoCard, setMemoCard] = useState<{
    anchor: { x: number; y: number };
    memoId: string;
  } | null>(null);

  // ビューモード時のホバー情報
  const [hoveredViewPart, setHoveredViewPart] = useState<{
    groupId: string;
    partId: string;
    screenPosition: { x: number; y: number };
  } | null>(null);

  // Transformerの参照（メモのリサイズ用）
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const transformerTargetRef = useRef<Konva.Node | null>(null);

  // Transformerのターゲットを設定する関数
  const setTransformerTarget = (target: Konva.Node | null) => {
    transformerTargetRef.current = target;
    if (transformerRef.current && target) {
      transformerRef.current.nodes([target]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  };

  // 選択中のメモが変更されたらTransformerを更新
  useEffect(() => {
    if (!transformerRef.current) return;

    if (selectedMemoId && currentMode === 'memo') {
      // transformerTargetRefから直接取得
      if (transformerTargetRef.current) {
        transformerRef.current.nodes([transformerTargetRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
      
      // フォールバック: Stageから検索
      const stage = stageRef.current;
      if (stage) {
        const memoLayer = stage.findOne('.memo-layer');
        if (memoLayer) {
          const selectedGroup = memoLayer.findOne(`#memo-group-${selectedMemoId}`);
          if (selectedGroup) {
            transformerRef.current.nodes([selectedGroup]);
            transformerRef.current.getLayer()?.batchDraw();
            return;
          }
        }
      }
    }
    
    // 選択解除またはメモモード以外の場合
    transformerRef.current.nodes([]);
    transformerTargetRef.current = null;
  }, [selectedMemoId, currentMode]);

  // Transformerのリサイズ変更を監視
  useEffect(() => {
    if (!transformerRef.current || !selectedMemoId) return;

    const transformer = transformerRef.current;
    const handleTransformEnd = () => {
      const node = transformer.nodes()[0];
      if (!node) return;

      const memo = memos.find((m) => m.id === selectedMemoId);
      if (!memo) return;

      // Groupのスケールとサイズから新しいサイズを計算
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const newWidth = Math.max(100, memo.size.width * scaleX);
      const newHeight = Math.max(60, memo.size.height * scaleY);

      // 位置を更新（Groupのx, yから）
      const newPosition = {
        x: node.x(),
        y: node.y(),
      };

      updateMemo(selectedMemoId, {
        position: newPosition,
        size: { width: newWidth, height: newHeight },
      });

      // スケールをリセット
      node.scaleX(1);
      node.scaleY(1);
    };

    transformer.on('transformend', handleTransformEnd);

    return () => {
      transformer.off('transformend', handleTransformEnd);
    };
  }, [selectedMemoId, memos, updateMemo]);

  // 分割適用処理
  const applyClothSplit = (
    mode: 'with-anti' | 'cloth-only' | 'pillar-only',
    data: NonNullable<typeof splitConfirm>
  ) => {
    const { groupId, partId, leftMm, rightMm } = data;
    const group = useDrawingStore.getState().scaffoldGroups.find((g) => g.id === groupId);
    if (!group) return;
    const part = group.parts.find((p) => p.id === partId);
    if (!part || part.type !== '布材') return;

    const line = group.meta?.line;
    const settings = group.meta?.settings;
    if (!line) return;

    const dirDeg = Number(part.meta?.direction ?? 0);
    const dir = { x: Math.cos((dirDeg * Math.PI) / 180), y: Math.sin((dirDeg * Math.PI) / 180) };
    const start = { x: part.position.x, y: part.position.y };
    const offsetMm = Number(part.meta?.offsetMm ?? 0);
    const splitOffsetMm = offsetMm + leftMm;

    // 150 を含む場合は境界側へ寄せる分割: 左は末尾150、右は先頭150
  const splitIntoAllowed = (len: number): number[] => {
    const allowed = [1800, 1500, 1200, 900, 600, 300, 150];
      let remaining = len;
      const segs: number[] = [];
      for (const a of allowed) {
        while (remaining >= a) {
          segs.push(a);
          remaining -= a;
        }
      }
      if (remaining > 0) {
        // 最寄り150へ丸め
        const snap = Math.round(remaining / 150) * 150;
        if (snap > 0) segs.push(snap);
      }
      return segs;
    };
    const moveAll150To = (segs: number[], side: 'start' | 'end') => {
      const s150 = segs.filter((v) => v === 150);
      const others = segs.filter((v) => v !== 150);
      if (s150.length === 0) return segs;
      return side === 'start' ? [...s150, ...others] : [...others, ...s150];
    };

    const leftSegsRaw = splitIntoAllowed(leftMm);
    const rightSegsRaw = splitIntoAllowed(rightMm);
    const leftSegs = moveAll150To(leftSegsRaw, 'end');
    const rightSegs = moveAll150To(rightSegsRaw, 'start');

    const clothBStart = {
      x: start.x + dir.x * mmToPx(leftMm, DEFAULT_SCALE),
      y: start.y + dir.y * mmToPx(leftMm, DEFAULT_SCALE),
    };
    // 連続布材を生成
    const clothParts: ScaffoldPart[] = [];
    // 左側
    {
      let curOff = offsetMm;
      let curPos = { ...start };
      for (const l of leftSegs) {
        clothParts.push({
          ...part,
          id: randomId(),
          position: { ...curPos },
          meta: { ...(part.meta || {}), length: l, offsetMm: curOff },
        });
        curOff += l;
        curPos = { x: curPos.x + dir.x * mmToPx(l, DEFAULT_SCALE), y: curPos.y + dir.y * mmToPx(l, DEFAULT_SCALE) };
      }
    }
    // 右側
    {
      let curOff = splitOffsetMm;
      let curPos = { ...clothBStart };
      for (const l of rightSegs) {
        clothParts.push({
          ...part,
          id: randomId(),
          position: { ...curPos },
          meta: { ...(part.meta || {}), length: l, offsetMm: curOff },
        });
        curOff += l;
        curPos = { x: curPos.x + dir.x * mmToPx(l, DEFAULT_SCALE), y: curPos.y + dir.y * mmToPx(l, DEFAULT_SCALE) };
      }
    }

    const outwardDeg = calculateDirection(line.start, line.end, Boolean(settings?.reversed));
    const pillar = {
      id: randomId(),
      type: '柱' as const,
      position: { x: clothBStart.x, y: clothBStart.y },
      color: part.color,
      marker: 'circle' as const,
      meta: { direction: outwardDeg, offsetMm: splitOffsetMm },
    };

    let baseParts = group.parts.filter((p) => p.id !== part.id);
    let addParts: ScaffoldPart[] = [];
    if (mode === 'with-anti') {
      // 布材は分割して差し替え（アンチ分割もこの後に実施）
      addParts = [...clothParts, pillar];
    } else if (mode === 'cloth-only') {
      // 布材は分割せず、柱のみ追加
      baseParts = group.parts;
      addParts = [pillar];
    } else {
      // 念のためデフォルトは布材分割+柱
      addParts = [...clothParts, pillar];
    }

    // 追加の柱（150を含む内部分割境界にも柱を追加）
    {
      // 左側内部境界
      let acc = 0;
      for (let i = 0; i < leftSegs.length - 1; i++) {
        acc += leftSegs[i];
        const bpos = {
          x: start.x + dir.x * mmToPx(acc, DEFAULT_SCALE),
          y: start.y + dir.y * mmToPx(acc, DEFAULT_SCALE),
        };
        const boff = offsetMm + acc;
        addParts.push({
          id: randomId(),
          type: '柱',
          position: bpos,
          color: part.color,
          marker: 'circle',
          meta: { direction: outwardDeg, offsetMm: boff },
        });
      }
      // 右側内部境界
      acc = 0;
      for (let i = 0; i < rightSegs.length - 1; i++) {
        acc += rightSegs[i];
        const bpos = {
          x: clothBStart.x + dir.x * mmToPx(acc, DEFAULT_SCALE),
          y: clothBStart.y + dir.y * mmToPx(acc, DEFAULT_SCALE),
        };
        const boff = splitOffsetMm + acc;
        addParts.push({
          id: randomId(),
          type: '柱',
          position: bpos,
          color: part.color,
          marker: 'circle',
          meta: { direction: outwardDeg, offsetMm: boff },
        });
      }
    }

    if (mode === 'with-anti') {
      const bracketSize = settings?.bracketSize || 'W';
      const bracketWidthMm = bracketSize === 'W' ? 600 : 355;

      // 既存アンチのある側（ラインに対する左右）を判定してブラケット方向を合わせる
      const targetAnti = group.parts.find(
        (p) => p.type === 'アンチ' && Number(p.meta?.offsetMm ?? -1) === offsetMm && Number(p.meta?.length ?? -1) === Number(part.meta?.length ?? -2)
      );
      // 左法線ベクトル（calculateDirectionのreversed=falseに対応）
      const outDegLeft = calculateDirection(line.start, line.end, false);
      const radLeft = (outDegLeft * Math.PI) / 180;
      const nLeft = { x: Math.cos(radLeft), y: Math.sin(radLeft) };

      // 分割位置基準でアンチ中心が左か右か判定
      let reversedForSplit = Boolean(settings?.reversed);
      if (targetAnti) {
        const vx = targetAnti.position.x - clothBStart.x;
        const vy = targetAnti.position.y - clothBStart.y;
        const dotLeft = vx * nLeft.x + vy * nLeft.y; // >0 左側、<0 右側
        reversedForSplit = dotLeft < 0; // 右側なら反転
      }

      const outwardDegAdj = calculateDirection(line.start, line.end, reversedForSplit);
      // 実際に使用する外向き法線ベクトル
      const nOut = reversedForSplit ? { x: -nLeft.x, y: -nLeft.y } : nLeft;

      // 分割位置にブラケットを作図（方向は既存アンチ側）
      addParts.push({
        id: randomId(),
        type: 'ブラケット',
        position: { x: clothBStart.x, y: clothBStart.y },
        color: part.color,
        meta: { bracketSize, width: bracketWidthMm, direction: outwardDegAdj, offsetMm: splitOffsetMm },
      });

      // 150 を含む内部分割境界にもブラケットを作図
      {
        // 左側: 末尾150 の直前境界
        let accL = 0;
        for (let i = 0; i < leftSegs.length - 1; i++) {
          accL += leftSegs[i];
          const nextIs150 = leftSegs[i + 1] === 150;
          if (nextIs150) {
            const bpos = {
              x: start.x + dir.x * mmToPx(accL, DEFAULT_SCALE),
              y: start.y + dir.y * mmToPx(accL, DEFAULT_SCALE),
            };
            addParts.push({
              id: randomId(),
              type: 'ブラケット',
              position: bpos,
              color: part.color,
              meta: { bracketSize, width: bracketWidthMm, direction: outwardDegAdj, offsetMm: offsetMm + accL },
            });
          }
        }
        // 右側: 先頭150 の直後境界
        let accR = 0;
        for (let i = 0; i < rightSegs.length - 1; i++) {
          const curIs150 = rightSegs[i] === 150;
          accR += rightSegs[i];
          if (curIs150) {
            const bpos = {
              x: clothBStart.x + dir.x * mmToPx(accR, DEFAULT_SCALE),
              y: clothBStart.y + dir.y * mmToPx(accR, DEFAULT_SCALE),
            };
            addParts.push({
              id: randomId(),
              type: 'ブラケット',
              position: bpos,
              color: part.color,
              meta: { bracketSize, width: bracketWidthMm, direction: outwardDegAdj, offsetMm: splitOffsetMm + accR },
            });
          }
        }
      }

      // アンチ分割（ブラケット位置で分割）
      const spanAngle = calculateAngleDegrees(line.start, line.end);
      const antiWidthMm = bracketSize === 'W' ? 400 : 240;
      const innerClearMm = bracketSize === 'W' ? 150 : 50;
      const centerOffsetPx = mmToPx(innerClearMm + antiWidthMm / 2, DEFAULT_SCALE);

      if (targetAnti) {
        const spanLenMm = Number(group.meta?.spanLength ?? 0);
        // 左側アンチ群
        {
          let curOff = offsetMm;
          for (const l of leftSegs) {
            const centerMm = curOff + l / 2;
            const r = spanLenMm ? centerMm / spanLenMm : 0;
            const base = {
              x: line.start.x + (line.end.x - line.start.x) * r,
              y: line.start.y + (line.end.y - line.start.y) * r,
            };
            const pos = { x: base.x + nOut.x * centerOffsetPx, y: base.y + nOut.y * centerOffsetPx };
            addParts.push({ id: randomId(), type: 'アンチ', position: pos, color: part.color, meta: { length: l, width: antiWidthMm, direction: spanAngle, bracketSize, offsetMm: curOff } });
            curOff += l;
          }
        }
        // 右側アンチ群
        {
          let curOff = splitOffsetMm;
          for (const l of rightSegs) {
            const centerMm = curOff + l / 2;
            const r = spanLenMm ? centerMm / spanLenMm : 0;
            const base = {
              x: line.start.x + (line.end.x - line.start.x) * r,
              y: line.start.y + (line.end.y - line.start.y) * r,
            };
            const pos = { x: base.x + nOut.x * centerOffsetPx, y: base.y + nOut.y * centerOffsetPx };
            addParts.push({ id: randomId(), type: 'アンチ', position: pos, color: part.color, meta: { length: l, width: antiWidthMm, direction: spanAngle, bracketSize, offsetMm: curOff } });
            curOff += l;
          }
        }

        const filtered = baseParts.filter((p) => p.id !== targetAnti.id);
        updateScaffoldGroup(groupId, { parts: [...filtered, ...addParts] });
        return;
      }
    }

    // 柱のみ/布材のみではここで終了（布材のみは柱のみ追加、ブラケットは追加しない）

    updateScaffoldGroup(groupId, { parts: [...baseParts, ...addParts] });
  };

  const randomId = () => 'id_' + Math.random().toString(36).slice(2, 10);

  // 分割ヒントの表示用（150を境界へ寄せた内訳表示）
  /**
   * 柱数量カードの状態
   * - オーバーレイはStageコンテナ内で絶対配置
   */
  const [pillarCard, setPillarCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        partId: string;
      }
    | null
  >(null);

  /** 布材数量カードの状態 */
  const [clothCard, setClothCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        partId: string;
      }
    | null
  >(null);

  /** ブラケット数量カードの状態 */
  const [bracketCard, setBracketCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        partId: string;
      }
    | null
  >(null);

  /** アンチ数量カードの状態 */
  const [antiCard, setAntiCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        partId: string;
      }
    | null
  >(null);

  /** アンチ段数カードの状態 */
  const [antiLevelCard, setAntiLevelCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        partId: string;
      }
    | null
  >(null);

  /**
   * アンチ追加カードの状態
   * アンチが接していないブラケットをクリックしたときに表示
   */
  const [antiAddCard, setAntiAddCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        bracketId: string;
      }
    | null
  >(null);

  /** 削除選択カードの状態（布材とブラケットが重複する場合等） */
  const [deleteSelectCard, setDeleteSelectCard] = useState<
    | {
        anchor: { x: number; y: number };
        candidates: { id: string; type: '布材' | 'ブラケット' | '柱' | 'アンチ' | '階段' | '梁枠' }[];
        groupId: string;
      }
    | null
  >(null);

  /** ブラケット設定カードの状態 */
  const [bracketConfigCard, setBracketConfigCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        /** 既存ブラケット編集 */
        partId?: string;
        /** 未作図の柱から新規作図 */
        pillarId?: string;
      }
    | null
  >(null);

  // ハネの方向・寸法カード
  const [haneCard, setHaneCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        partId: string;
      }
    | null
  >(null);

  /**
   * リサイズハンドラー
   * ウィンドウサイズ変更時にStageサイズを更新
   */
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * スペースキーでパンモードの切替
   * スペースキー押下中はパン、離すと通常モードに戻る
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // スペースキーが押されたらパンモードに切替
      if (e.code === 'Space' && !isPanning && currentMode === 'draw') {
        e.preventDefault();
        setIsPanning(true);
        // カーソルをgrabに変更
        if (stageRef.current) {
          const container = stageRef.current.container();
          container.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // スペースキーが離されたら通常モードに戻る
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanning(false);
        // カーソルを元に戻す
        if (stageRef.current) {
          const container = stageRef.current.container();
          container.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentMode, isPanning]);

  /**
   * Enterキー: 編集モードでの一括編集カードを開く
   *
   * 変更点（バグ修正）
   * - これまで「選択が2件以上」の時のみ一括カードを開いていたが、
   *   柱を1本だけ選択しているケースでもブラケットの追加ができるよう、
   *   選択数の条件を「> 0」に緩和する。
   * - 文脈: ブラケット編集＋選択モード時に青色発光した柱をクリックすると
   *   選択トグルになる仕様だが、1本だけではEnterでカードが開かず追加できない問題があったため。
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.code !== 'Enter') return;
      if (currentMode !== 'edit') return;
      // 1件以上選択時に Enter で一括カードを開く（柱/布材/ブラケット/アンチ/ハネ）
      // 以前は >1（2件以上）だったが、1件のみ選択でも一括カードを開けるようにする。
      if (!(selectedScaffoldPartKeys.length > 0)) return;
      if (editTargetType === '柱') {
        e.preventDefault();
        setBulkPillarScope('selected');
        setEditSelectionMode('bulk');
        return;
      }
      if (editTargetType === '布材') {
        e.preventDefault();
        setBulkClothScope('selected');
        setEditSelectionMode('bulk');
        return;
      }
      if (editTargetType === 'ブラケット') {
        e.preventDefault();
        setBulkBracketScope('selected');
        setEditSelectionMode('bulk');
        return;
      }
      if (editTargetType === 'アンチ') {
        e.preventDefault();
        // 緑発光（アンチ未接ブラケット）が選択されていれば、追加カード（bulk/add）を開く
        const findNoAntiBrackets = () => {
          const result = new Set<string>();
          for (const group of scaffoldGroups) {
            const antiParts = group.parts.filter((p) => p.type === 'アンチ');
            const bracketParts = group.parts.filter((p) => p.type === 'ブラケット');
            for (const b of bracketParts) {
              const bOff = Number(b.meta?.offsetMm);
              if (!isFinite(bOff)) continue;
              const bDirDeg = Number(b.meta?.direction ?? 0);
              const bN = { x: Math.cos((bDirDeg * Math.PI) / 180), y: Math.sin((bDirDeg * Math.PI) / 180) };
              const sideThresholdPx = mmToPx(80, DEFAULT_SCALE);
              const touching = antiParts.some((a) => {
                const aOff = Number(a.meta?.offsetMm ?? 0);
                const aLen = Number(a.meta?.length ?? 0);
                if (!(aLen > 0 && bOff >= aOff - 1e-6 && bOff <= aOff + aLen + 1e-6)) return false;
                const dx = a.position.x - b.position.x;
                const dy = a.position.y - b.position.y;
                const dot = dx * bN.x + dy * bN.y;
                return dot > sideThresholdPx;
              });
              if (!touching) result.add(`${group.id}:${b.id}`);
            }
          }
          return result;
        };
        const noAntiSet = findNoAntiBrackets();
        const selected = useDrawingStore.getState().selectedScaffoldPartKeys;
        const selectedNoAnti = selected.filter((k) => noAntiSet.has(k));
        if (selectedNoAnti.length > 0) {
          useDrawingStore.getState().setBulkAntiScope('selected');
          useDrawingStore.getState().setBulkAntiAction('add');
          setEditSelectionMode('bulk');
          return;
        }
        // 既存の段数/数量向け（青/黄）
        useDrawingStore.getState().setBulkAntiScope('selected');
        useDrawingStore.getState().setBulkAntiAction('level');
        setEditSelectionMode('bulk');
        return;
      }
      if (editTargetType === 'ハネ') {
        e.preventDefault();
        setEditSelectionMode('bulk');
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentMode, editTargetType, scaffoldGroups, selectedScaffoldPartKeys.length, setEditSelectionMode, setBulkPillarScope, setBulkClothScope, setBulkBracketScope]);

  /**
   * Shift/Altキーでサックスモード設定を切替
   * Shiftキー: ブラケットサイズW/S切替
   * Altキー: 方向反転フラグの切替
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shiftキーでブラケットサイズを切替（W ⇔ S）
      if (e.key === 'Shift' && currentMode === 'draw') {
        e.preventDefault();
        setBracketSize(bracketSize === 'W' ? 'S' : 'W');
      }

      // Altキーで方向反転フラグをON
      if (e.key === 'Alt' && currentMode === 'draw') {
        e.preventDefault();
        setDirectionReversed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Altキーを離したら方向反転フラグをOFF
      if (e.key === 'Alt') {
        e.preventDefault();
        setDirectionReversed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentMode, currentTool, bracketSize, setBracketSize, setDirectionReversed]);

  /**
   * ホイールズームハンドラー
   * マウスホイールで拡大・縮小を実現
   * マウスポインタ位置を中心にズーム
   */
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // ズーム倍率の計算（0.1〜5倍の範囲）
    const scaleBy = 1.05;
    const newScale =
      e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // 範囲チェック（0.1〜5倍）
    const clampedScale = Math.max(0.1, Math.min(newScale, 5));

    // マウスポインタを中心にズーム
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // ストアに反映
    setCanvasScale(clampedScale);
    setCanvasPosition(newPos);
  };

  /**
   * マウスダウンハンドラー
   * パンモード時のドラッグ開始位置を記録
   * スパン描画モード時の描画開始
   */
  const handleMouseDown = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // ビューモードでは編集を無効化
    if (currentMode === 'view') {
      return;
    }

    // メモモード時: クリック位置が既存のメモ領域内かチェック
    if (currentMode === 'memo' && !isPanning) {
      const canvasX = (pos.x - canvasPosition.x) / canvasScale;
      const canvasY = (pos.y - canvasPosition.y) / canvasScale;

      // 既存のメモ領域内かチェック（テキストの高さも考慮）
      const clickedMemo = memos.find((memo) => {
        const { position, size, text } = memo;
        // テキストの行数から高さを計算（MemoRendererと同じ計算）
        const lines = text.split('\n').filter((line) => line.trim().length > 0 || text.includes('\n'));
        const fontSize = Math.max(12, 14 / canvasScale);
        const lineHeight = fontSize * 1.4;
        const padding = 8 / canvasScale;
        const textHeight = lines.length > 0 ? lines.length * lineHeight : lineHeight;
        const rectHeight = Math.max(size.height, textHeight + padding * 2);

        return (
          canvasX >= position.x &&
          canvasX <= position.x + size.width &&
          canvasY >= position.y &&
          canvasY <= position.y + rectHeight
        );
      });

      // 既存のメモ領域内をクリックした場合は新規作成をスキップ
      if (clickedMemo) {
        // メモ編集カードを表示（MemoRendererのonClickで既に処理される場合もあるが、念のため）
        return;
      }
    }

    // サックスモードでのスパン描画開始（モードがdrawであれば描画可能）
    if (currentMode === 'draw' && !isPanning) {
      // キャンバス座標系に変換（スケールとポジションを考慮）
      let canvasX = (pos.x - canvasPosition.x) / canvasScale;
      let canvasY = (pos.y - canvasPosition.y) / canvasScale;

      // グリッドスナップが有効な場合、座標をスナップ
      if (snapToGrid) {
        const snapped = snapPositionToGrid(
          { x: canvasX, y: canvasY },
          gridSize,
          DEFAULT_SCALE
        );
        canvasX = snapped.x;
        canvasY = snapped.y;
      }

      setIsDrawingSpan(true);
      setSpanStart({ x: canvasX, y: canvasY });
      setSpanCurrent({ x: canvasX, y: canvasY });
      return;
    }

    // メモモードでのメモ領域作成開始
    if (currentMode === 'memo' && !isPanning) {
      const rawX = (pos.x - canvasPosition.x) / canvasScale;
      const rawY = (pos.y - canvasPosition.y) / canvasScale;
      const { x: memoX, y: memoY } = snapToGrid
        ? snapPositionToGrid({ x: rawX, y: rawY }, gridSize, DEFAULT_SCALE)
        : { x: rawX, y: rawY };

      setIsDrawingMemo(true);
      setMemoStart({ x: memoX, y: memoY });
      setMemoCurrent({ x: memoX, y: memoY });
      return;
    }

    // 投げ縄モードでの囲い作成開始
    if (currentMode === 'edit' && editSelectionMode === 'lasso' && lassoGlowColor && !isPanning) {
      // キャンバス座標系に変換（スケールとポジションを考慮）
      const canvasX = (pos.x - canvasPosition.x) / canvasScale;
      const canvasY = (pos.y - canvasPosition.y) / canvasScale;

      // 投げ縄モード時はグリッドスナップを無効化（自由な描画のため）
      // if (snapToGrid) {
      //   const snapped = snapPositionToGrid(
      //     { x: canvasX, y: canvasY },
      //     gridSize,
      //     DEFAULT_SCALE
      //   );
      //   canvasX = snapped.x;
      //   canvasY = snapped.y;
      // }

      setIsDrawingLasso(true);
      setLassoPath([{ x: canvasX, y: canvasY }]);
      lassoPathRef.current = [{ x: canvasX, y: canvasY }];
      lastUpdateTimeRef.current = Date.now();
      // カーソルをペン描画モードに変更
      const container = stage.container();
      container.style.cursor = 'crosshair';
      return;
    }

    // パンモード時のドラッグ開始
    if (isPanning) {
      setLastPointerPosition(pos);
      // ドラッグ中はカーソルをgrabbingに変更
      const container = stage.container();
      container.style.cursor = 'grabbing';
    }
  };

  /**
   * マウスムーブハンドラー
   * パンモード時のドラッグでキャンバスを移動
   * スパン描画モード時のプレビュー更新
   * マウス座標も更新してアンダーバーに表示
   */
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // マウス座標をストアに保存（アンダーバー表示用）
    // キャンバス座標系に変換（スケールとポジションを考慮）
    let canvasX = (pos.x - canvasPosition.x) / canvasScale;
    let canvasY = (pos.y - canvasPosition.y) / canvasScale;

    // グリッドスナップが有効な場合、座標をスナップ（投げ縄モード時は無効化）
    if (snapToGrid && !(currentMode === 'edit' && editSelectionMode === 'lasso' && isDrawingLasso)) {
      const snapped = snapPositionToGrid(
        { x: canvasX, y: canvasY },
        gridSize,
        DEFAULT_SCALE
      );
      canvasX = snapped.x;
      canvasY = snapped.y;
    }

    setMousePosition({ x: Math.round(canvasX), y: Math.round(canvasY) });

    // 布材分割のプレビュー更新
    if (clothSplit) {
      // 対象パーツ情報を取得
      const group = useDrawingStore.getState().scaffoldGroups.find((g) => g.id === clothSplit.groupId);
      const part = group?.parts.find((p) => p.id === clothSplit.partId);
      if (group && part && part.type === '布材') {
        const lengthMm = Number(part.meta?.length ?? 0);
        const dirDeg = Number(part.meta?.direction ?? 0);
        const start = { x: part.position.x, y: part.position.y };
        const dir = { x: Math.cos((dirDeg * Math.PI) / 180), y: Math.sin((dirDeg * Math.PI) / 180) };
        const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
        const vx = canvasX - start.x;
        const vy = canvasY - start.y;
        const t = Math.max(0, Math.min(1, (vx * dir.x + vy * dir.y) / lengthPx));
        const splitRaw = t * lengthMm;
        const splitMm = Math.max(150, Math.min(lengthMm - 150, Math.round(splitRaw / 150) * 150));
        const leftMm = splitMm;
        const rightMm = lengthMm - splitMm;
        const anchorCanvas = {
          x: start.x + dir.x * mmToPx(leftMm, DEFAULT_SCALE),
          y: start.y + dir.y * mmToPx(leftMm, DEFAULT_SCALE),
        };
        setClothSplit({ groupId: clothSplit.groupId, partId: clothSplit.partId, leftMm, rightMm, anchorCanvas });
      }
      return;
    }

    // スパン描画中のプレビュー更新
    if (isDrawingSpan && spanStart) {
      let finalX = canvasX;
      let finalY = canvasY;

      // 直角モードが有効な場合、角度を90度の倍数にスナップ
      if (snapToRightAngle) {
        const dx = canvasX - spanStart.x;
        const dy = canvasY - spanStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // 最小距離チェック
          // 角度を計算（度）
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          
          // 90度の倍数にスナップ（0, 90, 180, 270度）
          const snappedAngle = Math.round(angle / 90) * 90;
          
          // スナップされた角度で終点を再計算
          const snappedRad = (snappedAngle * Math.PI) / 180;
          finalX = spanStart.x + Math.cos(snappedRad) * distance;
          finalY = spanStart.y + Math.sin(snappedRad) * distance;
          
          // 直角モード適用後、グリッドスナップも有効な場合は終点をグリッドにスナップ
          if (snapToGrid) {
            const snapped = snapPositionToGrid(
              { x: finalX, y: finalY },
              gridSize,
              DEFAULT_SCALE
            );
            finalX = snapped.x;
            finalY = snapped.y;
          }
        }
      }

      setSpanCurrent({ x: finalX, y: finalY });
      return;
    }

    // メモ作成中のプレビュー更新
    if (isDrawingMemo) {
      setMemoCurrent({ x: canvasX, y: canvasY });
      return;
    }

    // 投げ縄モードでの囲い作成中のプレビュー更新
    if (isDrawingLasso) {
      // マウス移動時に点を追加（滑らかな描画のため距離制限を緩和）
      const canvasX = (pos.x - canvasPosition.x) / canvasScale;
      const canvasY = (pos.y - canvasPosition.y) / canvasScale;
      
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      // パフォーマンス向上のため、refで直接更新し、適度な間隔でstateを更新
      if (lassoPathRef.current.length > 0) {
        const lastPoint = lassoPathRef.current[lassoPathRef.current.length - 1];
        const distance = Math.sqrt(
          Math.pow(canvasX - lastPoint.x, 2) + Math.pow(canvasY - lastPoint.y, 2)
        );
        // 前の点から0.1px以上離れている場合のみ点を追加（より滑らかな描画）
        if (distance > 0.1 / canvasScale) {
          lassoPathRef.current.push({ x: canvasX, y: canvasY });
          
          // 16ms（約60fps）ごとにstateを更新して描画を更新
          if (timeSinceLastUpdate >= 16) {
            setLassoPath([...lassoPathRef.current]);
            lastUpdateTimeRef.current = now;
          }
        }
      } else {
        // 最初の点を追加
        lassoPathRef.current = [{ x: canvasX, y: canvasY }];
        setLassoPath([{ x: canvasX, y: canvasY }]);
        lastUpdateTimeRef.current = now;
      }
      return;
    }

    // パンモード時のドラッグ処理
    if (isPanning && e.evt.buttons === 1) {
      // マウス左ボタンが押されている場合のみ
      const dx = pos.x - lastPointerPosition.x;
      const dy = pos.y - lastPointerPosition.y;

      const newPos = {
        x: canvasPosition.x + dx,
        y: canvasPosition.y + dy,
      };

      setCanvasPosition(newPos);
      setLastPointerPosition(pos);
    }
  };

  /**
   * マウスアップハンドラー
   * パンモード時のドラッグ終了
   * スパン描画モード時のスパン生成・ストア追加
   */
  const handleMouseUp = () => {
    // 布材分割確定: 選択カード表示
    if (clothSplit) {
      setSplitConfirm({
        ...clothSplit,
        screen: {
          left: clothSplit.anchorCanvas.x * canvasScale + canvasPosition.x + 12,
          top: clothSplit.anchorCanvas.y * canvasScale + canvasPosition.y + 12,
        },
      });
      setClothSplit(null);
      return;
    }
    // スパン描画完了時の処理
    if (isDrawingSpan && spanStart && spanCurrent) {
      // 始点と終点の距離を計算（最低10px以上ドラッグした場合のみ生成）
      let finalEnd = spanCurrent;
      
      // 直角モードが有効な場合、角度を90度の倍数にスナップ
      if (snapToRightAngle) {
        const dx = spanCurrent.x - spanStart.x;
        const dy = spanCurrent.y - spanStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // 最小距離チェック
          // 角度を計算（度）
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          
          // 90度の倍数にスナップ（0, 90, 180, 270度）
          const snappedAngle = Math.round(angle / 90) * 90;
          
          // スナップされた角度で終点を再計算
          const snappedRad = (snappedAngle * Math.PI) / 180;
          finalEnd = {
            x: spanStart.x + Math.cos(snappedRad) * distance,
            y: spanStart.y + Math.sin(snappedRad) * distance,
          };
          
          // 直角モード適用後、グリッドスナップも有効な場合は終点をグリッドにスナップ
          if (snapToGrid) {
            const snapped = snapPositionToGrid(
              { x: finalEnd.x, y: finalEnd.y },
              gridSize,
              DEFAULT_SCALE
            );
            finalEnd = snapped;
          }
        }
      }

      const dx = finalEnd.x - spanStart.x;
      const dy = finalEnd.y - spanStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        // スパン自動生成エンジンを呼び出し
        const scaffoldGroup = generateScaffoldSpan({
          start: spanStart,
          end: finalEnd,
          settings: {
            currentColor,
            bracketSize,
            reversed: directionReversed,
          },
        });

        // 既存との重複を除去（柱・ブラケット）してから追加
        const allExistingParts = useDrawingStore.getState().scaffoldGroups.flatMap((g) => g.parts);
        const near = (ax: number, ay: number, bx: number, by: number, tol = 2) => Math.hypot(ax - bx, ay - by) <= tol;
        const roundCardinal = (deg: number) => {
          const d = ((deg % 360) + 360) % 360;
          const cand = [0, 90, 180, 270];
          let best = 0, bestDiff = 1e9;
          for (const c of cand) {
            const diff = Math.min(Math.abs(d - c), 360 - Math.abs(d - c));
            if (diff < bestDiff) { bestDiff = diff; best = c; }
          }
          return best;
        };
        const existsPillarAt = (x: number, y: number) =>
          allExistingParts.some((p) => p.type === '柱' && near(p.position.x, p.position.y, x, y, 2));
        const existsBracketAt = (x: number, y: number, width: number, dir: number) =>
          allExistingParts.some(
            (p) =>
              p.type === 'ブラケット' &&
              near(p.position.x, p.position.y, x, y, 2) &&
              Number(p.meta?.width ?? -1) === width &&
              roundCardinal(Number(p.meta?.direction ?? 0)) === roundCardinal(dir)
          );

        const filteredParts = scaffoldGroup.parts.filter((p) => {
          if (p.type === '柱') {
            return !existsPillarAt(p.position.x, p.position.y);
          }
          if (p.type === 'ブラケット') {
            const width = Number(p.meta?.width ?? 0);
            const dir = Number(p.meta?.direction ?? 0);
            return !existsBracketAt(p.position.x, p.position.y, width, dir);
          }
          return true;
        });
        const dedupGroup = { ...scaffoldGroup, parts: filteredParts };
        addScaffoldGroup(dedupGroup);
      }

      // スパン描画状態をリセット
      setIsDrawingSpan(false);
      setSpanStart(null);
      setSpanCurrent(null);
      return;
    }

    // メモ作成完了時の処理
    if (isDrawingMemo && memoStart && memoCurrent) {
      // 始点と終点から矩形の位置とサイズを計算
      const startX = Math.min(memoStart.x, memoCurrent.x);
      const startY = Math.min(memoStart.y, memoCurrent.y);
      const endX = Math.max(memoStart.x, memoCurrent.x);
      const endY = Math.max(memoStart.y, memoCurrent.y);
      const width = Math.max(100, endX - startX); // 最小幅100px
      const height = Math.max(60, endY - startY); // 最小高さ60px

      // メモを追加
      addMemo({
        position: { x: startX, y: startY },
        size: { width, height },
        text: '',
      });

      // メモ作成状態をリセット
      setIsDrawingMemo(false);
      setMemoStart(null);
      setMemoCurrent(null);
      return;
    }

    // 投げ縄モードでの囲い作成完了時の処理
    if (isDrawingLasso && lassoPathRef.current.length > 0 && lassoGlowColor) {
      // 最終的なパスをstateに反映
      setLassoPath([...lassoPathRef.current]);
      
      // カーソルを元に戻す
      const stage = stageRef.current;
      if (stage) {
        const container = stage.container();
        container.style.cursor = 'default';
      }

      // パスが2点未満の場合は処理をスキップ
      if (lassoPathRef.current.length < 2) {
        setIsDrawingLasso(false);
        setLassoPath([]);
        lassoPathRef.current = [];
        return;
      }

      // パスを閉じた形状として扱う（開始点と終了点を結ぶ）
      const closedPath = [...lassoPathRef.current, lassoPathRef.current[0]];

      // パスをストアに保存
      setLassoSelectionArea(null); // 互換性のため
      useDrawingStore.getState().setLassoPath(closedPath);

      // 点とポリゴンの内外判定（ray casting algorithm）
      const pointInPolygon = (px: number, py: number, polygon: { x: number; y: number }[]) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].x;
          const yi = polygon[i].y;
          const xj = polygon[j].x;
          const yj = polygon[j].y;
          const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      };

      // ラインとポリゴンの交差判定（簡易版：ラインの複数点がポリゴン内にあるかチェック）
      const lineIntersectsPolygon = (
        line: { x1: number; y1: number; x2: number; y2: number },
        polygon: { x: number; y: number }[]
      ) => {
        // ラインの端点がポリゴン内にあるかチェック
        if (pointInPolygon(line.x1, line.y1, polygon) || pointInPolygon(line.x2, line.y2, polygon)) {
          return true;
        }
        // ラインの中間点を複数チェック
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = line.x1 + (line.x2 - line.x1) * t;
          const y = line.y1 + (line.y2 - line.y1) * t;
          if (pointInPolygon(x, y, polygon)) {
            return true;
          }
        }
        return false;
      };

      // 矩形とポリゴンの交差判定（簡易版：矩形の4頂点と中心点をチェック）
      const rectIntersectsPolygon = (
        rect: { x: number; y: number; width: number; height: number },
        polygon: { x: number; y: number }[]
      ) => {
        const corners = [
          { x: rect.x, y: rect.y },
          { x: rect.x + rect.width, y: rect.y },
          { x: rect.x + rect.width, y: rect.y + rect.height },
          { x: rect.x, y: rect.y + rect.height },
          { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }, // 中心点
        ];
        return corners.some((corner) => pointInPolygon(corner.x, corner.y, polygon));
      };

      // 囲いの中にある選択された発光色の部材を検出
      const selectedKeys: string[] = [];

      // アンチ編集時: 緑（未接ブラケットの発光）を投げ縄選択した場合は、
      // ブラケットの「アンチ未接」ラインを検出して複数対象を一括選択し、
      // 追加カード（bulk/add）を開く。
      if (editTargetType === 'アンチ' && lassoGlowColor === 'green') {
        // ブラケットにアンチが接していないかを検出（ScaffoldRendererと同等ロジック）
        const findNoAntiBrackets = () => {
          const result: { groupId: string; bracket: BracketPart }[] = [];
          for (const group of scaffoldGroups) {
            const antiParts = group.parts.filter(isAntiPart);
            const bracketParts = group.parts.filter(isBracketPart);
            for (const b of bracketParts) {
              const bOff = Number(b.meta?.offsetMm);
              if (!isFinite(bOff)) continue;
              const bDirDeg = Number(b.meta?.direction ?? 0);
              const bN = { x: Math.cos((bDirDeg * Math.PI) / 180), y: Math.sin((bDirDeg * Math.PI) / 180) };
              const sideThresholdPx = mmToPx(80, DEFAULT_SCALE);
              const touching = antiParts.some((a) => {
                const aOff = Number(a.meta?.offsetMm ?? 0);
                const aLen = Number(a.meta?.length ?? 0);
                if (!(aLen > 0 && bOff >= aOff - 1e-6 && bOff <= aOff + aLen + 1e-6)) return false;
                const dx = a.position.x - b.position.x;
                const dy = a.position.y - b.position.y;
                const dot = dx * bN.x + dy * bN.y;
                return dot > sideThresholdPx; // 同側に十分離れて存在
              });
              if (!touching) result.push({ groupId: group.id, bracket: b });
            }
          }
          return result;
        };

        const candidates = findNoAntiBrackets();
        const toSelectKeys: string[] = [];
        for (const { groupId, bracket } of candidates) {
          const wMm = Number(bracket.meta?.width ?? (bracket.meta?.bracketSize === 'W' ? 600 : 355));
          const dirDeg = Number(bracket.meta?.direction ?? 0);
          const dir = { x: Math.cos((dirDeg * Math.PI) / 180), y: Math.sin((dirDeg * Math.PI) / 180) };
          const wPx = mmToPx(wMm, DEFAULT_SCALE);
          const tip = { x: bracket.position.x + dir.x * wPx, y: bracket.position.y + dir.y * wPx };
          const seg = { x1: bracket.position.x, y1: bracket.position.y, x2: tip.x, y2: tip.y };
          if (lineIntersectsPolygon(seg, closedPath)) {
            toSelectKeys.push(`${groupId}:${bracket.id}`);
          }
        }
        if (toSelectKeys.length > 0) {
          // 一括追加（add）用に選択セット＆モードを切替
          selectScaffoldParts(toSelectKeys);
          useDrawingStore.getState().setBulkAntiScope('selected');
          useDrawingStore.getState().setBulkAntiAction('add');
          setEditSelectionMode('bulk');
          // 投げ縄作成状態をリセット
          setIsDrawingLasso(false);
          setLassoPath([]);
          lassoPathRef.current = [];
          lastUpdateTimeRef.current = 0;
          return;
        }
        // 対象なし: 通常の選択なしと同様に処理継続（下のselectedKeysは空）
      }
      const glowColorMap: Record<string, string> = {
        yellow: '#FACC15',
        blue: '#60A5FA',
        green: '#34D399',
      };
      const targetGlowColor = glowColorMap[lassoGlowColor];

      for (const group of scaffoldGroups) {
        for (const part of group.parts) {
          if (!isPartWithinViewport(part)) {
            continue;
          }
          // 部材の種類に応じて発光色を判定
          let partGlowColor: string | null = null;
          
          if (editTargetType === '柱' && part.type === '柱') {
            // 柱編集時の黄色発光
            partGlowColor = '#FACC15';
          } else if (editTargetType === '柱' && part.type === 'ブラケット') {
            // 柱編集時の青色発光（ブラケットの先端: 柱作図用）
            partGlowColor = '#60A5FA';
          } else if (editTargetType === '布材' && part.type === '布材') {
            // 布材編集時の黄色発光
            partGlowColor = '#FACC15';
          } else if (editTargetType === 'ブラケット' && part.type === 'ブラケット') {
            // ブラケット編集時の黄色発光
            partGlowColor = '#FACC15';
          } else if (editTargetType === 'ブラケット' && part.type === '柱') {
            // ブラケット編集時の青色発光（柱）
            partGlowColor = '#60A5FA';
          } else if (editTargetType === '階段' && part.type === '布材') {
            // 階段編集時の黄色発光（通常）または緑色発光（反対側600mm）
            const lengthMm = Number(part.meta?.length ?? 0);
            if (lengthMm === 600) {
              // 反対側600mm布材は緑色発光（判定は複雑なので簡易的に）
              partGlowColor = '#34D399';
            } else {
              // その他の布材は黄色発光
              partGlowColor = '#FACC15';
            }
          } else if (editTargetType === 'アンチ' && part.type === 'アンチ') {
            // アンチ編集時の発光色判定
            // 中点位置を計算して判定
            const antiMidX = part.position.x;
            const antiMidY = part.position.y;
            // 同一グループ内の布材の中点と一致するかチェック
            const cloths = group.parts.filter((p) => p.type === '布材');
            let hasMatchingClothMid = false;
            for (const cloth of cloths) {
              const clothLengthMm = Number(cloth.meta?.length ?? 0);
              if (clothLengthMm === 0) continue;
              const dirDeg = Number(cloth.meta?.direction ?? 0);
              const dir = { x: Math.cos((dirDeg * Math.PI) / 180), y: Math.sin((dirDeg * Math.PI) / 180) };
              const lengthPx = mmToPx(clothLengthMm, DEFAULT_SCALE);
              const midX = cloth.position.x + dir.x * (lengthPx / 2);
              const midY = cloth.position.y + dir.y * (lengthPx / 2);
              const dist = Math.sqrt(Math.pow(antiMidX - midX, 2) + Math.pow(antiMidY - midY, 2));
              // 10px以内なら一致とみなす
              if (dist < 10) {
                hasMatchingClothMid = true;
                break;
              }
            }
            if (hasMatchingClothMid) {
              // 青色発光（中点）
              partGlowColor = '#60A5FA';
            } else {
              // 黄色発光（通常のアンチ）
              partGlowColor = '#FACC15';
            }
          } else if (editTargetType === 'ハネ' && part.type === '柱') {
            // 羽編集時の黄色発光（柱）
            partGlowColor = '#FACC15';
          }

          // 選択された発光色と一致する場合のみ、囲いの中にあるかチェック
          if (partGlowColor === targetGlowColor) {
            let isInside = false;

            // 青色発光の場合、先端位置または中点位置で判定
            if (partGlowColor === '#60A5FA') {
              if (part.type === '柱') {
                // 柱は位置だけで判定
                isInside = pointInPolygon(part.position.x, part.position.y, closedPath);
              } else if (part.type === 'ブラケット') {
                // ブラケットの先端位置を計算して判定
                const bracketWidthMm = part.meta?.width ?? (part.meta?.bracketSize === 'W' ? 600 : 355);
                const bracketDirDeg = Number(part.meta?.direction ?? 0);
                const dir = { x: Math.cos((bracketDirDeg * Math.PI) / 180), y: Math.sin((bracketDirDeg * Math.PI) / 180) };
                const widthPx = mmToPx(bracketWidthMm, DEFAULT_SCALE);
                const tipX = part.position.x + dir.x * widthPx;
                const tipY = part.position.y + dir.y * widthPx;
                isInside = pointInPolygon(tipX, tipY, closedPath);
              } else if (part.type === 'アンチ') {
                // アンチの位置（これが中点位置）で判定
                isInside = pointInPolygon(part.position.x, part.position.y, closedPath);
              } else {
                // その他の部材は位置だけで判定
                isInside = pointInPolygon(part.position.x, part.position.y, closedPath);
              }
            } else {
              // 黄色・緑色発光の場合、通常の判定
              if (part.type === '柱') {
                // 柱は位置だけで判定
                isInside = pointInPolygon(part.position.x, part.position.y, closedPath);
              } else if (part.type === '布材') {
                // 布材はラインなので、ラインの一部が囲いの中にあるかチェック
                const lengthMm = Number(part.meta?.length ?? 0);
                const dirDeg = Number(part.meta?.direction ?? 0);
                const dir = { x: Math.cos((dirDeg * Math.PI) / 180), y: Math.sin((dirDeg * Math.PI) / 180) };
                const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
                const line = {
                  x1: part.position.x,
                  y1: part.position.y,
                  x2: part.position.x + dir.x * lengthPx,
                  y2: part.position.y + dir.y * lengthPx,
                };
                isInside = lineIntersectsPolygon(line, closedPath);
              } else if (part.type === 'ブラケット') {
                // ブラケットは位置だけで判定（簡易的）
                isInside = pointInPolygon(part.position.x, part.position.y, closedPath);
              } else if (part.type === 'アンチ') {
                // アンチは矩形なので、矩形の交差をチェック
                const lengthMm = Number(part.meta?.length ?? 0);
                const widthMm = Number(part.meta?.width ?? 400);
                const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
                const widthPx = mmToPx(widthMm, DEFAULT_SCALE);
                const antiRect = {
                  x: part.position.x - lengthPx / 2,
                  y: part.position.y - widthPx / 2,
                  width: lengthPx,
                  height: widthPx,
                };
                isInside = rectIntersectsPolygon(antiRect, closedPath);
              } else {
                // その他の部材は位置だけで判定
                isInside = pointInPolygon(part.position.x, part.position.y, closedPath);
              }
            }

            if (isInside) {
              selectedKeys.push(`${group.id}:${part.id}`);
            }
          }
        }
      }

      // 選択された部材をストアに設定
      selectScaffoldParts(selectedKeys);

      // 柱編集時に青色発光（ブラケットの先端）を選択した場合、柱を自動作図
      if (editTargetType === '柱' && lassoGlowColor === 'blue' && selectedKeys.length > 0) {
        // 選択されたブラケットの先端位置に柱を作図
        for (const key of selectedKeys) {
          const [groupId, partId] = key.split(':');
          const group = scaffoldGroups.find((g) => g.id === groupId);
          if (!group) continue;
          const part = group.parts.find((p) => p.id === partId);
          if (!part || part.type !== 'ブラケット') continue;

          // ブラケットの先端位置を計算
          const bracketWidthMm = part.meta?.width ?? (part.meta?.bracketSize === 'W' ? 600 : 355);
          const bracketDirDeg = Number(part.meta?.direction ?? 0);
          const dir = { x: Math.cos((bracketDirDeg * Math.PI) / 180), y: Math.sin((bracketDirDeg * Math.PI) / 180) };
          const widthPx = mmToPx(bracketWidthMm, DEFAULT_SCALE);
          const tipX = part.position.x + dir.x * widthPx;
          const tipY = part.position.y + dir.y * widthPx;

          // 既存の柱があるかチェック（重複回避）
          const existingPillar = group.parts.find(
            (p) =>
              p.type === '柱' &&
              Math.abs(p.position.x - tipX) < 1 &&
              Math.abs(p.position.y - tipY) < 1
          );

          if (!existingPillar) {
            // 新しい柱を作成
            const newPillar = {
              id: uuidv4(),
              type: '柱' as const,
              position: { x: tipX, y: tipY },
              color: part.color,
              marker: 'circle' as const,
              meta: {
                direction: part.meta?.direction,
                offsetMm: part.meta?.offsetMm,
              },
            };
            updateScaffoldGroup(group.id, {
              parts: [...group.parts, newPillar],
            });
          }
        }
        // 柱作成後は選択をクリア
        selectScaffoldParts([]);
        // 投げ縄作成状態をリセット
        setIsDrawingLasso(false);
        setLassoPath([]);
        lassoPathRef.current = [];
        lastUpdateTimeRef.current = 0;
        return;
      }

      // 選択された部材が1件以上の場合、一括編集カードを表示
      if (selectedKeys.length > 0) {
        if (editTargetType === '柱') {
          setBulkPillarScope('selected');
          setEditSelectionMode('bulk');
        } else if (editTargetType === '布材') {
          setBulkClothScope('selected');
          setEditSelectionMode('bulk');
        } else if (editTargetType === 'ブラケット') {
          setBulkBracketScope('selected');
          setEditSelectionMode('bulk');
        } else if (editTargetType === 'アンチ') {
          // アンチ編集時の緑色発光（アンチ未接ブラケット）を囲った場合の処理
          if (lassoGlowColor === 'green') {
            // 緑色発光（アンチ未接ブラケット）が選択されている場合、追加カードを表示
            const findNoAntiBrackets = () => {
              const result = new Set<string>();
              for (const group of scaffoldGroups) {
                const antiParts = group.parts.filter((p) => p.type === 'アンチ');
                const bracketParts = group.parts.filter((p) => p.type === 'ブラケット');
                for (const b of bracketParts) {
                  const bOff = Number(b.meta?.offsetMm);
                  if (!isFinite(bOff)) continue;
                  const bDirDeg = Number(b.meta?.direction ?? 0);
                  const bN = { x: Math.cos((bDirDeg * Math.PI) / 180), y: Math.sin((bDirDeg * Math.PI) / 180) };
                  const sideThresholdPx = mmToPx(80, DEFAULT_SCALE);
                  const touching = antiParts.some((a) => {
                    const aOff = Number(a.meta?.offsetMm ?? 0);
                    const aLen = Number(a.meta?.length ?? 0);
                    if (!(aLen > 0 && bOff >= aOff - 1e-6 && bOff <= aOff + aLen + 1e-6)) return false;
                    const dx = a.position.x - b.position.x;
                    const dy = a.position.y - b.position.y;
                    const dot = dx * bN.x + dy * bN.y;
                    return dot > sideThresholdPx;
                  });
                  if (!touching) result.add(`${group.id}:${b.id}`);
                }
              }
              return result;
            };
            const noAntiSet = findNoAntiBrackets();
            const selectedNoAnti = selectedKeys.filter((k) => noAntiSet.has(k));
            if (selectedNoAnti.length > 0) {
              useDrawingStore.getState().setBulkAntiScope('selected');
              useDrawingStore.getState().setBulkAntiAction('add');
              setEditSelectionMode('bulk');
            } else {
              // 緑色発光だがアンチ未接ブラケットではない場合（通常のアンチ）
              useDrawingStore.getState().setBulkAntiScope('selected');
              useDrawingStore.getState().setBulkAntiAction('quantity');
              setEditSelectionMode('bulk');
            }
          } else {
            // アンチの一括カードは発光色に合わせて種類を出し分け
            // - 黄色: 枚数（quantity）
            // - 青色: 段数（level）
            useDrawingStore.getState().setBulkAntiScope('selected');
            useDrawingStore
              .getState()
              .setBulkAntiAction(lassoGlowColor === 'yellow' ? 'quantity' : 'level');
            setEditSelectionMode('bulk');
          }
        } else if (editTargetType === 'ハネ') {
          // 羽編集モード時、一括編集カードを表示
          setEditSelectionMode('bulk');
        } else if (editTargetType === '階段') {
          // 階段編集モード時、一括編集カードを表示（必要に応じて実装）
          setEditSelectionMode('bulk');
        }
      }

      // 投げ縄作成状態をリセット
      setIsDrawingLasso(false);
      setLassoPath([]);
      lassoPathRef.current = [];
      lastUpdateTimeRef.current = 0;
      return;
    }

    // パンモード時のドラッグ終了
    if (isPanning) {
      const stage = stageRef.current;
      if (stage) {
        // カーソルをgrabに戻す
        const container = stage.container();
        container.style.cursor = 'grab';
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={canvasScale}
        scaleY={canvasScale}
        x={canvasPosition.x}
        y={canvasPosition.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* グリッドレイヤー（最背面） */}
        <Layer name="grid-layer">
          <GridOverlay
            width={stageSize.width}
            height={stageSize.height}
            scale={canvasScale}
            position={canvasPosition}
          />
        </Layer>

        {/* 足場レイヤー（メイン作図領域） */}
        <Layer name="scaffold-layer">
          {/* 投げ縄モードでの囲いプレビュー（紫点線の自由形状） */}
          {isDrawingLasso && lassoPath.length > 0 && (
            <Group>
              <Line
                points={lassoPath.flatMap((p) => [p.x, p.y])}
                closed={lassoPath.length > 2}
                fill="rgba(168, 85, 247, 0.15)"
                stroke="#A855F7"
                strokeWidth={2.5 / canvasScale}
                dash={[6 / canvasScale, 4 / canvasScale]}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                shadowBlur={4 / canvasScale}
                shadowColor="rgba(168, 85, 247, 0.3)"
                shadowOpacity={0.5}
              />
            </Group>
          )}
          {/* スパン描画プレビュー */}
          <SaxTool
            startPoint={spanStart}
            currentPoint={spanCurrent}
            color={currentColor}
          />
          {/* サックスモード生成済みの足場グループを描画 */}
          <ScaffoldRenderer
            stageWidth={stageSize.width}
            stageHeight={stageSize.height}
            onPillarClick={({ anchor, groupId, partId }) => {
              setPillarCard({ anchor, groupId, partId });
            }}
            onClothClick={({ anchor, groupId, partId }) => {
              setClothCard({ anchor, groupId, partId });
            }}
            onStairClick={({ anchor, groupId, partId }) => {
              const group = useDrawingStore.getState().scaffoldGroups.find((g) => g.id === groupId);
              const part = group?.parts.find((p) => p.id === partId);
              if (!group || !part || part.type !== '布材') return;
              const lengthMm = Number(part.meta?.length ?? 0);
              // 600mm 布材（緑発光）クリック時の特別処理:
              // - 階段編集モードで緑発光している600布材に接する2本の柱から、
              //   「階段矢印ベクトルの逆方向」へ600mmオフセットした位置に2本の柱をまずは作図する
              // - 柱のみ追加（ブラケット/布材/階段矩形は作図しない）
              if (lengthMm === 600) {
                const line = group.meta?.line;
                if (!line) return;

                // クリック対象が本当に「緑発光（階段の矢印と反対側）」だったかを再判定
                // 判定: 階段中心C、布材中点M、矢印ベクトルv に対して (M - C)・v < 0
                const stairs = group.parts.filter(isStairPart);
                if (stairs.length === 0) return;

                // 最寄りの階段を基準に向きを決定（複数ある場合に備える）
                const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
                const dirDegForCloth = Number(part.meta?.direction ?? 0);
                const dirCloth = { x: Math.cos((dirDegForCloth * Math.PI) / 180), y: Math.sin((dirDegForCloth * Math.PI) / 180) };
                const mid = { x: part.position.x + dirCloth.x * (lengthPx / 2), y: part.position.y + dirCloth.y * (lengthPx / 2) };
                // 最寄り階段（中心距離が最小）
                const nearest = stairs.reduce<{ st: StairPart; d2: number } | null>((best, st) => {
                  const d2 = (st.position.x - mid.x) ** 2 + (st.position.y - mid.y) ** 2;
                  if (!best || d2 < best.d2) return { st, d2 };
                  return best;
                }, null);
                const stair = nearest?.st;
                if (!stair) return;
                const vStair = { x: Math.cos(((Number(stair.meta?.direction ?? 0)) * Math.PI) / 180), y: Math.sin(((Number(stair.meta?.direction ?? 0)) * Math.PI) / 180) };
                const dot = (mid.x - stair.position.x) * vStair.x + (mid.y - stair.position.y) * vStair.y;
                if (!(dot < 0)) return; // 反対側（緑）以外は無視

                // 端点（布材に接する2本の柱の座標とみなす）
                const startPos = { x: part.position.x, y: part.position.y };
                const endPos = { x: part.position.x + dirCloth.x * lengthPx, y: part.position.y + dirCloth.y * lengthPx };

                // 階段矢印ベクトルの逆方向（-vStair）へ600mmオフセットした位置に新規柱を配置
                const offPx = mmToPx(600, DEFAULT_SCALE);
                const vOpp = { x: -vStair.x, y: -vStair.y };
                const p0 = { x: startPos.x + vOpp.x * offPx, y: startPos.y + vOpp.y * offPx };
                const p1 = { x: endPos.x + vOpp.x * offPx, y: endPos.y + vOpp.y * offPx };

                const newPillars = [p0, p1].map((pos) => ({
                  /**
                   * 新規柱（markerは通常のcircle）。
                   * meta.directionは仮に階段の矢印逆側（見た目の整合用）を設定するが、
                   * 集計等に影響しないため無指定でも問題なし。
                   */
                  id: randomId(),
                  type: '柱' as const,
                  position: pos,
                  color: part.color,
                  marker: 'circle' as const,
                  meta: { direction: (Number(stair.meta?.direction ?? 0) + 180) % 360 },
                }));

                // 400幅の階段を作図（既存1800/900と同じ幅）。
                // 向きは既存階段ベクトルと同じ。
                // 中心は「作図した2柱の中点」から「矢印ベクトル方向」に 300mm オフセットした位置。
                // こうすることで、階段長さ600mmの手前端がちょうど2柱の中点（p0/p1の中間）にツラ合わせされる。
                const pMid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
                const centerRect = { x: pMid.x + vStair.x * mmToPx(300, DEFAULT_SCALE), y: pMid.y + vStair.y * mmToPx(300, DEFAULT_SCALE) };
                const stairPart = {
                  id: randomId(),
                  type: '階段' as const,
                  position: centerRect,
                  color: part.color,
                  meta: {
                    length: lengthMm, // 600
                    width: 400, // 400 幅（既存階段と同じ）
                    direction: Number(stair.meta?.direction ?? dirDegForCloth), // 既存階段と同じ向き
                    offsetMm: Number(part.meta?.offsetMm ?? 0) + lengthMm / 2,
                    levels: 2, // 二段 → 二等分線（中央1本）
                  },
                };

                updateScaffoldGroup(group.id, { parts: [...group.parts, ...newPillars, stairPart] });
                return;
              }
              // ここから先は 1800/900 スパンをクリックしたときの従来処理
              if (!(lengthMm === 1800 || lengthMm === 900)) return; // 対象長のみ
              const offsetMm = Number(part.meta?.offsetMm ?? 0);
              const line = group.meta?.line;
              if (!line) return;

              // スパン方向ベクトル（布材はスパンと平行）
              const spanAngle = Number(part.meta?.direction ?? calculateAngleDegrees(line.start, line.end));
              const vSpan = { x: Math.cos((spanAngle * Math.PI) / 180), y: Math.sin((spanAngle * Math.PI) / 180) };
              const lenPx = mmToPx(lengthMm, DEFAULT_SCALE);
              const startPos = { x: part.position.x, y: part.position.y };
              const endPos = { x: startPos.x + vSpan.x * lenPx, y: startPos.y + vSpan.y * lenPx };

              // 既存アンチのある側を検出し、反対側を採用
              const outDegLeft = calculateDirection(line.start, line.end, false);
              const radLeft = (outDegLeft * Math.PI) / 180;
              const nLeft = { x: Math.cos(radLeft), y: Math.sin(radLeft) };
              const targetAnti = group.parts.find(
                (p) => p.type === 'アンチ' && Number(p.meta?.offsetMm ?? -1) === offsetMm && Number(p.meta?.length ?? -1) === lengthMm
              );
              let reversedOpp = false;
              if (targetAnti) {
                const vx = targetAnti.position.x - anchor.x;
                const vy = targetAnti.position.y - anchor.y;
                const dotLeft = vx * nLeft.x + vy * nLeft.y; // >0 左側、<0 右側
                reversedOpp = dotLeft > 0; // 反対側へ
              } else {
                // 既存情報が無ければ、現在設定の反転フラグの逆側を使用
                const settingsRev = Boolean(group.meta?.settings?.reversed);
                reversedOpp = !settingsRev;
              }
              const outwardDegOpp = calculateDirection(line.start, line.end, reversedOpp);
              const vOut = { x: Math.cos((outwardDegOpp * Math.PI) / 180), y: Math.sin((outwardDegOpp * Math.PI) / 180) };

              // 端の柱位置から逆方向へ600mm（反対側）
              const d600 = mmToPx(600, DEFAULT_SCALE);
              const tipStart = { x: startPos.x + vOut.x * d600, y: startPos.y + vOut.y * d600 };
              const tipEnd = { x: endPos.x + vOut.x * d600, y: endPos.y + vOut.y * d600 };

              // 追加部材
              const addParts: ScaffoldPart[] = [];
              // 両端に600ブラケット（W）、方向は反対側
              addParts.push({ id: randomId(), type: 'ブラケット', position: { x: startPos.x, y: startPos.y }, color: part.color, meta: { bracketSize: 'W', width: 600, direction: outwardDegOpp, offsetMm } });
              addParts.push({ id: randomId(), type: 'ブラケット', position: { x: endPos.x, y: endPos.y }, color: part.color, meta: { bracketSize: 'W', width: 600, direction: outwardDegOpp, offsetMm: offsetMm + lengthMm } });

              // 600ブラケットと同位置・同方向の600布材（両端分）
              addParts.push({ id: randomId(), type: '布材', position: { x: startPos.x, y: startPos.y }, color: part.color, meta: { length: 600, direction: outwardDegOpp, offsetMm } });
              addParts.push({ id: randomId(), type: '布材', position: { x: endPos.x, y: endPos.y }, color: part.color, meta: { length: 600, direction: outwardDegOpp, offsetMm: offsetMm + lengthMm } });

              // 反対側に同じスパン（並行布材）: 階段用の並行布材であることを識別（stairParallel:true）
              addParts.push({ id: randomId(), type: '布材', position: { x: tipStart.x, y: tipStart.y }, color: part.color, meta: { length: lengthMm, direction: spanAngle, offsetMm, stairParallel: true } });

              // 新スパン両端に柱
              addParts.push({ id: randomId(), type: '柱', position: { x: tipStart.x, y: tipStart.y }, color: part.color, marker: 'circle', meta: { direction: outwardDegOpp, offsetMm } });
              addParts.push({ id: randomId(), type: '柱', position: { x: tipEnd.x, y: tipEnd.y }, color: part.color, marker: 'circle', meta: { direction: outwardDegOpp, offsetMm: offsetMm + lengthMm } });

              // 階段の矩形（幅400mm）。中心は元スパン中心から反対側へ350mm（Wの中心オフセット）
              const midOrig = { x: (startPos.x + endPos.x) / 2, y: (startPos.y + endPos.y) / 2 };
              const centerRect = { x: midOrig.x + vOut.x * mmToPx(350, DEFAULT_SCALE), y: midOrig.y + vOut.y * mmToPx(350, DEFAULT_SCALE) };
              addParts.push({ id: randomId(), type: '階段', position: centerRect, color: part.color, meta: { length: lengthMm, width: 400, direction: spanAngle, offsetMm: offsetMm + lengthMm / 2 } });

              updateScaffoldGroup(group.id, { parts: [...group.parts, ...addParts] });
            }}
            onStairBraceClick={({ anchor, groupId, partId }) => {
              // 階段編集時の青色発光「中点」クリック → 筋交数量カード表示
              setBraceCard({ anchor, groupId, partId });
            }}
            onClothSplitStart={({ groupId, partId }) => {
              const group = useDrawingStore.getState().scaffoldGroups.find((g) => g.id === groupId);
              const part = group?.parts.find((p) => p.id === partId);
              if (group && part && part.type === '布材') {
                const lengthMm = Number(part.meta?.length ?? 0);
                const dirDeg = Number(part.meta?.direction ?? 0);
                const start = { x: part.position.x, y: part.position.y };
                const dir = { x: Math.cos((dirDeg * Math.PI) / 180), y: Math.sin((dirDeg * Math.PI) / 180) };
                const leftMm = Math.max(150, Math.floor(lengthMm / 2 / 150) * 150);
                const anchorCanvas = {
                  x: start.x + dir.x * mmToPx(leftMm, DEFAULT_SCALE),
                  y: start.y + dir.y * mmToPx(leftMm, DEFAULT_SCALE),
                };
                setClothSplit({ groupId, partId, leftMm, rightMm: lengthMm - leftMm, anchorCanvas });
              }
            }}
            onBracketClick={({ anchor, groupId, partId }) => {
              setBracketCard({ anchor, groupId, partId });
            }}
            onAntiClick={({ anchor, groupId, partId }) => {
              setAntiCard({ anchor, groupId, partId });
            }}
            onAntiLevelClick={({ anchor, groupId, partId }) => {
              setAntiLevelCard({ anchor, groupId, partId });
            }}
            onBracketConfigClick={({ anchor, groupId, partId }) => {
              setBracketConfigCard({ anchor, groupId, partId });
            }}
            onBracketConfigAtPillar={({ anchor, groupId, pillarId }) => {
              setBracketConfigCard({ anchor, groupId, pillarId });
            }}
            onHaneConfigClick={({ anchor, groupId, partId }) => {
              setHaneCard({ anchor, groupId, partId });
            }}
            onViewPartHover={(info) => {
              setHoveredViewPart(info);
            }}
            onAntiAddRequest={({ anchor, groupId, bracketId }) => {
              setAntiAddCard({ anchor, groupId, bracketId });
            }}
            onDeleteChoiceRequest={({ anchor, groupId, candidates }) => {
              setDeleteSelectCard({ anchor, groupId, candidates });
            }}
          />
        </Layer>

        {/* 注記レイヤー（メモやテキスト） */}
        <Layer name="memo-layer">
          {/* メモ描画プレビュー */}
          {isDrawingMemo && memoStart && memoCurrent && (
            <Group>
              <Rect
                x={Math.min(memoStart.x, memoCurrent.x)}
                y={Math.min(memoStart.y, memoCurrent.y)}
                width={Math.abs(memoCurrent.x - memoStart.x)}
                height={Math.abs(memoCurrent.y - memoStart.y)}
                fill="rgba(255, 255, 200, 0.3)"
                stroke="#FCD34D"
                strokeWidth={2 / canvasScale}
                dash={[5 / canvasScale, 5 / canvasScale]}
              />
            </Group>
          )}
          {/* メモを描画 */}
          {memos.map((memo) => (
            <MemoRenderer
              key={memo.id}
              memo={memo}
              scale={canvasScale}
              isSelected={selectedMemoId === memo.id}
              onClick={(memoId, anchor) => {
                setMemoCard({ anchor, memoId });
                setSelectedMemoId(memoId);
              }}
              onDragEnd={(memoId, position) => {
                updateMemo(memoId, { position });
              }}
              setTransformerTarget={setTransformerTarget}
            />
          ))}
          {/* Transformer（リサイズ用） */}
          {selectedMemoId && currentMode === 'memo' && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // 最小サイズを制限
                if (Math.abs(newBox.width) < 100 || Math.abs(newBox.height) < 60) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={false}
              borderEnabled={true}
              borderStroke="#F59E0B"
              borderStrokeWidth={2 / canvasScale}
              anchorFill="#F59E0B"
              anchorStroke="#FFFFFF"
              anchorSize={8 / canvasScale}
            />
          )}
        </Layer>
      </Stage>

      {/* 柱の数量調整カード（オーバーレイ：単体/統合版） */}
      {pillarCard && (
        <PillarQuantityCardUnified
          kind="single"
          groupId={pillarCard.groupId}
          partId={pillarCard.partId}
          screenPosition={{
            // キャンバス座標 → スクリーン座標へ変換し、少し右下へオフセット
            left: pillarCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: pillarCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setPillarCard(null)}
        />
      )}

      {/* 柱の一括数量調整カード（統合版）。選択対象 or 全柱 */}
      {currentMode === 'edit' && editTargetType === '柱' && editSelectionMode === 'bulk' && (selectedScaffoldPartKeys.length > 0 || bulkPillarScope === 'all') && (() => {
        // アンカー（1件目の柱座標を採用、なければキャンバス中央）
        let anchorCanvas = { x: stageSize.width / 2 / canvasScale, y: stageSize.height / 2 / canvasScale };
        const firstKey = selectedScaffoldPartKeys[0];
        const [gid, pid] = firstKey?.split(':') ?? [];
        const g = scaffoldGroups.find((gg) => gg.id === gid);
        const p = g?.parts.find((pp) => pp.id === pid);
        if (g && p && p.type === '柱') {
          anchorCanvas = { x: p.position.x, y: p.position.y };
        }
        return (
          <PillarQuantityCardUnified
            kind="bulk"
            scope={bulkPillarScope === 'all' ? 'all' : 'selected'}
            screenPosition={{
              left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
              top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
            }}
            onClose={() => setEditSelectionMode('select')}
          />
        );
      })()}

      {/* 布材の数量調整カード（オーバーレイ：単体/統合版） */}
      {clothCard && (
        <ClothQuantityCardUnified
          kind="single"
          groupId={clothCard.groupId}
          partId={clothCard.partId}
          screenPosition={{
            left: clothCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: clothCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setClothCard(null)}
        />
      )}

      {/* 分割プレビューラベル */}
      {clothSplit && (() => {
        // プレビューも許容寸法分割＋150寄せを表示
        const allowed = [1800, 1500, 1200, 900, 600, 300, 150];
        const splitIntoAllowed = (len: number): number[] => {
          let remaining = len;
          const segs: number[] = [];
          for (const a of allowed) {
            while (remaining >= a) {
              segs.push(a);
              remaining -= a;
            }
          }
          if (remaining > 0) {
            const snap = Math.round(remaining / 150) * 150;
            if (snap > 0) segs.push(snap);
          }
          return segs;
        };
        const moveAll150To = (segs: number[], side: 'start' | 'end') => {
          const s150 = segs.filter((v) => v === 150);
          const others = segs.filter((v) => v !== 150);
          if (s150.length === 0) return segs;
          return side === 'start' ? [...s150, ...others] : [...others, ...s150];
        };
        const leftSegs = moveAll150To(splitIntoAllowed(clothSplit.leftMm), 'end');
        const rightSegs = moveAll150To(splitIntoAllowed(clothSplit.rightMm), 'start');
        const text = `${leftSegs.join('+')} / ${rightSegs.join('+')}`;
  return (
    <div
          className="fixed z-30 rounded-md border px-2 py-1 text-[11px] font-semibold shadow-sm border-slate-300 bg-white text-black dark:border-slate-700 dark:bg-black dark:text-white"
          style={{
            left: clothSplit.anchorCanvas.x * canvasScale + canvasPosition.x + 8,
            top: clothSplit.anchorCanvas.y * canvasScale + canvasPosition.y - 24,
          }}
        >
          {text}
        </div>
        );
      })()}

      {/* 布材の一括数量調整カード（統合版）。選択対象 or 全布材 */}
      {currentMode === 'edit' && editTargetType === '布材' && editSelectionMode === 'bulk' && (selectedScaffoldPartKeys.length > 0 || bulkClothScope === 'all') && (() => {
        // アンカー（1件目の布材座標、なければキャンバス中央）
        let anchorCanvas = { x: stageSize.width / 2 / canvasScale, y: stageSize.height / 2 / canvasScale };
        const firstKey = selectedScaffoldPartKeys[0];
        const [gid, pid] = firstKey?.split(':') ?? [];
        const g = scaffoldGroups.find((gg) => gg.id === gid);
        const p = g?.parts.find((pp) => pp.id === pid);
        if (g && p && p.type === '布材') {
          anchorCanvas = { x: p.position.x, y: p.position.y };
        }
        return (
          <ClothQuantityCardUnified
            kind="bulk"
            scope={bulkClothScope === 'all' ? 'all' : 'selected'}
            screenPosition={{
              left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
              top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
            }}
            onClose={() => setEditSelectionMode('select')}
          />
        );
      })()}

      {/* ブラケット一括操作: 選択が柱（青色発光）を含む場合は方向・寸法カード、
          そうでなければ数量カード（既存）を表示 */}
      {currentMode === 'edit' && editTargetType === 'ブラケット' && editSelectionMode === 'bulk' && (selectedScaffoldPartKeys.length > 0 || bulkBracketScope === 'all') && (() => {
        // 選択に柱が含まれるか判定
        let hasPillar = false;
        let anchorCanvas = { x: stageSize.width / 2 / canvasScale, y: stageSize.height / 2 / canvasScale };
        for (const key of selectedScaffoldPartKeys) {
          const [gid, pid] = key.split(':');
          const g = scaffoldGroups.find((gg) => gg.id === gid);
          const p = g?.parts.find((pp) => pp.id === pid);
          if (g && p && p.type === '柱') {
            hasPillar = true;
            anchorCanvas = { x: p.position.x, y: p.position.y };
            break;
          }
        }
        if (hasPillar) {
          return (
            <BracketConfigCardBulk
              screenPosition={{
                left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
                top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
              }}
              onClose={() => setEditSelectionMode('select')}
            />
          );
        }
        // 柱が含まれない（＝ブラケット選択等）の場合は既存の数量カードを表示
        const firstKey = selectedScaffoldPartKeys[0];
        const [gid, pid] = firstKey?.split(':') ?? [];
        const g = scaffoldGroups.find((gg) => gg.id === gid);
        const p = g?.parts.find((pp) => pp.id === pid);
        if (g && p && p.type === 'ブラケット') {
          anchorCanvas = { x: p.position.x, y: p.position.y };
        }
        return (
          <BracketQuantityCardUnified
            kind="bulk"
            scope={bulkBracketScope === 'all' ? 'all' : 'selected'}
            screenPosition={{
              left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
              top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
            }}
            onClose={() => setEditSelectionMode('select')}
          />
        );
      })()}

      {/* 分割方式選択カード */}
      {splitConfirm && (
        <div
          className="glass-scope fixed z-40 rounded-2xl border border-white/40 bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30 dark:border-slate-700/60 dark:shadow-slate-900/50"
          style={{ left: splitConfirm.screen.left, top: splitConfirm.screen.top, width: 320 }}
        >
          <div className="relative px-4 py-3 border-b border-white/20 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">分割方法を選択</h3>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">{splitConfirm.leftMm}/{splitConfirm.rightMm} に分割します</p>
          </div>
          <div className="p-3 flex items-center justify-end gap-2">
            <button
              className="group relative flex h-8 items-center justify-center rounded-lg px-3 text-sm text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              onClick={() => setSplitConfirm(null)}
              aria-label="キャンセル"
            >
              キャンセル
            </button>
            <button
              className="group relative flex h-8 items-center justify-center rounded-lg px-3 text-sm text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              onClick={() => {
                applyClothSplit('with-anti', splitConfirm);
                setSplitConfirm(null);
              }}
            >
              アンチも
            </button>
            <button
              className="group relative flex h-8 items-center justify-center rounded-lg px-3 text-sm text-slate-700 hover:bg-white/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all"
              onClick={() => {
                applyClothSplit('cloth-only', splitConfirm);
                setSplitConfirm(null);
              }}
            >
              布材のみ
            </button>
          </div>
        </div>
      )}

      {/* ブラケットの数量調整カード（オーバーレイ：単体/統合版） - 選択モード時は表示しない */}
      {bracketCard && editSelectionMode === null && (
        <BracketQuantityCardUnified
          kind="single"
          groupId={bracketCard.groupId}
          partId={bracketCard.partId}
          screenPosition={{
            left: bracketCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: bracketCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setBracketCard(null)}
        />
      )}

      {/* 筋交の数量調整カード（オーバーレイ） */}
      {braceCard && (
        <BraceQuantityCard
          groupId={braceCard.groupId}
          partId={braceCard.partId}
          screenPosition={{
            left: braceCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: braceCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setBraceCard(null)}
        />
      )}

      {/* アンチの数量調整カード（オーバーレイ） */}
  {antiCard && (
        <AntiQuantityCardUnified
          kind="single"
          groupId={antiCard.groupId}
          partId={antiCard.partId}
          screenPosition={{
            left: antiCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: antiCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setAntiCard(null)}
        />
      )}

      {/* アンチの段数調整カード（オーバーレイ：単体/統合版） - 選択モード時は表示しない */}
      {antiLevelCard && (
        <AntiLevelCardUnified
          kind="single"
          groupId={antiLevelCard.groupId}
          partId={antiLevelCard.partId}
          screenPosition={{
            left: antiLevelCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: antiLevelCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setAntiLevelCard(null)}
        />
      )}

      {/* アンチ追加カード（アンチ未接ブラケットをクリック時に表示） */}
      {antiAddCard && (
        <AntiAddCard
          groupId={antiAddCard.groupId}
          bracketId={antiAddCard.bracketId}
          screenPosition={{
            left: antiAddCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: antiAddCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setAntiAddCard(null)}
          onCreated={() => setAntiAddCard(null)}
        />
      )}

      {/* 削除対象選択カード */}
      {deleteSelectCard && (
        <DeleteSelectCard
          screenPosition={{
            left: deleteSelectCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: deleteSelectCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          candidates={deleteSelectCard.candidates}
          onSelect={(c) => {
            const { groupId } = deleteSelectCard;
            const g = useDrawingStore.getState().scaffoldGroups.find((gg) => gg.id === groupId);
            if (!g) return setDeleteSelectCard(null);
            const next = { ...g, parts: g.parts.filter((p) => p.id !== c.id) };
            updateScaffoldGroup(groupId, next);
            setDeleteSelectCard(null);
          }}
          onClose={() => setDeleteSelectCard(null)}
        />
      )}

      {/* アンチの一括カード（数量/段数/追加） */}
      {currentMode === 'edit' && editTargetType === 'アンチ' && editSelectionMode === 'bulk' && (() => {
        const { bulkAntiScope, bulkAntiAction } = useDrawingStore.getState();
        // 追加（add）は選択がなくても 'all' の場合に開く
        if (bulkAntiAction !== 'add' && !(selectedScaffoldPartKeys.length > 0 || bulkAntiScope === 'all')) return null;

        // アンカー（既定：画面中央／選択があればその位置）
        let anchorCanvas = { x: stageSize.width / 2 / canvasScale, y: stageSize.height / 2 / canvasScale };
        const firstKey = selectedScaffoldPartKeys[0];
        const [gid, pid] = firstKey?.split(':') ?? [];
        const g = scaffoldGroups.find((gg) => gg.id === gid);
        const p = g?.parts.find((pp) => pp.id === pid);
        if (g && p) {
          anchorCanvas = { x: p.position.x, y: p.position.y };
        }

        if (bulkAntiAction === 'add') {
          // 緑発光（アンチ未接ブラケット）対象の抽出
          const noAntiKeys = new Set<string>();
          const bracketMap = new Map<string, { groupId: string; part: BracketPart }>();
          for (const gg of scaffoldGroups) {
            const antiParts = gg.parts.filter(isAntiPart);
            const bracketParts = gg.parts.filter(isBracketPart);
            for (const b of bracketParts) {
              const bOff = Number(b.meta?.offsetMm);
              if (!isFinite(bOff)) continue;
              const bDirDeg = Number(b.meta?.direction ?? 0);
              const bN = { x: Math.cos((bDirDeg * Math.PI) / 180), y: Math.sin((bDirDeg * Math.PI) / 180) };
              const sideThresholdPx = mmToPx(80, DEFAULT_SCALE);
              const touching = antiParts.some((a) => {
                const aOff = Number(a.meta?.offsetMm ?? 0);
                const aLen = Number(a.meta?.length ?? 0);
                if (!(aLen > 0 && bOff >= aOff - 1e-6 && bOff <= aOff + aLen + 1e-6)) return false;
                const dx = a.position.x - b.position.x;
                const dy = a.position.y - b.position.y;
                const dot = dx * bN.x + dy * bN.y;
                return dot > sideThresholdPx;
              });
              if (!touching) {
                const key = `${gg.id}:${b.id}`;
                noAntiKeys.add(key);
                bracketMap.set(key, { groupId: gg.id, part: b });
              }
            }
          }

          // 対象（選択 or 全体）を作成
          const targets: { groupId: string; bracketId: string }[] = [];
          if (bulkAntiScope === 'all') {
            for (const key of noAntiKeys) {
              const [gId, pId] = key.split(':');
              targets.push({ groupId: gId, bracketId: pId });
            }
          } else {
            for (const key of selectedScaffoldPartKeys) {
              if (noAntiKeys.has(key)) {
                const [gId, pId] = key.split(':');
                targets.push({ groupId: gId, bracketId: pId });
              }
            }
          }

          if (targets.length === 0) return null;
          // アンカー：最初の対象の位置
          const t0 = bracketMap.get(`${targets[0].groupId}:${targets[0].bracketId}`);
          if (t0) anchorCanvas = { x: t0.part.position.x, y: t0.part.position.y };

          return (
            <AntiAddCard
              kind="bulk"
              targets={targets}
              screenPosition={{
                left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
                top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
              }}
              onClose={() => setEditSelectionMode('select')}
              onCreated={() => setEditSelectionMode('select')}
            />
          );
        }

        // 既存の段数/数量
        return bulkAntiAction === 'level' ? (
          <AntiLevelCardUnified
            kind="bulk"
            scope={bulkAntiScope === 'all' ? 'all' : 'selected'}
            screenPosition={{
              left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
              top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
            }}
            onClose={() => setEditSelectionMode('select')}
          />
        ) : (
          <AntiQuantityCardUnified
            kind="bulk"
            scope={bulkAntiScope === 'all' ? 'all' : 'selected'}
            screenPosition={{
              left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
              top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
            }}
            onClose={() => setEditSelectionMode('select')}
          />
        );
      })()}

      {/* ブラケットの方向と寸法選択カード（オーバーレイ） */}
      {bracketConfigCard && (
        <BracketConfigCard
          groupId={bracketConfigCard.groupId}
          partId={bracketConfigCard.partId}
          pillarId={bracketConfigCard.pillarId}
          screenPosition={{
            left: bracketConfigCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: bracketConfigCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setBracketConfigCard(null)}
        />
      )}

      {/* ハネの方向と寸法選択カード（オーバーレイ） */}
      {haneCard && (
        <HaneConfigCard
          groupId={haneCard.groupId}
          partId={haneCard.partId}
          screenPosition={{
            left: haneCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: haneCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setHaneCard(null)}
        />
      )}

      {/* ハネの一括設定カード（選択対象 or 全柱（黄色発光）） */}
      {currentMode === 'edit' && editTargetType === 'ハネ' && editSelectionMode === 'bulk' && selectedScaffoldPartKeys.length > 0 && (() => {
        // アンカー（1件目の柱座標、なければ中央）
        let anchorCanvas = { x: stageSize.width / 2 / canvasScale, y: stageSize.height / 2 / canvasScale };
        const firstKey = selectedScaffoldPartKeys[0];
        const [gid, pid] = firstKey?.split(':') ?? [];
        const g = scaffoldGroups.find((gg) => gg.id === gid);
        const p = g?.parts.find((pp) => pp.id === pid);
        if (g && p && p.type === '柱') {
          anchorCanvas = { x: p.position.x, y: p.position.y };
        }
        return (
          <HaneConfigCard
            kind="bulk"
            screenPosition={{
              left: anchorCanvas.x * canvasScale + canvasPosition.x + 12,
              top: anchorCanvas.y * canvasScale + canvasPosition.y + 12,
            }}
            onClose={() => setEditSelectionMode('select')}
          />
        );
      })()}

      {/* メモ編集カード（オーバーレイ） */}
      {memoCard && (
        <MemoCard
          memoId={memoCard.memoId}
          screenPosition={{
            left: memoCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: memoCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => {
            setMemoCard(null);
            setSelectedMemoId(null);
          }}
        />
      )}

      {/* ビューモード時の情報カード（オーバーレイ） */}
      {currentMode === 'view' && hoveredViewPart && (() => {
        const group = scaffoldGroups.find((g) => g.id === hoveredViewPart.groupId);
        const part = group?.parts.find((p) => p.id === hoveredViewPart.partId);
        if (!group || !part) return null;
        return (
          <ViewModeInfoCard
            screenPosition={hoveredViewPart.screenPosition}
            part={part}
          />
        );
      })()}
    </div>
  );
}
