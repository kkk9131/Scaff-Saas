/**
 * サブスクリプションプラン選択セクションコンポーネント
 *
 * 全プランを表示し、プラン選択からStripe Checkoutへの遷移を管理
 */

'use client';

import { useState } from 'react';
import { PricingCard } from './PricingCard';
import { useSubscriptionPlans, useMySubscription, useCreateCheckoutSession } from '@/hooks/use-subscriptions';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export function PricingSection() {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // サブスクリプションプラン一覧取得
  const { data: plans, isLoading: isLoadingPlans, error: plansError } = useSubscriptionPlans();

  // 現在のユーザーのサブスクリプション取得
  const { data: currentSubscription, isLoading: isLoadingSubscription } = useMySubscription();

  // Checkout Session作成ミューテーション
  const createCheckoutMutation = useCreateCheckoutSession();

  /**
   * プラン選択ハンドラー
   */
  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);

    // 選択されたプランを取得
    const selectedPlan = plans?.find((plan) => plan.id === planId);
    if (!selectedPlan) {
      toast({
        title: 'エラー',
        description: 'プランが見つかりませんでした',
        variant: 'destructive',
      });
      setSelectedPlanId(null);
      return;
    }

    // 無料プランの場合は直接プラン変更（実装は後で）
    if (selectedPlan.monthly_price === 0) {
      toast({
        title: '無料プラン',
        description: '無料プランが選択されました',
      });
      setSelectedPlanId(null);
      return;
    }

    // Stripe Checkout Sessionを作成
    try {
      const successUrl = `${window.location.origin}/subscription/success`;
      const cancelUrl = `${window.location.origin}/subscription`;

      const result = await createCheckoutMutation.mutateAsync({
        planId,
        successUrl,
        cancelUrl,
      });

      // Stripe Checkoutページにリダイレクト
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'Checkout Sessionの作成に失敗しました',
        variant: 'destructive',
      });
      setSelectedPlanId(null);
    }
  };

  // ローディング表示
  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // エラー表示
  if (plansError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>
          プラン情報の取得に失敗しました。再度お試しください。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">サブスクリプションプラン</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          あなたのニーズに合ったプランを選択してください。
          いつでもプランの変更やキャンセルが可能です。
        </p>
      </div>

      {/* プラン一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans?.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentSubscription?.plan_id === plan.id}
            onSelect={handleSelectPlan}
            isLoading={selectedPlanId === plan.id && createCheckoutMutation.isPending}
          />
        ))}
      </div>

      {/* 現在のプラン表示 */}
      {currentSubscription && (
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            現在のプラン: <span className="font-medium text-foreground">{currentSubscription.plan_name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
