/**
 * 足場作図の型定義
 * サックスモード（スパン自動生成）で使用する型
 */

/**
 * 足場部材の種別
 */
export type ScaffoldPartType = '柱' | '布材' | 'ブラケット' | 'アンチ' | '階段' | '梁枠';

/**
 * マーカーの種類（柱用）
 * - circle: 通常柱（ジャッキ集計対象）
 * - triangle: 特殊柱（端・梁枠、集計対象外）
 * - square: 補助柱（集計対象外）
 */
export type MarkerType = 'circle' | 'triangle' | 'square';

/**
 * ブラケットのサイズ
 * - W: 600mm
 * - S: 355mm
 */
export type BracketSize = 'W' | 'S';

/**
 * 足場部材（ScaffoldPart）
 * 個々の部材（柱、布材、ブラケット、アンチなど）を表す
 */
export interface ScaffoldPart {
  /** 一意のID */
  id: string;

  /** 部材の種別 */
  type: ScaffoldPartType;

  /** キャンバス上の位置（ピクセル座標） */
  position: { x: number; y: number };

  /** 色（white/red/blue/green） */
  color: string;

  /** マーカー（柱の場合のみ） */
  marker?: MarkerType;

  /** メタデータ（寸法、数量などの追加情報） */
  meta?: {
    /** 長さ（mm） */
    length?: number;

    /** 幅（mm） */
    width?: number;

    /** 高さ（mm） */
    height?: number;

    /** 数量 */
    quantity?: number;

    /** ブラケットサイズ（ブラケットの場合） */
    bracketSize?: BracketSize;

    /** 段数（柱、アンチの場合） */
    levels?: number;

    /** 方向（度数法：0=右、90=下、180=左、270=上） */
    direction?: number;

    /** その他の追加情報 */
    [key: string]: any;
  };
}

/**
 * 足場グループ（ScaffoldGroup）
 * サックスモードで生成される部材のまとまり
 * スパン1本分の構成部材をグループ化
 */
export interface ScaffoldGroup {
  /** グループのID */
  id: string;

  /** グループに含まれる部材の配列 */
  parts: ScaffoldPart[];

  /** グループのメタデータ */
  meta?: {
    /** スパン長（mm） */
    spanLength?: number;

    /** 生成元の線の始点・終点 */
    line?: {
      start: { x: number; y: number };
      end: { x: number; y: number };
    };

    /** 生成時の設定 */
    settings?: {
      /** ブラケットサイズ（W/S） */
      bracketSize: BracketSize;

      /** 方向反転フラグ */
      reversed: boolean;
    };

    /** その他の追加情報 */
    [key: string]: any;
  };
}

/**
 * サックスモードの設定
 */
export interface SaxModeSettings {
  /** ブラケットサイズ（W=600mm, S=355mm） */
  bracketSize: BracketSize;

  /** 方向反転（Alt押下時にtrue） */
  reversed: boolean;

  /** 現在選択中の色 */
  currentColor: string;
}

/**
 * スパン生成の入力情報
 */
export interface SpanInput {
  /** 始点座標（ピクセル） */
  start: { x: number; y: number };

  /** 終点座標（ピクセル） */
  end: { x: number; y: number };

  /** 設定 */
  settings: SaxModeSettings;
}
