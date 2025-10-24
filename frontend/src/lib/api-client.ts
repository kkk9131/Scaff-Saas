/**
 * バックエンドAPIクライアント
 *
 * FastAPI バックエンドとの通信を管理するユーティリティ。
 * 認証トークンの自動付与、エラーハンドリング、リトライロジックを提供。
 */

import { supabase } from '@/lib/supabase';

// APIベースURL（環境変数から取得）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * APIエラーコード型定義
 * より詳細なエラー分類を提供
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'        // 401: 認証エラー
  | 'FORBIDDEN'           // 403: 権限エラー
  | 'NOT_FOUND'           // 404: リソース未検出
  | 'VALIDATION_ERROR'    // 422: バリデーションエラー
  | 'SERVER_ERROR'        // 500: サーバーエラー
  | 'NETWORK_ERROR'       // ネットワーク接続エラー
  | 'TIMEOUT_ERROR'       // タイムアウトエラー
  | 'PARSE_ERROR'         // JSONパースエラー
  | 'UNKNOWN_ERROR';      // 不明なエラー

/**
 * API レスポンス型定義
 */
export interface ApiResponse<T = any> {
  data?: T;
  /**
   * バックエンドが success レスポンスを返したかどうか
   */
  success?: boolean;
  /**
   * バックエンドから受け取ったメッセージ
   */
  message?: string;
  error?: {
    code: ApiErrorCode;
    message: string;
    statusCode?: number;
  };
  /**
   * 正規化前のレスポンスボディ（デバッグ用途）
   */
  raw?: unknown;
}

/**
 * リクエストオプション型定義
 */
interface RequestOptions {
  body?: any;
  requireAuth?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * API クライアントクラス
 */
class ApiClient {
  private baseUrl: string;
  private defaultTimeout = 30000; // 30秒
  private defaultRetries = 3;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * 認証ヘッダーを取得
   *
   * Supabase Authからトークンを取得してAuthorizationヘッダーを構築
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }

