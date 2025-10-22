/**
 * AI機能関連の型定義
 */

/**
 * AIチャットメッセージの役割
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * チャットメッセージ
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  function_call?: FunctionCall;
}

/**
 * Function Calling の呼び出し情報
 */
export interface FunctionCall {
  name: string;
  arguments: string;
}

/**
 * AI Function の実行結果
 */
export interface FunctionExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * 建物データ（OCR/AI解析結果）
 */
export interface BuildingData {
  id: string;
  project_id: string;
  width: number;          // 幅（m）
  height: number;         // 高さ（m）
  depth?: number;         // 奥行き（m）
  floors?: number;        // 階数
  roof_type?: 'flat' | 'gable' | 'hip' | 'other';
  walls: WallData[];
  openings: OpeningData[];
  created_at: string;
  updated_at: string;
}

/**
 * 壁データ
 */
export interface WallData {
  id: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  height: number;
}

/**
 * 開口部データ（窓・ドアなど）
 */
export interface OpeningData {
  id: string;
  type: 'window' | 'door' | 'other';
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * OCR解析リクエスト
 */
export interface OcrAnalysisRequest {
  image_url: string;
  project_id: string;
}

/**
 * OCR解析結果
 */
export interface OcrAnalysisResult {
  success: boolean;
  building_data?: BuildingData;
  confidence_score: number;  // 信頼度スコア（0-1）
  raw_text?: string;
  error?: string;
}

/**
 * 足場自動生成リクエスト
 */
export interface ScaffoldGenerationRequest {
  building_data_id: string;
  scaffold_type: 'standard' | 'support' | 'hanging';
  unit_width: number;     // 単位幅（通常1800mm or 900mm）
  height_per_stage: number; // 1段あたりの高さ（通常1500mm）
}

/**
 * 足場自動生成結果
 */
export interface ScaffoldGenerationResult {
  success: boolean;
  shapes?: Shape[];       // drawing.d.ts のShapeを参照
  total_area: number;     // 総面積（㎡）
  unit_count: number;     // 必要単位数
  stage_count: number;    // 段数
  error?: string;
}

// drawing.d.tsのShapeを参照
import type { Shape } from './drawing';
