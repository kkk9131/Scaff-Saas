/**
 * canvasStageRegistry.ts
 *
 * Konva Stage 参照をグローバルに登録/取得し、PNG出力（dataURL）を行うユーティリティ。
 * DOM参照をグローバルに持つのは厳密には推奨されませんが、
 * プレビュー/エクスポート用途の一時的な簡易実装として採用しています。
 */

export type KonvaStageLike = {
  toDataURL: (opts?: { pixelRatio?: number; mimeType?: string; quality?: number }) => string
};

let stageRef: KonvaStageLike | null = null;

/** Stage を登録 */
export function registerStage(stage: KonvaStageLike | null) {
  stageRef = stage;
}

/** 登録済み Stage を取得 */
export function getRegisteredStage(): KonvaStageLike | null {
  return stageRef;
}

/** Stage から PNG dataURL を取得 */
export function exportStageToDataURL(options?: { pixelRatio?: number; mimeType?: string; quality?: number; withWhiteBg?: boolean; hideGrid?: boolean }): string | null {
  if (!stageRef) return null;
  try {
    const stage: any = stageRef as any;
    const bgLayer = stage.findOne?.('.bg-layer');
    const gridLayer = stage.findOne?.('.grid-layer');
    const origBgVisible = bgLayer ? bgLayer.visible() : undefined;
    const origGridVisible = gridLayer ? gridLayer.visible() : undefined;
    // 背景矩形のサイズを現在の表示範囲に合わせる
    let bgRect: any = null;
    if (bgLayer && typeof bgLayer.findOne === 'function') {
      bgRect = bgLayer.findOne('.bg-rect');
    }
    
    // 一時的な白背景レイヤー（bgLayerが見つからない場合に使用）
    let tempBgLayer: any = null;
    let tempBgRect: any = null;
    
    // 影を全無効化（発光抑制）
    const shapeNodes = stage.find ? stage.find('Shape') : [];
    const shadowStates: Array<{ node: any; enabled: boolean }> = [];
    const hiddenGradientStates: Array<{ node: any; visible: boolean }> = [];
    if (shapeNodes && shapeNodes.length > 0) {
      shapeNodes.forEach((node: any) => {
        if (typeof node.shadowEnabled === 'function') {
          const enabled = !!node.shadowEnabled();
          shadowStates.push({ node, enabled });
          if (enabled) node.shadowEnabled(false);
        }
        // ラジアルグラデーションを使った発光円などを一時的に非表示
        try {
          const hasRadial =
            node.getAttr &&
            (node.getAttr('fillRadialGradientEndRadius') != null ||
              node.getAttr('fillRadialGradientColorStops') != null);
          if (hasRadial) {
            hiddenGradientStates.push({ node, visible: node.visible() });
            node.visible(false);
          }
        } catch {}
      });
    }

    if (options?.withWhiteBg) {
      // Stageの座標変換を考慮して白背景を可視範囲いっぱいに敷く
      try {
        if (bgLayer && bgRect) {
          // 既存のbgLayerとbgRectがある場合
          const sX = stage.scaleX ? stage.scaleX() : 1;
          const sY = stage.scaleY ? stage.scaleY() : 1;
          const tX = stage.x ? stage.x() : 0;
          const tY = stage.y ? stage.y() : 0;
          const w = stage.width ? stage.width() : 0;
          const h = stage.height ? stage.height() : 0;
          const x = -tX / (sX || 1);
          const y = -tY / (sY || 1);
          const rw = w / (sX || 1);
          const rh = h / (sY || 1);
          bgRect.x(x);
          bgRect.y(y);
          bgRect.width(rw);
          bgRect.height(rh);
          // 背景色を白に設定
          bgRect.fill('#ffffff');
          bgLayer.visible(true);
        } else {
          // bgLayerまたはbgRectが見つからない場合、一時的に作成
          const Konva = (window as any).Konva;
          if (Konva) {
            const sX = stage.scaleX ? stage.scaleX() : 1;
            const sY = stage.scaleY ? stage.scaleY() : 1;
            const tX = stage.x ? stage.x() : 0;
            const tY = stage.y ? stage.y() : 0;
            const w = stage.width ? stage.width() : 0;
            const h = stage.height ? stage.height() : 0;
            const x = -tX / (sX || 1);
            const y = -tY / (sY || 1);
            const rw = w / (sX || 1);
            const rh = h / (sY || 1);
            
            tempBgLayer = new Konva.Layer({ name: 'bg-layer-temp', listening: false });
            tempBgRect = new Konva.Rect({
              x,
              y,
              width: rw,
              height: rh,
              fill: '#ffffff',
              listening: false,
              name: 'bg-rect-temp',
            });
            tempBgLayer.add(tempBgRect);
            stage.add(tempBgLayer);
            tempBgLayer.moveToBottom();
            tempBgLayer.draw();
          }
        }
      } catch (e) {
        console.error('白背景設定エラー:', e);
      }
    }
    if (options?.hideGrid && gridLayer) gridLayer.visible(false);
    stage.draw?.();

    const { withWhiteBg, hideGrid, ...rest } = options || {};
    const url = stage.toDataURL?.(rest);

    // 一時的に作成したレイヤーを削除
    if (tempBgLayer) {
      try {
        tempBgLayer.destroy();
      } catch {}
    }
    
    if (bgLayer && origBgVisible !== undefined) bgLayer.visible(origBgVisible);
    if (gridLayer && origGridVisible !== undefined) gridLayer.visible(origGridVisible);
    // 影設定を元に戻す
    shadowStates.forEach(({ node, enabled }) => {
      try {
        node.shadowEnabled(enabled);
      } catch {}
    });
    // グラデーション形状の可視状態を元に戻す
    hiddenGradientStates.forEach(({ node, visible }) => {
      try {
        node.visible(visible);
      } catch {}
    });
    stage.draw?.();

    return url ?? null;
  } catch (e) {
    console.error('StageのPNGエクスポートに失敗しました:', e);
    return null;
  }
}
