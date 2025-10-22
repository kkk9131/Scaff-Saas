/**
 * サブスクリプション支払い成功ページ
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 5秒後に自動的にダッシュボードにリダイレクト
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[80vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">支払いが完了しました！</CardTitle>
          <CardDescription>
            サブスクリプションが有効になりました。
            すべての機能をご利用いただけます。
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            5秒後に自動的にダッシュボードに移動します...
          </p>
        </CardContent>

        <CardFooter className="flex justify-center gap-3">
          <Button onClick={() => router.push('/dashboard')}>
            ダッシュボードへ
          </Button>
          <Button variant="outline" onClick={() => router.push('/subscription/manage')}>
            サブスクリプション管理
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
