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

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect, Transformer } from 'react-konva';
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
import AntiQuantityCard from './AntiQuantityCard';
import AntiLevelCard from './AntiLevelCard';
import BracketConfigCard from './BracketConfigCard';
import HaneConfigCard from './HaneConfigCard';
import BraceQuantityCard from './BraceQuantityCard';
import MemoRenderer from './MemoRenderer';
import MemoCard from './MemoCard';
import ViewModeInfoCard from './ViewModeInfoCard';
// 旧: BulkPillarQuantityCard は統合版へ移行

/**
 * CanvasStageコンポーネント
 *
 * Konva Stageをラップし、ズーム・パン機能を提供する
 */
export default function CanvasStage() {
  // Konva Stageへの参照
  const stageRef = useRef<any>(null);

  // キャンバスのサイズ状態
  const [stageSize, setStageSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Zustandストアから状態と操作を取得
  const {
    canvasScale,
    canvasPosition,
    currentTool,
    currentColor,
    bracketSize,
    directionReversed,
    setCanvasScale,
    setCanvasPosition,
    setMousePosition,
    addScaffoldGroup,
    setBracketSize,
    setDirectionReversed,
    updateScaffoldGroup,
    // 追加: 一括編集/選択
    selectedScaffoldPartKeys,
    editSelectionMode,
    editTargetType,
    setEditSelectionMode,
    setBulkPillarScope,
    scaffoldGroups,
    bulkPillarScope,
    bulkClothScope,
    setBulkClothScope,
    bulkBracketScope,
    setBulkBracketScope,
    // メモ関連
    memos,
    addMemo,
    updateMemo,
    selectedMemoId,
    setSelectedMemoId,
  } = useDrawingStore();

  const { currentMode } = useDrawingModeStore();

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

  // グリッド設定を取得
  const { snapToGrid, gridSize } = useDrawingStore();

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
  const transformerRef = useRef<any>(null);
  const transformerTargetRef = useRef<any>(null);

  // Transformerのターゲットを設定する関数
  const setTransformerTarget = (target: any) => {
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
    const clothParts: any[] = [];
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
    let addParts: any[] = [];
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
      const snap = Math.round(remaining / 150) * 150;
      if (snap > 0) segs.push(snap);
    }
    return segs;
  };
  const moveOne150To = (segs: number[], side: 'start' | 'end') => {
    const idx = segs.indexOf(150);
    if (idx === -1) return segs;
    const s = [...segs];
    s.splice(idx, 1);
    return side === 'start' ? [150, ...s] : [...s, 150];
  };

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

  /** ブラケット設定カードの状態 */
  const [bracketConfigCard, setBracketConfigCard] = useState<
    | {
        anchor: { x: number; y: number };
        groupId: string;
        partId: string;
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
  }, [isPanning]);

  /**
   * Enterキー: 柱・選択モードで一括編集カードを開く
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.code !== 'Enter') return;
      if (currentMode !== 'edit') return;
      // 複数選択時に Enter で一括カードを開く（柱/布材）
      if (!(selectedScaffoldPartKeys.length > 1)) return;
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
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentMode, editTargetType, selectedScaffoldPartKeys.length, setEditSelectionMode, setBulkPillarScope, setBulkClothScope, setBulkBracketScope]);

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
  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

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
  const handleMouseDown = (e: any) => {
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

      setIsDrawingMemo(true);
      setMemoStart({ x: canvasX, y: canvasY });
      setMemoCurrent({ x: canvasX, y: canvasY });
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
  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // マウス座標をストアに保存（アンダーバー表示用）
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
    if (isDrawingSpan) {
      setSpanCurrent({ x: canvasX, y: canvasY });
      return;
    }

    // メモ作成中のプレビュー更新
    if (isDrawingMemo) {
      setMemoCurrent({ x: canvasX, y: canvasY });
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
      const dx = spanCurrent.x - spanStart.x;
      const dy = spanCurrent.y - spanStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        // スパン自動生成エンジンを呼び出し
        const scaffoldGroup = generateScaffoldSpan({
          start: spanStart,
          end: spanCurrent,
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
        <Layer>
          <GridOverlay
            width={stageSize.width}
            height={stageSize.height}
            scale={canvasScale}
            position={canvasPosition}
          />
        </Layer>

        {/* 足場レイヤー（メイン作図領域） */}
        <Layer name="scaffold-layer">
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
                const stairs = group.parts.filter((p) => p.type === '階段');
                if (stairs.length === 0) return;

                // 最寄りの階段を基準に向きを決定（複数ある場合に備える）
                const lengthPx = mmToPx(lengthMm, DEFAULT_SCALE);
                const dirDegForCloth = Number(part.meta?.direction ?? 0);
                const dirCloth = { x: Math.cos((dirDegForCloth * Math.PI) / 180), y: Math.sin((dirDegForCloth * Math.PI) / 180) };
                const mid = { x: part.position.x + dirCloth.x * (lengthPx / 2), y: part.position.y + dirCloth.y * (lengthPx / 2) };
                // 最寄り階段（中心距離が最小）
                const nearest = stairs.reduce((best: any, st: any) => {
                  const d2 = (st.position.x - mid.x) ** 2 + (st.position.y - mid.y) ** 2;
                  if (!best || d2 < best.d2) return { st, d2 };
                  return best;
                }, null as null | { st: any; d2: number });
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

                const newPillars = [p0, p1].map((pos, i) => ({
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
              const addParts: any[] = [];
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
            onHaneConfigClick={({ anchor, groupId, partId }) => {
              setHaneCard({ anchor, groupId, partId });
            }}
            onViewPartHover={(info) => {
              setHoveredViewPart(info);
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
        <AntiQuantityCard
          groupId={antiCard.groupId}
          partId={antiCard.partId}
          screenPosition={{
            left: antiCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: antiCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setAntiCard(null)}
        />
      )}

      {/* アンチの段数調整カード（オーバーレイ） */}
      {antiLevelCard && (
        <AntiLevelCard
          groupId={antiLevelCard.groupId}
          partId={antiLevelCard.partId}
          screenPosition={{
            left: antiLevelCard.anchor.x * canvasScale + canvasPosition.x + 12,
            top: antiLevelCard.anchor.y * canvasScale + canvasPosition.y + 12,
          }}
          onClose={() => setAntiLevelCard(null)}
        />
      )}

      {/* ブラケットの方向と寸法選択カード（オーバーレイ） */}
      {bracketConfigCard && (
        <BracketConfigCard
          groupId={bracketConfigCard.groupId}
          partId={bracketConfigCard.partId}
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
            groupId={group.id}
          />
        );
      })()}
    </div>
  );
}
