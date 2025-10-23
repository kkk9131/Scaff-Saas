/**
 * サブスクリプションAPI関数
 *
 * バックエンドのサブスクリプション管理APIとの通信を管理
 */

import { apiClient, ApiResponse } from '@/lib/api-client';

/**
 * サブスクリプションプラン型定義
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthly_price: number;
  currency: string;
  max_projects?: number;
  max_drawings_per_project?: number;
  max_storage_mb?: number;
  ai_chat_enabled: boolean;
  advanced_drawing_enabled: boolean;
  export_dxf_enabled: boolean;
  export_pdf_enabled: boolean;
  ocr_analysis_enabled: boolean;
  display_order: number;
}

/**
 * ユーザーサブスクリプション型定義
 */
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

/**
 * Checkout Session作成レスポンス
 */
export interface CheckoutSessionResponse {
  session_id: string;
  url: string;
}

/**
 * 全サブスクリプションプラン一覧を取得
 */
export async function getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
  return apiClient.get<SubscriptionPlan[]>('/api/subscriptions/plans', false);
}

/**
 * 特定のサブスクリプションプラン詳細を取得
 *
 * @param planId - サブスクリプションプランID
 */
export async function getSubscriptionPlan(planId: string): Promise<ApiResponse<SubscriptionPlan>> {
  return apiClient.get<SubscriptionPlan>(`/api/subscriptions/plans/${planId}`, false);
}

/**
 * 現在のユーザーのサブスクリプション状態を取得
 *
 * 認証が必要なAPI
 */
export async function getMySubscription(): Promise<ApiResponse<UserSubscription | null>> {
  return apiClient.get<UserSubscription | null>('/api/subscriptions/my-subscription', true);
}

/**
 * Stripe Checkout Sessionを作成してサブスクリプション支払いを開始
 *
 * @param planId - サブスクリプションプランID
 * @param successUrl - 支払い成功時のリダイレクトURL
 * @param cancelUrl - 支払いキャンセル時のリダイレクトURL
 */
export async function createCheckoutSession(
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<ApiResponse<CheckoutSessionResponse>> {
  return apiClient.post<CheckoutSessionResponse>(
    '/api/subscriptions/create-checkout-session',
    {
      plan_id: planId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    true
  );
}

/**
 * 現在のユーザーのサブスクリプションをキャンセル
 *
 * @param immediately - 即座にキャンセルするか（false=期間終了時にキャンセル）
 */
export async function cancelMySubscription(immediately: boolean = false): Promise<ApiResponse<{ message: string }>> {
  return apiClient.post<{ message: string }>(
    '/api/subscriptions/cancel',
    { immediately },
    true
  );
}
