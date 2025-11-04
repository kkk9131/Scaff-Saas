/**
 * canvasStageExporter.ts
 *
 * 最小構成のPNGエクスポートユーティリティ。
 * - Stage参照を登録し、PNG dataURL を取得する
 * - 出力時にグリッドと発光（lighter/ラジアル）を一時的に非表示
 * - 出力後は可視状態を元に戻す
 */

import type { Stage } from 'konva/lib/Stage';
import type { Layer } from 'konva/lib/Layer';
import type { Node as KonvaNode } from 'konva/lib/Node';
import type { Text as KonvaText } from 'konva/lib/shapes/Text';
import type { Rect as KonvaRect } from 'konva/lib/shapes/Rect';
import type { ScaffoldGroup } from '@/types/scaffold';
import type { Memo } from '@/stores/drawingStore';

type KonvaModule = typeof import('konva');

export type KonvaStageLike = Stage;
export type ScaffoldGroupForExport = ScaffoldGroup;
export type MemoForExport = Memo;

let stageRef: Stage | null = null;

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

const getKonvaModule = (): KonvaModule | undefined => {
  if (typeof window === 'undefined') return undefined;
  const globalWindow = window as typeof window & { Konva?: KonvaModule };
  return globalWindow.Konva;
};

const isLayer = (node: KonvaNode | null): node is Layer =>
  Boolean(node && typeof (node as Layer).add === 'function');

/** Stage を登録/解除 */
export function registerStage(stage: Stage | null) {
  stageRef = stage;
}

