/**
 * エラーコードの定数定義
 */

/**
 * 認証関連エラー
 */
export const AUTH_ERRORS = {
  UNAUTHORIZED: 'AUTH_001',
  INVALID_TOKEN: 'AUTH_002',
  TOKEN_EXPIRED: 'AUTH_003',
  INSUFFICIENT_PERMISSIONS: 'AUTH_004',
} as const;

/**
 * バリデーションエラー
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD_MISSING: 'VAL_001',
  INVALID_FORMAT: 'VAL_002',
  OUT_OF_RANGE: 'VAL_003',
  INVALID_TYPE: 'VAL_004',
} as const;

/**
 * プロジェクト関連エラー
 */
export const PROJECT_ERRORS = {
  NOT_FOUND: 'PRJ_001',
  ALREADY_EXISTS: 'PRJ_002',
  UPDATE_FAILED: 'PRJ_003',
  DELETE_FAILED: 'PRJ_004',
} as const;

/**
 * 作図関連エラー
 */
export const DRAWING_ERRORS = {
  NOT_FOUND: 'DRW_001',
  SAVE_FAILED: 'DRW_002',
  LOAD_FAILED: 'DRW_003',
  INVALID_DATA: 'DRW_004',
  DXF_EXPORT_FAILED: 'DRW_005',
} as const;

/**
 * 見積関連エラー
 */
export const ESTIMATE_ERRORS = {
  NOT_FOUND: 'EST_001',
  CALCULATION_FAILED: 'EST_002',
  PDF_GENERATION_FAILED: 'EST_003',
  INVALID_ITEM: 'EST_004',
} as const;

/**
 * AI関連エラー
 */
export const AI_ERRORS = {
  API_ERROR: 'AI_001',
  RATE_LIMIT_EXCEEDED: 'AI_002',
  INVALID_RESPONSE: 'AI_003',
  OCR_FAILED: 'AI_004',
  FUNCTION_EXECUTION_FAILED: 'AI_005',
} as const;

/**
 * ストレージ関連エラー
 */
export const STORAGE_ERRORS = {
  UPLOAD_FAILED: 'STR_001',
  DOWNLOAD_FAILED: 'STR_002',
  FILE_NOT_FOUND: 'STR_003',
  INSUFFICIENT_STORAGE: 'STR_004',
} as const;

/**
 * データベース関連エラー
 */
export const DATABASE_ERRORS = {
  CONNECTION_FAILED: 'DB_001',
  QUERY_FAILED: 'DB_002',
  TRANSACTION_FAILED: 'DB_003',
  CONSTRAINT_VIOLATION: 'DB_004',
} as const;

/**
 * その他のエラー
 */
export const GENERAL_ERRORS = {
  INTERNAL_SERVER_ERROR: 'GEN_001',
  SERVICE_UNAVAILABLE: 'GEN_002',
  TIMEOUT: 'GEN_003',
  UNKNOWN_ERROR: 'GEN_999',
} as const;

/**
 * エラーコードからメッセージへのマッピング
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // 認証エラー
  [AUTH_ERRORS.UNAUTHORIZED]: '認証が必要です',
  [AUTH_ERRORS.INVALID_TOKEN]: '無効なトークンです',
  [AUTH_ERRORS.TOKEN_EXPIRED]: 'トークンの有効期限が切れています',
  [AUTH_ERRORS.INSUFFICIENT_PERMISSIONS]: '権限が不足しています',

  // バリデーションエラー
  [VALIDATION_ERRORS.REQUIRED_FIELD_MISSING]: '必須項目が入力されていません',
  [VALIDATION_ERRORS.INVALID_FORMAT]: '入力形式が正しくありません',
  [VALIDATION_ERRORS.OUT_OF_RANGE]: '値が範囲外です',
  [VALIDATION_ERRORS.INVALID_TYPE]: 'データ型が正しくありません',

  // プロジェクトエラー
  [PROJECT_ERRORS.NOT_FOUND]: 'プロジェクトが見つかりません',
  [PROJECT_ERRORS.ALREADY_EXISTS]: 'プロジェクトが既に存在します',
  [PROJECT_ERRORS.UPDATE_FAILED]: 'プロジェクトの更新に失敗しました',
  [PROJECT_ERRORS.DELETE_FAILED]: 'プロジェクトの削除に失敗しました',

  // 作図エラー
  [DRAWING_ERRORS.NOT_FOUND]: '作図データが見つかりません',
  [DRAWING_ERRORS.SAVE_FAILED]: '作図データの保存に失敗しました',
  [DRAWING_ERRORS.LOAD_FAILED]: '作図データの読み込みに失敗しました',
  [DRAWING_ERRORS.INVALID_DATA]: '作図データが不正です',
  [DRAWING_ERRORS.DXF_EXPORT_FAILED]: 'DXF出力に失敗しました',

  // 見積エラー
  [ESTIMATE_ERRORS.NOT_FOUND]: '見積が見つかりません',
  [ESTIMATE_ERRORS.CALCULATION_FAILED]: '見積計算に失敗しました',
  [ESTIMATE_ERRORS.PDF_GENERATION_FAILED]: 'PDF生成に失敗しました',
  [ESTIMATE_ERRORS.INVALID_ITEM]: '見積項目が不正です',

  // AIエラー
  [AI_ERRORS.API_ERROR]: 'AI APIでエラーが発生しました',
  [AI_ERRORS.RATE_LIMIT_EXCEEDED]: 'APIの利用制限に達しました',
  [AI_ERRORS.INVALID_RESPONSE]: 'AIからの応答が不正です',
  [AI_ERRORS.OCR_FAILED]: 'OCR解析に失敗しました',
  [AI_ERRORS.FUNCTION_EXECUTION_FAILED]: 'AI機能の実行に失敗しました',

  // ストレージエラー
  [STORAGE_ERRORS.UPLOAD_FAILED]: 'ファイルのアップロードに失敗しました',
  [STORAGE_ERRORS.DOWNLOAD_FAILED]: 'ファイルのダウンロードに失敗しました',
  [STORAGE_ERRORS.FILE_NOT_FOUND]: 'ファイルが見つかりません',
  [STORAGE_ERRORS.INSUFFICIENT_STORAGE]: 'ストレージ容量が不足しています',

  // データベースエラー
  [DATABASE_ERRORS.CONNECTION_FAILED]: 'データベース接続に失敗しました',
  [DATABASE_ERRORS.QUERY_FAILED]: 'クエリの実行に失敗しました',
  [DATABASE_ERRORS.TRANSACTION_FAILED]: 'トランザクション処理に失敗しました',
  [DATABASE_ERRORS.CONSTRAINT_VIOLATION]: 'データ制約違反が発生しました',

  // その他のエラー
  [GENERAL_ERRORS.INTERNAL_SERVER_ERROR]: '内部サーバーエラーが発生しました',
  [GENERAL_ERRORS.SERVICE_UNAVAILABLE]: 'サービスが利用できません',
  [GENERAL_ERRORS.TIMEOUT]: 'タイムアウトしました',
  [GENERAL_ERRORS.UNKNOWN_ERROR]: '不明なエラーが発生しました',
} as const;