    return {};
  }

  /**
   * HTTPステータスコードからエラーコードを生成
   */
  private getErrorCodeFromStatus(status: number): ApiErrorCode {
    switch (status) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 422:
        return 'VALIDATION_ERROR';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * 共通リクエスト処理
   *
   * すべてのHTTPメソッドで共通のロジックを集約
   * - ヘッダー構築
   * - 認証トークン付与
   * - エラーハンドリング
   * - タイムアウト処理
   */
  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      body,
      requireAuth = false,
      timeout = this.defaultTimeout,
    } = options;

    try {
      // ヘッダー構築
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // 認証が必要な場合はトークンを付与
      if (requireAuth) {
        const authHeaders = await this.getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      // タイムアウト制御用のAbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // リクエスト実行
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レスポンスのJSONパース
      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        // JSONパースに失敗した場合
        if (!response.ok) {
          return {
            error: {
              code: 'PARSE_ERROR',
              message: 'レスポンスのパースに失敗しました',
              statusCode: response.status,
            },
          };
        }
        // 成功レスポンスでJSONがない場合は空オブジェクト
        data = {};
      }

      // エラーレスポンスの処理
      if (!response.ok) {
        // エラーメッセージの抽出
        let errorMessage = 'リクエストに失敗しました';

        if (data.detail) {
          // FastAPIのバリデーションエラー(422)の場合、detailは配列
          if (Array.isArray(data.detail)) {
            // 各エラーオブジェクトからmsgを抽出して結合
            errorMessage = data.detail
              .map((err: any) => err.msg || JSON.stringify(err))
              .join(', ');
          } else if (typeof data.detail === 'string') {
            // detailが文字列の場合はそのまま使用
            errorMessage = data.detail;
          } else {
            // detailがオブジェクトの場合はJSON文字列化
            errorMessage = JSON.stringify(data.detail);
          }
        } else if (data.message) {
          // messageフィールドがある場合
          errorMessage = data.message;
        }

        return {
          error: {
            code: this.getErrorCodeFromStatus(response.status),
            message: errorMessage,
            statusCode: response.status,
          },
          message: typeof data?.message === 'string' ? data.message : undefined,
          success: typeof data?.success === 'boolean' ? data.success : undefined,
          raw: data,
        };
      }

      // successレスポンスを標準形式に正規化
      if (data && typeof data === 'object') {
        const successValue = typeof data.success === 'boolean' ? data.success : undefined;
        const messageValue = typeof data.message === 'string' ? data.message : undefined;

        if (successValue !== undefined && Object.prototype.hasOwnProperty.call(data, 'data')) {
          return {
            data: (data as { data: T }).data,
            success: successValue,
            message: messageValue,
            raw: data,
          };
        }

        return {
          data,
          success: successValue,
          message: messageValue,
          raw: data,
        };
      }

      return { data };
    } catch (error) {
      // ネットワークエラーまたはタイムアウト
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            error: {
              code: 'TIMEOUT_ERROR',
              message: `リクエストがタイムアウトしました（${timeout}ms）`,
            },
          };
        }

        return {
          error: {
            code: 'NETWORK_ERROR',
            message: error.message || 'ネットワークエラーが発生しました',
          },
        };
      }

      return {
        error: {
          code: 'UNKNOWN_ERROR',
          message: '予期しないエラーが発生しました',
        },
      };
    }
  }

  /**
   * リトライロジック付きリクエスト
   *
   * ネットワークエラーやタイムアウトの場合に自動リトライ
   * 指数バックオフ戦略を使用（1秒 → 2秒 → 4秒）
   */
  private async requestWithRetry<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const maxRetries = options.retries ?? this.defaultRetries;
    let lastError: ApiResponse<T> | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await this.request<T>(method, endpoint, options);

      // 成功した場合は即座に返す
      if (!response.error) {
        return response;
      }

      // リトライ対象のエラーかチェック
      const shouldRetry =
        response.error.code === 'NETWORK_ERROR' ||
        response.error.code === 'TIMEOUT_ERROR' ||
        response.error.code === 'SERVER_ERROR';

      // リトライ不要なエラーまたは最後の試行の場合は終了
      if (!shouldRetry || attempt === maxRetries) {
        return response;
      }

      lastError = response;

      // 指数バックオフ: 1秒 → 2秒 → 4秒
      const backoffDelay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));

      console.warn(
        `リトライ中 (${attempt + 1}/${maxRetries}): ${endpoint}`,
        response.error
      );
    }

    return lastError!;
  }

  /**
   * GETリクエスト
   *
   * @param endpoint - APIエンドポイント（例: "/api/projects"）
   * @param requireAuth - 認証が必要な場合true
   * @param options - タイムアウトやリトライ設定
   */
  async get<T = any>(
    endpoint: string,
    requireAuth = false,
    options: Omit<RequestOptions, 'body' | 'requireAuth'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('GET', endpoint, {
      ...options,
      requireAuth,
    });
  }

  /**
   * POSTリクエスト
   *
   * @param endpoint - APIエンドポイント
   * @param body - リクエストボディ
   * @param requireAuth - 認証が必要な場合true
   * @param options - タイムアウトやリトライ設定
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    requireAuth = false,
    options: Omit<RequestOptions, 'body' | 'requireAuth'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('POST', endpoint, {
      ...options,
      body,
      requireAuth,
    });
  }

  /**
   * PUTリクエスト
   *
   * @param endpoint - APIエンドポイント
   * @param body - リクエストボディ
   * @param requireAuth - 認証が必要な場合true
   * @param options - タイムアウトやリトライ設定
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    requireAuth = false,
    options: Omit<RequestOptions, 'body' | 'requireAuth'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('PUT', endpoint, {
      ...options,
      body,
      requireAuth,
    });
  }

  /**
   * DELETEリクエスト
   *
   * @param endpoint - APIエンドポイント
   * @param requireAuth - 認証が必要な場合true
   * @param options - タイムアウトやリトライ設定
   */
  async delete<T = any>(
    endpoint: string,
    requireAuth = false,
    options: Omit<RequestOptions, 'body' | 'requireAuth'> = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('DELETE', endpoint, {
      ...options,
      requireAuth,
    });
  }
}

// APIクライアントインスタンスをエクスポート
export const apiClient = new ApiClient(API_BASE_URL);
