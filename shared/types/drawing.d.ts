/**
 * 作図関連の型定義
 */

/**
 * 図形の種類
 */
export type ShapeType = 'line' | 'rect' | 'circle' | 'text' | 'scaffold';

/**
 * レイヤーの種類
 */
export type LayerType = 'building' | 'scaffold' | 'annotation';

/**
 * 基本図形データ
 */
export interface Shape {
  id: string;
  type: ShapeType;
  layer: LayerType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

/**
 * 作図データ全体
 */
export interface Drawing {
  id: string;
  project_id: string;
  name: string;
  shapes: Shape[];
  canvas_width: number;
  canvas_height: number;
  scale: number;
  created_at: string;
  updated_at: string;
}

/**
 * 作図データ作成時の入力
 */
export interface CreateDrawingInput {
  project_id: string;
  name: string;
  canvas_width?: number;
  canvas_height?: number;
  scale?: number;
}

/**
 * 作図データ保存時の入力
 */
export interface SaveDrawingInput {
  shapes: Shape[];
  canvas_width: number;
  canvas_height: number;
  scale: number;
}

/**
 * DXF出力オプション
 */
export interface DxfExportOptions {
  includeScaffold: boolean;
  includeBuilding: boolean;
  includeAnnotation: boolean;
  layerPrefix?: string;
}
