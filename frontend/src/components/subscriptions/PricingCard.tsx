/**
 * サブスクリプションプラン価格カードコンポーネント
 *
 * 各サブスクリプションプランの詳細を表示し、プラン選択ボタンを提供
 */

'use client';

import { SubscriptionPlan } from '@/lib/api/subscriptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
  isLoading?: boolean;
}

export function PricingCard({ plan, isCurrentPlan = false, onSelect, isLoading = false }: PricingCardProps) {
  // 機能リストを生成
  const features = [
    {
      label: `プロジェクト数: ${plan.max_projects ?? '無制限'}`,
      enabled: true,
    },
    {
      label: `プロジェクトごと図面数: ${plan.max_drawings_per_project ?? '無制限'}`,
      enabled: true,
    },
    {
      label: `ストレージ容量: ${plan.max_storage_mb ? `${plan.max_storage_mb}MB` : '無制限'}`,
      enabled: true,
    },
    {
      label: 'AIチャット機能',
      enabled: plan.ai_chat_enabled,
    },
    {
      label: '高度な描画機能',
      enabled: plan.advanced_drawing_enabled,
    },
    {
      label: 'DXFエクスポート',
      enabled: plan.export_dxf_enabled,
    },
    {
      label: 'PDFエクスポート',
      enabled: plan.export_pdf_enabled,
    },
    {
      label: 'OCR図面解析',
      enabled: plan.ocr_analysis_enabled,
    },
  ];

  // 無料プランかどうか
  const isFree = plan.monthly_price === 0;

  // おすすめプラン（プロプラン）
  const isRecommended = plan.name === 'プロプラン';

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        isRecommended && 'border-primary border-2 shadow-lg',
        isCurrentPlan && 'bg-muted/50'
      )}
    >
      {/* おすすめバッジ */}
      {isRecommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
          おすすめ
        </div>
      )}

      {/* ヘッダー */}
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm mt-2">{plan.description}</CardDescription>

        {/* 価格表示 */}
        <div className="mt-4">
          {isFree ? (
            <div>
              <span className="text-4xl font-bold">無料</span>
            </div>
          ) : (
            <div>
              <span className="text-4xl font-bold">¥{plan.monthly_price.toLocaleString()}</span>
              <span className="text-muted-foreground ml-2">/月</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* 機能リスト */}
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              {feature.enabled ? (
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <span
                className={cn(
                  'text-sm',
                  !feature.enabled && 'text-muted-foreground line-through'
                )}
              >
                {feature.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      {/* フッター */}
      <CardFooter>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            現在のプラン
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onSelect(plan.id)}
            disabled={isLoading}
            variant={isRecommended ? 'default' : 'outline'}
          >
            {isLoading ? '処理中...' : isFree ? '無料で始める' : 'このプランを選択'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