/** Stage から PNG dataURL を取得 */
export async function exportStageToDataURL(options?: {
  pixelRatio?: number;
  mimeType?: string;
  quality?: number;
  whiteBg?: boolean;
  hideGrid?: boolean;
  scaffoldGroups?: ScaffoldGroup[]; // 柱情報とアンチ枚数を描画するために追加
  memos?: Memo[]; // メモを描画するために追加
}): Promise<string | null> {
  if (!stageRef) {
    console.error('❌ Stage参照が未登録');
    alert('エラー: Stageが登録されていません。ページをリロードしてください。');
    return null;
  }

  const stage = stageRef;

  // Stageの基本情報をチェック
  const stageWidth = stage.width();
  const stageHeight = stage.height();

  if (stageWidth === 0 || stageHeight === 0) {
    console.error('❌ Stageのサイズが0です');
    alert('エラー: キャンバスサイズが不正です');
    return null;
  }

  const { pixelRatio = 2, mimeType = 'image/png', quality = 1, whiteBg = true, hideGrid = true, scaffoldGroups = [], memos = [] } = options || {};

  // 切り取り範囲の変数（後で白背景合成で使用）
  let cropX = 0;
  let cropY = 0;
  let cropWidth = stageWidth;
  let cropHeight = stageHeight;

  // グリッドとハンドルの復元用（エラー時にも使えるようにスコープを外に出す）
  let gridLayer: Layer | null = null;
  let origGridVisible: boolean | undefined;
  const handleNodes: Array<{ node: KonvaNode; visible: boolean }> = [];
  const addedTextNodes: KonvaNode[] = []; // 追加したテキストノードを記録（後で削除するため）

  try {
    // グリッドレイヤーを一時非表示
    gridLayer = stage.findOne('.grid-layer') as Layer | null;
    if (hideGrid && gridLayer) {
      origGridVisible = gridLayer.visible();
      gridLayer.visible(false);
    }

    // スパン入れ替えハンドルを一時非表示（複数手法で確実に検索）
    // 方法1: Konvaのfindメソッド（セレクタ形式）
    const handlesByFindSelector = stage.find('.span-reorder-handle');

    // 方法2: Konvaのfindメソッド（関数形式）- より確実
    const handlesByFindFunc = stage.find((node) => node.name?.() === 'span-reorder-handle');

    // 方法3: 再帰的に全ノードを走査（最も確実）
    const recursiveFind = (node: KonvaNode): KonvaNode[] => {
      const results: KonvaNode[] = [];
      const nodeName = node.name?.() || node.getAttr?.('name') || '';

      if (nodeName === 'span-reorder-handle') {
        results.push(node);
      }

      const children = node.getChildren?.() ?? [];
      children.forEach((child) => {
        results.push(...recursiveFind(child));
      });

      return results;
    };

    const layers = stage.getLayers();
    const handlesByRecursive: KonvaNode[] = [];
    layers.forEach((layer) => {
      handlesByRecursive.push(...recursiveFind(layer));
    });

    // 全手法の結果を統合（重複排除）
    const allHandles = new Set<KonvaNode>([
      ...handlesByFindSelector,
      ...handlesByFindFunc,
      ...handlesByRecursive,
    ]);
    const foundHandles = Array.from(allHandles);

    if (foundHandles.length === 0) {
      console.warn('[6-2] ⚠️ ハンドルが見つかりませんでした');
    } else {
      foundHandles.forEach((handle) => {
        const currentVisible = handle.visible();
        handleNodes.push({ node: handle, visible: currentVisible });
        handle.visible(false);
      });
    }

    // 柱情報とアンチ枚数を図面内に描画
    if (scaffoldGroups.length > 0) {
      // scaffold-layerを取得
      const scaffoldLayerNode = stage.findOne('.scaffold-layer');
      if (!isLayer(scaffoldLayerNode)) {
        console.warn('[6-3] ⚠️ scaffold-layerが見つかりませんでした');
      } else {
        // Konva Textクラスを取得（動的import）
        const konvaModule = getKonvaModule();
        if (!konvaModule || !konvaModule.Text) {
          console.warn('[6-3] ⚠️ Konva.Textが利用できません');
        } else {
          const { Text } = konvaModule;
          // カード位置の重なりを防ぐための記録
          const usedPositions: Array<{ x: number; y: number; width: number; height: number }> = [];

          scaffoldGroups.forEach((group) => {
            group.parts.forEach((part) => {
              let textContent = '';
              const textX = part.position.x;
              const textY = part.position.y;

              // 柱の場合
              if (part.type === '柱') {
                const meta = part.meta || {};
                const counts = meta.pillarCounts;

                if (counts) {
                  // pillarCountsから情報を生成（例: A×2 → AA）
                  const types: string[] = [];
                  for (const [type, qty] of Object.entries(counts)) {
                    const count = Number(qty || 0);
                    if (count > 0) {
                      // 種別を数量分繰り返す（例: A×2 → AA）
                      types.push(type.repeat(count));
                    }
                  }
                  textContent = types.length > 0 ? types.join('') : '';
                } else {
                  // 旧フィールド対応
                  const legacyType = meta.pillarType as string | undefined;
                  const legacyQty = Number(meta.quantity || 0);
                  if (legacyType && legacyQty > 0) {
                    textContent = legacyType.repeat(legacyQty);
                  }
                }
              }

              // アンチの場合
              if (part.type === 'アンチ') {
                const meta = part.meta || {};
                const wQty = Number(meta.antiW || 0);
                const sQty = Number(meta.antiS || 0);

                const parts: string[] = [];
                if (wQty > 0) parts.push(`W:${wQty}`);
                if (sQty > 0) parts.push(`S:${sQty}`);

                textContent = parts.length > 0 ? parts.join(' ') : '';
              }

              // テキストを描画（背景ボックス付き）
              if (textContent) {
                const finalX = textX + 5;
                let finalY = textY - 30;

                // 仮のテキストノードを作成してサイズを計算
                const tempTextNode: KonvaText = new Text({
                  text: textContent,
                  fontSize: 18,
                  fontFamily: 'Arial, sans-serif',
                  fontStyle: 'bold',
                });
                const textWidth = tempTextNode.width();
                const textHeight = tempTextNode.height();
                const boxWidth = textWidth + 8;
                const boxHeight = textHeight + 4;
                tempTextNode.destroy(); // 仮ノードを削除

                // 重なりチェック：既存のカードと重なる場合はY座標をずらす
                let overlap = true;
                let attempts = 0;
                const maxAttempts = 10;

                while (overlap && attempts < maxAttempts) {
                  overlap = false;
                  const candidateRect = {
                    x: finalX - 4,
                    y: finalY - 2,
                    width: boxWidth,
                    height: boxHeight
                  };

                  // 既存のカードと重なりをチェック
                  for (const used of usedPositions) {
                    const xOverlap = candidateRect.x < used.x + used.width && candidateRect.x + candidateRect.width > used.x;
                    const yOverlap = candidateRect.y < used.y + used.height && candidateRect.y + candidateRect.height > used.y;

                    if (xOverlap && yOverlap) {
                      // 重なっている場合、Y座標を下にずらす
                      finalY += boxHeight + 4;
                      overlap = true;
                      attempts++;
                      break;
                    }
                  }
                }

                // テキストノードを作成
                const textNode: KonvaText = new Text({
                  x: finalX,
                  y: finalY,
                  text: textContent,
                  fontSize: 18,
                  fontFamily: 'Arial, sans-serif',
                  fontStyle: 'bold',
                  fill: '#FFFFFF', // 白文字
                  align: 'left',
                  listening: false,
                  name: 'export-info-text'
                });

                // 背景ボックスを作成
                const bgRect: KonvaRect = new Rect({
                  x: finalX - 4,
                  y: finalY - 2,
                  width: boxWidth,
                  height: boxHeight,
                  fill: '#000000', // 黒背景
                  opacity: 0.8,
                  cornerRadius: 4,
                  listening: false,
                  name: 'export-info-text'
                });

                // 使用済み位置に記録
                usedPositions.push({
                  x: finalX - 4,
                  y: finalY - 2,
                  width: boxWidth,
                  height: boxHeight
                });

                // 背景 → テキストの順で追加
                scaffoldLayerNode.add(bgRect);
                scaffoldLayerNode.add(textNode);
                addedTextNodes.push(bgRect);
                addedTextNodes.push(textNode);
              }
            });
          });

          scaffoldLayerNode.batchDraw(); // レイヤーを再描画
        }
      }
    }

    // メモを図面内に描画
    if (memos.length > 0) {
      // scaffold-layerを取得
      const scaffoldLayerNode = stage.findOne('.scaffold-layer');
      if (!isLayer(scaffoldLayerNode)) {
        console.warn('[6-4] ⚠️ scaffold-layerが見つかりませんでした');
      } else {
        // Konva TextとRectクラスを取得
        const konvaModule = getKonvaModule();
        if (!konvaModule || !konvaModule.Text || !konvaModule.Rect) {
          console.warn('[6-4] ⚠️ Konva.TextまたはKonva.Rectが利用できません');
        } else {
          const { Text, Rect } = konvaModule;
          memos.forEach((memo) => {
            const { position, size, text } = memo;

            // テキストを改行で分割
            const lines = text
              .split('\n')
              .filter((line: string) => line.trim().length > 0 || text.includes('\n'));

            // フォントサイズとパディング（MemoRendererと同じ計算）
            const fontSize = 14; // 固定サイズ（スケール非依存）
            const lineHeight = fontSize * 1.4;
            const padding = 8;

            // テキスト高さを計算
            const textHeight = lines.length > 0 ? lines.length * lineHeight : lineHeight;
            const rectHeight = Math.max(size.height, textHeight + padding * 2);

            // 背景矩形を作成（黄色半透明）
            const bgRect: KonvaRect = new Rect({
              x: position.x,
              y: position.y,
              width: size.width,
              height: rectHeight,
              fill: 'rgba(255, 255, 200, 0.7)', // 黄色半透明（MemoRendererと同じ）
              stroke: '#FCD34D',
              strokeWidth: 1,
              cornerRadius: 4,
              listening: false,
              name: 'export-memo'
            });

            scaffoldLayerNode.add(bgRect);
            addedTextNodes.push(bgRect);

            // テキストを行ごとに描画
            if (lines.length > 0) {
              lines.forEach((line: string, index: number) => {
                const textNode: KonvaText = new Text({
                  x: position.x + padding,
                  y: position.y + padding + index * lineHeight,
                  text: line,
                  fontSize: fontSize,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fill: '#1F2937', // 黒文字（MemoRendererと同じ）
                  width: size.width - padding * 2,
                  wrap: 'word',
                  align: 'left',
                  listening: false,
                  name: 'export-memo'
                });

                scaffoldLayerNode.add(textNode);
                addedTextNodes.push(textNode);
              });
            } else {
              // メモが空の場合はプレースホルダーを表示
              const placeholderNode: KonvaText = new Text({
                x: position.x + padding,
                y: position.y + padding,
                text: 'メモを入力...',
                fontSize: fontSize,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fill: '#9CA3AF', // グレー文字
                width: size.width - padding * 2,
                wrap: 'word',
                align: 'left',
                listening: false,
                name: 'export-memo'
              });

              scaffoldLayerNode.add(placeholderNode);
              addedTextNodes.push(placeholderNode);
            }
          });

          scaffoldLayerNode.batchDraw(); // レイヤーを再描画
        }
      }
    }

    // 図形のバウンディングボックスを計算（グリッド以外）
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasContent = false;

    const stageLayers = stage.getLayers();
    stageLayers.forEach((layer) => {
      const layerName = layer.name?.() || layer.getAttr?.('name') || '';
      // グリッドレイヤーは除外
      if (layerName === 'grid-layer' || !layer.visible()) return;

      const children = layer.getChildren();
      children.forEach((node) => {
        try {
          if (!node.visible()) return;

          const rect = node.getClientRect?.({
            skipTransform: false,
            skipShadow: true,
            skipStroke: false,
          });
          if (rect && rect.width > 0 && rect.height > 0) {
            minX = Math.min(minX, rect.x);
            minY = Math.min(minY, rect.y);
            maxX = Math.max(maxX, rect.x + rect.width);
            maxY = Math.max(maxY, rect.y + rect.height);
            hasContent = true;
          }
        } catch (error) {
          console.warn('⚠️ getClientRectが取得できませんでした', error);
        }
      });
    });

    if (!hasContent) {
      console.warn('[8] ⚠️ 図形が見つかりませんでした。Stage全体を出力します');
      minX = 0;
      minY = 0;
      maxX = stageWidth;
      maxY = stageHeight;
    }

    // 余白を追加（50px）
    const padding = 50;
    cropX = Math.max(0, minX - padding);
    cropY = Math.max(0, minY - padding);
    cropWidth = Math.min(stageWidth - cropX, maxX - minX + padding * 2);
    cropHeight = Math.min(stageHeight - cropY, maxY - minY + padding * 2);

    // 描画を更新
    stage.draw();

    // 図形部分だけを切り取ってPNG生成
    const dataUrl = stage.toDataURL({
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
      pixelRatio: pixelRatio
    });

    // グリッド、ハンドル、追加したテキストを復元
    if (hideGrid && gridLayer && origGridVisible !== undefined) {
      gridLayer.visible(origGridVisible);
    }
    handleNodes.forEach(({ node, visible }) => {
      try {
        node.visible(visible);
      } catch (error) {
        console.warn('ハンドル復元エラー:', error);
      }
    });
    addedTextNodes.forEach((textNode) => {
      try {
        textNode.destroy(); // テキストノードを削除
      } catch (error) {
        console.warn('テキストノード削除エラー:', error);
      }
    });
    stage.draw();

    if (!dataUrl) {
      console.error('❌ toDataURLがnullを返しました');
      alert('エラー: PNG生成に失敗しました');
      return null;
    }

    // 白背景が必要な場合は、canvasで合成（図面を中央配置）
    if (whiteBg) {
      return new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            // 切り取った画像のサイズ
            const imgWidth = cropWidth * pixelRatio;
            const imgHeight = cropHeight * pixelRatio;

            // 最終的なcanvasサイズ（余白を追加して見やすく）
            const finalPadding = 100; // 周囲の余白
            const canvas = document.createElement('canvas');
            canvas.width = imgWidth + finalPadding * 2;
            canvas.height = imgHeight + finalPadding * 2;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.warn('⚠️ Canvas2Dコンテキスト取得失敗。透過PNGを返します');
              resolve(dataUrl);
              return;
            }

            // 白背景を描画
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 図面を中央に配置して描画
            ctx.drawImage(img, finalPadding, finalPadding, imgWidth, imgHeight);

            // 最終的なdataURLを取得
            const finalUrl = canvas.toDataURL(mimeType, quality);
            resolve(finalUrl);
          } catch (error) {
            console.error('❌ 白背景合成エラー:', error);
            resolve(dataUrl);
          }
        };
        img.onerror = () => {
          console.error('❌ 画像読み込みエラー');
          resolve(dataUrl);
        };
        img.src = dataUrl;
      });
    }

    // 透過背景の場合はそのまま返す
    return dataUrl;

  } catch (error: unknown) {
    const err = toError(error);
    console.error('❌ PNG生成エラー:', err);
    console.error('エラー詳細:', {
      message: err.message,
      stack: err.stack
    });

    // エラー時もグリッド、ハンドル、テキストを復元
    try {
      if (hideGrid && gridLayer && origGridVisible !== undefined) {
        gridLayer.visible(origGridVisible);
      }
      handleNodes.forEach(({ node, visible }) => {
        try {
          node.visible(visible);
        } catch (handleError) {
          console.warn('⚠️ ハンドル復元失敗', handleError);
        }
      });
      addedTextNodes.forEach((textNode) => {
        try {
          textNode.destroy();
        } catch (destroyError) {
          console.warn('⚠️ ノード削除失敗', destroyError);
        }
      });
      stage.draw();
    } catch (restoreError) {
      console.error('復元処理でもエラー:', restoreError);
    }

    alert(`エラー: PNG生成中に問題が発生しました\n${err.message}`);
    return null;
  }
}
