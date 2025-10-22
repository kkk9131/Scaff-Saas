/**
 * 足場仕様の定数定義
 */

/**
 * 標準単位幅（mm）
 */
export const SCAFFOLD_UNIT_WIDTHS = {
  STANDARD: 1800,  // 標準単位（1800mm）
  HALF: 900,       // 半単位（900mm）
} as const;

/**
 * 1段あたりの標準高さ（mm）
 */
export const SCAFFOLD_STAGE_HEIGHT = {
  STANDARD: 1500,  // 標準高さ
  LOW: 1200,       // 低層用
  HIGH: 1800,      // 高層用
} as const;

/**
 * 足場の種類
 */
export const SCAFFOLD_TYPES = {
  STANDARD: 'standard',    // 標準足場
  SUPPORT: 'support',      // 支持足場
  HANGING: 'hanging',      // 吊り足場
} as const;

/**
 * 材質
 */
export const SCAFFOLD_MATERIALS = {
  STEEL: 'steel',          // 鋼製
  ALUMINUM: 'aluminum',    // アルミ製
} as const;

/**
 * 安全基準
 */
export const SAFETY_STANDARDS = {
  HANDRAIL_HEIGHT: 850,    // 手すり高さ（mm）
  TOE_BOARD_HEIGHT: 100,   // 幅木高さ（mm）
  MAX_LOAD_STANDARD: 400,  // 標準積載荷重（kg/㎡）
  MAX_LOAD_HEAVY: 600,     // 重作業積載荷重（kg/㎡）
} as const;

/**
 * 単位あたりの標準面積（㎡）
 */
export const UNIT_AREA = {
  STANDARD_1800: 2.7,  // 1800mm × 1500mm = 2.7㎡
  HALF_900: 1.35,      // 900mm × 1500mm = 1.35㎡
} as const;

/**
 * 足場部材の標準重量（kg）
 */
export const COMPONENT_WEIGHTS = {
  STANDARD_PIPE: 3.5,        // 標準パイプ（1800mm）
  HALF_PIPE: 1.8,            // 半パイプ（900mm）
  COUPLER: 0.5,              // カプラー
  BASE_PLATE: 5.0,           // ベースプレート
  HANDRAIL: 2.0,             // 手すり
} as const;

/**
 * DXFレイヤー名
 */
export const DXF_LAYERS = {
  BUILDING: 'BUILDING',          // 建物
  SCAFFOLD: 'SCAFFOLD',          // 足場
  ANNOTATION: 'ANNOTATION',      // 注記
  DIMENSION: 'DIMENSION',        // 寸法線
} as const;

/**
 * デフォルト設定
 */
export const DEFAULT_SCAFFOLD_CONFIG = {
  type: SCAFFOLD_TYPES.STANDARD,
  unit_width: SCAFFOLD_UNIT_WIDTHS.STANDARD,
  height_per_stage: SCAFFOLD_STAGE_HEIGHT.STANDARD,
  material: SCAFFOLD_MATERIALS.STEEL,
  max_load: SAFETY_STANDARDS.MAX_LOAD_STANDARD,
  safety_rail_height: SAFETY_STANDARDS.HANDRAIL_HEIGHT,
  toe_board_height: SAFETY_STANDARDS.TOE_BOARD_HEIGHT,
  mesh_panel: false,
} as const;
