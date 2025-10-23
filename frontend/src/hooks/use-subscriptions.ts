/**
 * サブスクリプション管理用のReact Queryフック
 *
 * サブスクリプションプラン取得、ユーザーサブスクリプション状態管理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubscriptionPlans,
  getSubscriptionPlan,
  getMySubscription,
  createCheckoutSession,
  cancelMySubscription,
  SubscriptionPlan,
  UserSubscription,
} from '@/lib/api/subscriptions';

/**
 * 全サブスクリプションプラン一覧を取得するフック
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await getSubscriptionPlans();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    },
    staleTime: 1000 * 60 * 10, // 10分間キャッシュ
  });
}

/**
 * 特定のサブスクリプションプラン詳細を取得するフック
 *
 * @param planId - サブスクリプションプランID
 */
export function useSubscriptionPlan(planId: string) {
  return useQuery({
    queryKey: ['subscription-plan', planId],
    queryFn: async () => {
      const response = await getSubscriptionPlan(planId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    },
    enabled: !!planId, // planIdが存在する場合のみクエリ実行
    staleTime: 1000 * 60 * 10, // 10分間キャッシュ
  });
}

/**
 * 現在のユーザーのサブスクリプション状態を取得するフック
 *
 * 認証が必要
 */
export function useMySubscription() {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const response = await getMySubscription();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
}

/**
 * Stripe Checkout Sessionを作成するミューテーションフック
 */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async ({
      planId,
      successUrl,
      cancelUrl,
    }: {
      planId: string;
      successUrl: string;
      cancelUrl: string;
    }) => {
      const response = await createCheckoutSession(planId, successUrl, cancelUrl);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    },
  });
}

/**
 * サブスクリプションをキャンセルするミューテーションフック
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (immediately: boolean = false) => {
      const response = await cancelMySubscription(immediately);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    },
    onSuccess: () => {
      // キャンセル成功後、サブスクリプション状態を再取得
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
    },
  });
}
