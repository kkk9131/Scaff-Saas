/**
 * 見積関連の型定義
 */

/**
 * 見積項目
 */
export interface EstimateItem {
  id: string;
  name: string;
  unit: string;           // 単位（㎡、m、個など）
  quantity: number;       // 数量
  unit_price: number;     // 単価
  amount: number;         // 金額（quantity × unit_price）
  note?: string;
}

/**
 * 見積データ
 */
export interface Estimate {
  id: string;
  project_id: string;
  drawing_id?: string;
  estimate_number: string;  // 見積番号
  title: string;
  items: EstimateItem[];
  subtotal: number;         // 小計
  tax_rate: number;         // 消費税率（0.1 = 10%）
  tax_amount: number;       // 消費税額
  total: number;            // 合計金額
  valid_until?: string;     // 見積有効期限
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 見積作成時の入力データ
 */
export interface CreateEstimateInput {
  project_id: string;
  drawing_id?: string;
  title: string;
  items: Omit<EstimateItem, 'id' | 'amount'>[];
  tax_rate?: number;
  valid_until?: string;
  notes?: string;
}

/**
 * 見積更新時の入力データ
 */
export interface UpdateEstimateInput {
  title?: string;
  items?: Omit<EstimateItem, 'id' | 'amount'>[];
  tax_rate?: number;
  valid_until?: string;
  notes?: string;
}

/**
 * PDF生成オプション
 */
export interface PdfGenerationOptions {
  includeCompanyLogo?: boolean;
  includeDrawingPreview?: boolean;
  pageSize?: 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
}
