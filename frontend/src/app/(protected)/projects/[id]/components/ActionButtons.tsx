'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

/**
 * サイドバーと同じデザインのアイコンを定義
 */
const drawIcon = (
  <svg
    className="h-5 w-5 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const estimateIcon = (
  <svg
    className="h-5 w-5 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

/**
 * プロジェクト詳細ページのアクションボタン
 *
 * 「作図」や「見積」など、次のステップに進むための主要アクションをまとめています。
 * ルーティングの実装はNext.jsの`useRouter`に任せ、ここではユーザー操作部分だけに集中します。
 */
export interface ActionButtonsProps {
  /**
   * 遷移先のURLを生成するためのプロジェクトID
   */
  projectId: string;

  /**
   * 追加でボタンを非活性にしたい場合に使用
   */
  disabled?: boolean;
}

export function ActionButtons({ projectId, disabled = false }: ActionButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  /**
   * 画面遷移時にローディング感を出したかったので、
   * Reactの`useTransition`を使ってボタンを少しの間だけ無効化しています。
   */
  const handleNavigate = React.useCallback(
    (path: string) => {
      if (!projectId) return;

      startTransition(() => {
        router.push(path);
      });
    },
    [projectId, router, startTransition]
  );

  const isDisabled = disabled || isPending;

  return (
    <div className="flex items-center gap-3">
      <Button
        size="icon"
        className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#6366F1] text-white shadow-lg hover:from-[#0EA5E9] hover:to-[#6366F1]"
        onClick={() => handleNavigate(`/projects/${projectId}/draw`)}
        disabled={isDisabled}
        isLoading={isPending}
        iconLeft={drawIcon}
      >
        <span className="sr-only">作図へ進む</span>
      </Button>
      <Button
        size="icon"
        className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg hover:from-[#6366F1] hover:to-[#7C3AED]"
        onClick={() => handleNavigate(`/projects/${projectId}/estimate`)}
        disabled={isDisabled}
        isLoading={isPending}
        iconLeft={estimateIcon}
      >
        <span className="sr-only">見積へ進む</span>
      </Button>
    </div>
  );
}
