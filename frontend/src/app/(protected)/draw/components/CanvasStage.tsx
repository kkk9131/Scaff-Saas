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
import { Stage, Layer } from 'react-konva';
import { useDrawingStore } from '@/stores/drawingStore';
import { useDrawingModeStore } from '@/stores/drawingModeStore';
import { generateScaffoldSpan } from '@/lib/sax/spanGenerator';
import GridOverlay from './GridOverlay';
import SaxTool from './SaxTool';

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
  } = useDrawingStore();

  const { currentMode } = useDrawingModeStore();

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
      if (e.code === 'Space' && !isPanning) {
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
   * Shift/Altキーでサックスモード設定を切替
   * Shiftキー: ブラケットサイズW/S切替
   * Altキー: 方向反転フラグの切替
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shiftキーでブラケットサイズを切替（W ⇔ S）
      if (e.key === 'Shift' && currentMode === 'draw' && currentTool === 'scaffold') {
        e.preventDefault();
        setBracketSize(bracketSize === 'W' ? 'S' : 'W');
      }

      // Altキーで方向反転フラグをON
      if (e.key === 'Alt' && currentMode === 'draw' && currentTool === 'scaffold') {
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

    // サックスモードでのスパン描画開始
    if (currentMode === 'draw' && currentTool === 'scaffold' && !isPanning) {
      // キャンバス座標系に変換（スケールとポジションを考慮）
      const canvasX = (pos.x - canvasPosition.x) / canvasScale;
      const canvasY = (pos.y - canvasPosition.y) / canvasScale;

      setIsDrawingSpan(true);
      setSpanStart({ x: canvasX, y: canvasY });
      setSpanCurrent({ x: canvasX, y: canvasY });
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
    const canvasX = (pos.x - canvasPosition.x) / canvasScale;
    const canvasY = (pos.y - canvasPosition.y) / canvasScale;
    setMousePosition({ x: Math.round(canvasX), y: Math.round(canvasY) });

    // スパン描画中のプレビュー更新
    if (isDrawingSpan) {
      setSpanCurrent({ x: canvasX, y: canvasY });
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

        // ストアに追加
        addScaffoldGroup(scaffoldGroup);
      }

      // スパン描画状態をリセット
      setIsDrawingSpan(false);
      setSpanStart(null);
      setSpanCurrent(null);
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
          {/* ここに足場の図形要素が描画される（将来実装） */}
        </Layer>

        {/* 注記レイヤー（メモやテキスト） */}
        <Layer name="memo-layer">
          {/* ここに注記・メモが描画される（将来実装） */}
        </Layer>
      </Stage>
    </div>
  );
}
