'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * プロジェクト検索バーのプロパティ定義
 */
export interface SearchBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 現在の検索キーワード
   */
  value: string;
  /**
   * 検索キーワード変更時のハンドラー
   */
  onChange: (value: string) => void;
  /**
   * 入力欄をクリアするハンドラー
   */
  onClear?: () => void;
  /**
   * プレースホルダー文言
   */
  placeholder?: string;
}

/**
 * プロジェクトリスト専用の検索バーコンポーネント
 *
 * - Inputコンポーネントとアイコンを組み合わせ、ダッシュボード全体のUIトーンに合わせたガラスモーフィズム調の装飾を実装
 * - キーボード操作でも扱いやすいように、クリアボタンはbutton要素で提供
 */
export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'キーワードでプロジェクトを検索',
  className,
  ...props
}: SearchBarProps) {
  /**
   * 入力イベントを拾い、親コンポーネントへ値を通知
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  /**
   * クリアボタン押下時に入力を空にしてフォーカスを戻すためのリファレンス
   */
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    onClear?.();
    // 入力欄へフォーカスを戻すことでUXを向上
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div
      className={cn(
        // クイックアクション調：完全透過＋ガラス（ライトもダークも背景色はのせない）
        'glass-scope group relative flex w-full flex-col gap-2 overflow-hidden rounded-2xl border border-white/40 bg-transparent p-4 shadow-lg shadow-sky-500/10 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/60 dark:bg-transparent dark:shadow-indigo-900/40',
        // 薄いグラデーションのトップコート（QAに近い質感）
        'before:absolute before:inset-0 before:rounded-2xl before:opacity-90 before:pointer-events-none before:bg-gradient-to-br before:from-[#6366F1]/0 before:via-[#8B5CF6]/0 before:to-[#6366F1]/30',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          プロジェクト検索
        </h2>
        {value && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {value.length}文字入力中
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          leftElement={<Search className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          aria-label="プロジェクト検索キーワード"
          fullWidth
          // ガラスパネル内では入力自体も半透明にして一体感を出す
          className={cn(
            'bg-transparent border-white/40 backdrop-blur-sm',
            'dark:bg-transparent dark:border-slate-700/50'
          )}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            aria-label="検索キーワードをクリア"
            className="h-12 w-12 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        プロジェクト名・顧客名・住所・説明からあいまい検索できます。
      </p>
    </div>
  );
}
