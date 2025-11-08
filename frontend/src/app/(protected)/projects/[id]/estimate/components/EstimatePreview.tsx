'use client';

import * as React from 'react';
import type { Estimate } from '@/types/estimate';
import { Muted } from '@/components/ui';

/**
 * ガラスモーフィズム調のパネルスタイル
 */
const glassPanelClass =
  'glass-scope group relative overflow-hidden rounded-2xl border border-white/40 dark:border-slate-700/60 bg-transparent dark:bg-transparent backdrop-blur-xl shadow-lg shadow-sky-500/10 dark:shadow-slate-900/50 transition-all duration-300 before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:opacity-90 before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30';

/**
 * 金額をフォーマットするヘルパー関数
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

/**
 * 日付をフォーマットするヘルパー関数
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 見積もりプレビューコンポーネント
 *
 * 見積書のモックプレビューを表示します。
 * スクロールなしで全体が見えるようにコンパクトなレイアウトで表示します。
 */
export interface EstimatePreviewProps {
  /**
   * 表示する見積もりデータ（モック）
   */
  estimate: Estimate | null;
}

export function EstimatePreview({ estimate }: EstimatePreviewProps) {
  // モックデータ（estimateがnullの場合）
  const mockEstimate: Estimate = estimate ?? {
    id: 'mock-estimate-1',
    project_id: 'mock-project-1',
    estimate_number: 'EST-2025-001',
    title: '足場工事見積書',
    items: [
      {
        id: '1',
        name: '単管足場',
        unit: '㎡',
        quantity: 150,
        unit_price: 1200,
        amount: 180000,
        note: '標準的な単管足場',
      },
      {
        id: '2',
        name: '足場板',
        unit: '枚',
        quantity: 200,
        unit_price: 800,
        amount: 160000,
        note: '',
      },
      {
        id: '3',
        name: '手すり',
        unit: 'm',
        quantity: 80,
        unit_price: 500,
        amount: 40000,
        note: '',
      },
    ],
    subtotal: 380000,
    tax_rate: 0.1,
    tax_amount: 38000,
    total: 418000,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: '見積有効期限は30日間です。',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const displayEstimate = estimate ?? mockEstimate;

  return (
    <div className={`${glassPanelClass} p-6`}>
      {/* 見積書ヘッダー */}
      <div className="mb-6 border-b border-white/20 dark:border-slate-700/50 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-1">{displayEstimate.title}</h2>
            <Muted className="text-sm">見積番号: {displayEstimate.estimate_number}</Muted>
          </div>
          <div className="text-right">
            <Muted className="text-xs">見積日</Muted>
            <p className="text-sm font-medium text-card-foreground mt-1">
              {formatDate(displayEstimate.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* 見積項目テーブル */}
      <div className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20 dark:border-slate-700/50">
                <th className="text-left py-2 px-3 text-xs font-semibold text-card-foreground uppercase tracking-wide">
                  項目名
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-card-foreground uppercase tracking-wide">
                  数量
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-card-foreground uppercase tracking-wide">
                  単価
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-card-foreground uppercase tracking-wide">
                  金額
                </th>
              </tr>
            </thead>
            <tbody>
              {displayEstimate.items.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-white/10 dark:border-slate-700/30 ${
                    index % 2 === 0 ? 'bg-white/5 dark:bg-slate-800/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-sm text-card-foreground">
                    <div>{item.name}</div>
                    {item.note && (
                      <Muted className="text-xs mt-0.5">{item.note}</Muted>
                    )}
                  </td>
                  <td className="py-2 px-3 text-sm text-right text-card-foreground">
                    {item.quantity.toLocaleString('ja-JP')} {item.unit}
                  </td>
                  <td className="py-2 px-3 text-sm text-right text-card-foreground">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-medium text-card-foreground">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 合計セクション */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-end items-center gap-4">
          <span className="text-sm text-card-foreground">小計</span>
          <span className="text-sm font-medium text-card-foreground w-32 text-right">
            {formatCurrency(displayEstimate.subtotal)}
          </span>
        </div>
        <div className="flex justify-end items-center gap-4">
          <span className="text-sm text-card-foreground">
            消費税（{Math.round(displayEstimate.tax_rate * 100)}%）
          </span>
          <span className="text-sm font-medium text-card-foreground w-32 text-right">
            {formatCurrency(displayEstimate.tax_amount)}
          </span>
        </div>
        <div className="flex justify-end items-center gap-4 pt-2 border-t border-white/20 dark:border-slate-700/50">
          <span className="text-base font-bold text-card-foreground">合計</span>
          <span className="text-xl font-bold text-card-foreground w-32 text-right">
            {formatCurrency(displayEstimate.total)}
          </span>
        </div>
      </div>

      {/* 備考・有効期限 */}
      {(displayEstimate.notes || displayEstimate.valid_until) && (
        <div className="pt-4 border-t border-white/20 dark:border-slate-700/50 space-y-2">
          {displayEstimate.valid_until && (
            <div className="flex items-center gap-2">
              <Muted className="text-xs">見積有効期限:</Muted>
              <span className="text-xs text-card-foreground">
                {formatDate(displayEstimate.valid_until)}
              </span>
            </div>
          )}
          {displayEstimate.notes && (
            <div>
              <Muted className="text-xs mb-1 block">備考</Muted>
              <p className="text-sm text-card-foreground">{displayEstimate.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

