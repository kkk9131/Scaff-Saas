/**
 * サブスクリプション管理コンポーネント
 *
 * 現在のサブスクリプション状態表示、プラン変更、キャンセル機能を提供
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMySubscription, useCancelSubscription } from '@/hooks/use-subscriptions';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertCircle, CheckCircle2, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function SubscriptionManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [cancelMode, setCancelMode] = useState<'immediate' | 'end' | null>(null);

  // 現在のサブスクリプション取得
  const { data: subscription, isLoading, error } = useMySubscription();

  // キャンセルミューテーション
  const cancelMutation = useCancelSubscription();

  /**
   * サブスクリプションキャンセルハンドラー
   */
  const handleCancel = async (immediately: boolean) => {
    setCancelMode(immediately ? 'immediate' : 'end');

    try {
      await cancelMutation.mutateAsync(immediately);

      toast({
        title: 'キャンセル完了',
        description: immediately
          ? 'サブスクリプションを即座にキャンセルしました'
          : '現在の請求期間終了時にキャンセルされます',
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'キャンセルに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setCancelMode(null);
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>
          サブスクリプション情報の取得に失敗しました。再度お試しください。
        </AlertDescription>
      </Alert>
    );
  }

  // サブスクリプションがない場合
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>サブスクリプションがありません</CardTitle>
          <CardDescription>
            プランを選択してサブスクリプションを開始してください
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/subscription')}>
            プランを選択
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ステータスバッジの色を決定
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'past_due':
        return 'destructive';
      case 'canceled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // ステータスの日本語表記
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '有効';
      case 'trialing':
        return 'トライアル中';
      case 'past_due':
        return '支払い期限超過';
      case 'canceled':
        return 'キャンセル済み';
      case 'incomplete':
        return '未完了';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">サブスクリプション管理</h1>

      {/* 現在のプラン情報 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{subscription.plan_name}</CardTitle>
            <Badge variant={getStatusBadgeVariant(subscription.status)}>
              {getStatusLabel(subscription.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 請求期間 */}
          {subscription.current_period_start && subscription.current_period_end && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">請求期間</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(subscription.current_period_start), 'yyyy年M月d日', { locale: ja })} 〜{' '}
                  {format(new Date(subscription.current_period_end), 'yyyy年M月d日', { locale: ja })}
                </p>
              </div>
            </div>
          )}

          {/* Stripe Customer ID */}
          {subscription.stripe_customer_id && (
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">支払い情報</p>
                <p className="text-sm text-muted-foreground">
                  Stripe Customer ID: {subscription.stripe_customer_id}
                </p>
              </div>
            </div>
          )}

          {/* キャンセル予定アラート */}
          {subscription.cancel_at_period_end && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>キャンセル予定</AlertTitle>
              <AlertDescription>
                このサブスクリプションは{' '}
                {subscription.current_period_end &&
                  format(new Date(subscription.current_period_end), 'yyyy年M月d日', { locale: ja })}{' '}
                に終了します
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          {/* プラン変更ボタン */}
          <Button variant="outline" onClick={() => router.push('/subscription')}>
            プランを変更
          </Button>

          {/* キャンセルボタン */}
          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">サブスクリプションをキャンセル</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>サブスクリプションをキャンセルしますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消せません。以下のオプションから選択してください。
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3 my-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">期間終了時にキャンセル（推奨）</h4>
                    <p className="text-sm text-muted-foreground">
                      現在の請求期間終了まで利用を継続し、その後キャンセルされます。
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">即座にキャンセル</h4>
                    <p className="text-sm text-muted-foreground">
                      すぐにサブスクリプションが終了し、機能へのアクセスが制限されます。
                    </p>
                  </div>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel>戻る</AlertDialogCancel>
                  <Button
                    variant="outline"
                    onClick={() => handleCancel(false)}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMode === 'end' && cancelMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        処理中...
                      </>
                    ) : (
                      '期間終了時にキャンセル'
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCancel(true)}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMode === 'immediate' && cancelMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        処理中...
                      </>
                    ) : (
                      '即座にキャンセル'
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>

      {/* サポート情報 */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>サポート</AlertTitle>
        <AlertDescription>
          サブスクリプションに関するご質問は、お問い合わせフォームからお気軽にご連絡ください。
        </AlertDescription>
      </Alert>
    </div>
  );
}
