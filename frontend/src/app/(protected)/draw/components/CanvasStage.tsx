/**
 * CanvasStage.tsx
 * Konva.jsを使った作図キャンバスのメインコンポーネント
 *
 * 機能:
 * - Konva Stageの初期化
 * - レイヤー構成（足場レイヤー、注記レイヤー）
 * - ズーム機能（ホイールズーム）
 * - パン機能（スペース+ドラッグ）
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { useDrawingStore } from '@/stores/drawingStore';
import GridOverlay from './GridOverlay';

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
    setCanvasScale,
    setCanvasPosition,
    setMousePosition,
  } = useDrawingStore();

  // パンモード（スペースキー押下中）の状態
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 });

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
   */
  const handleMouseDown = (e: any) => {
    if (isPanning) {
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        setLastPointerPosition(pos);
        // ドラッグ中はカーソルをgrabbingに変更
        const container = stage.container();
        container.style.cursor = 'grabbing';
      }
    }
  };

  /**
   * マウスムーブハンドラー
   * パンモード時のドラッグでキャンバスを移動
   * マウス座標も更新してアンダーバーに表示
   */
  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();

    // マウス座標をストアに保存（アンダーバー表示用）
    if (pos) {
      // キャンバス座標系に変換（スケールとポジションを考慮）
      const x = (pos.x - canvasPosition.x) / canvasScale;
      const y = (pos.y - canvasPosition.y) / canvasScale;
      setMousePosition({ x: Math.round(x), y: Math.round(y) });
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
   */
  const handleMouseUp = () => {
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
