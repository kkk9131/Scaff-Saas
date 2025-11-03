/**
 * canvasStageExporter.ts
 *
 * 最小構成のPNGエクスポートユーティリティ。
 * - Stage参照を登録し、PNG dataURL を取得する
 * - 出力時にグリッドと発光（lighter/ラジアル）を一時的に非表示
 * - 出力後は可視状態を元に戻す
 */

export type KonvaStageLike = any;

let stageRef: KonvaStageLike | null = null;

/** Stage を登録/解除 */
export function registerStage(stage: KonvaStageLike | null) {
  stageRef = stage;
}

/** Stage から PNG dataURL を取得（最小構成） */
export function exportStageToDataURL(options?: {
  pixelRatio?: number;
  mimeType?: string;
  quality?: number;
  whiteBg?: boolean;
  hideGrid?: boolean;
}): string | null {
  if (!stageRef) return null;
  const stage: any = stageRef as any;

  const { pixelRatio = 2, mimeType, quality, whiteBg = true, hideGrid = true } = options || {};

  // 可視状態の退避
  const hiddenNodes: Array<{ node: any; visible: boolean }> = [];
  const shadowStates: Array<{ node: any; enabled: boolean }> = [];
  let origGridVisible: boolean | undefined;
  let tempBgLayer: any = null;

  try {
    const gridLayer = stage.findOne?.('.grid-layer');
    if (hideGrid && gridLayer) {
      origGridVisible = gridLayer.visible();
      gridLayer.visible(false);
    }

    // 発光（加算合成/ラジアル）を一時非表示 & 影を無効化
    const shapes = stage.find ? stage.find('Shape') : [];
    shapes.forEach((n: any) => {
      try {
        const gco = n.getAttr ? n.getAttr('globalCompositeOperation') : undefined;
        const hasRadial = n.getAttr && (n.getAttr('fillRadialGradientEndRadius') != null || n.getAttr('fillRadialGradientColorStops') != null);
        if (gco === 'lighter' || hasRadial) {
          hiddenNodes.push({ node: n, visible: n.visible() });
          n.visible(false);
        }
      } catch {}
      try {
        if (typeof n.shadowEnabled === 'function') {
          const enabled = !!n.shadowEnabled();
          shadowStates.push({ node: n, enabled });
          if (enabled) n.shadowEnabled(false);
        }
      } catch {}
    });

    // 背景を白にする（可視範囲）
    if (whiteBg) {
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
        tempBgLayer = new Konva.Layer({ listening: false });
        const rect = new Konva.Rect({ x, y, width: rw, height: rh, fill: '#ffffff', listening: false });
        tempBgLayer.add(rect);
        stage.add(tempBgLayer);
        tempBgLayer.moveToBottom();
        tempBgLayer.draw();
      }
    }

    stage.draw?.();
    const url = stage.toDataURL?.({ pixelRatio, mimeType, quality });

    // 復元
    if (tempBgLayer) {
      try { tempBgLayer.destroy(); } catch {}
    }
    hiddenNodes.forEach(({ node, visible }) => { try { node.visible(visible); } catch {} });
    shadowStates.forEach(({ node, enabled }) => { try { node.shadowEnabled(enabled); } catch {} });
    if (hideGrid && gridLayer && origGridVisible !== undefined) gridLayer.visible(origGridVisible);
    stage.draw?.();

    return url ?? null;
  } catch (e) {
    console.error('PNGエクスポートに失敗:', e);
    try {
      if (tempBgLayer) tempBgLayer.destroy();
      hiddenNodes.forEach(({ node, visible }) => { node.visible(visible); });
      shadowStates.forEach(({ node, enabled }) => { node.shadowEnabled(enabled); });
      const gridLayer = stage.findOne?.('.grid-layer');
      if (hideGrid && gridLayer && origGridVisible !== undefined) gridLayer.visible(origGridVisible);
      stage.draw?.();
    } catch {}
    return null;
  }
}

