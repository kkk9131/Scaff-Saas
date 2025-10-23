/**
 * バックエンドAPIクライアント
 *
 * FastAPI バックエンドとの通信を管理するユーティリティ。
 * 認証トークンの自動付与、エラーハンドリングを提供。
 */

import { createClient } from '@/lib/supabase';

// APIベースURL（環境変数から取得）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * API レスポンス型定義
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * API クライアントクラス
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * 認証ヘッダーを取得
   *
   * Supabase Authからトークンを取得してAuthorizationヘッダーを構築
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }

    return {};
  }

  /**
   * GETリクエスト
   */
  async get<T = any>(endpoint: string, requireAuth = false): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (requireAuth) {
        const authHeaders = await this.getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: `HTTP_${response.status}`,
            message: data.detail || 'リクエストに失敗しました',
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
        },
      };
    }
  }

  /**
   * POSTリクエスト
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    requireAuth = false
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (requireAuth) {
        const authHeaders = await this.getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: `HTTP_${response.status}`,
            message: data.detail || 'リクエストに失敗しました',
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
        },
      };
    }
  }

  /**
   * PUTリクエスト
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    requireAuth = false
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (requireAuth) {
        const authHeaders = await this.getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: `HTTP_${response.status}`,
            message: data.detail || 'リクエストに失敗しました',
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
        },
      };
    }
  }

  /**
   * DELETEリクエスト
   */
  async delete<T = any>(endpoint: string, requireAuth = false): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (requireAuth) {
        const authHeaders = await this.getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: `HTTP_${response.status}`,
            message: data.detail || 'リクエストに失敗しました',
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
        },
      };
    }
  }
}

// APIクライアントインスタンスをエクスポート
export const apiClient = new ApiClient(API_BASE_URL);
