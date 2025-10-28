import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Cardコンポーネントのプロパティ型定義
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * ホバー時の持ち上がり効果を有効にする
   */
  hoverable?: boolean;

  /**
   * クリック可能なカード（カーソルがポインターになる）
   */
  clickable?: boolean;
}

/**
 * Cardコンポーネント
 *
 * プロジェクトカード、情報カード、コンテンツコンテナとして使用
 * - 美しい影とボーダー
 * - ホバー効果（オプション）
 * - レスポンシブ対応
 *
 * 使用例:
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>プロジェクト名</CardTitle>
 *     <CardDescription>説明文</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     コンテンツ
 *   </CardContent>
 *   <CardFooter>
 *     <Button>詳細を見る</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, clickable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // 基本スタイル（ライト: 柔らかい白カード（bg-card） / ダーク: やわらかい白カード）
        // 文字色はデザイントークン（--card-foreground）に委譲
        // ui-card: ダッシュボード用のスコープ指定でスタイルを上書きしやすくするための識別クラス
        'ui-card rounded-2xl border bg-card text-card-foreground shadow-md',
        'dark:border-white/10 dark:bg-card dark:text-card-foreground dark:backdrop-blur-md',
        // トランジション
        'transition-all duration-200 ease-out',
        // ホバー効果
        hoverable && 'hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5',
        // クリック可能
        clickable && 'cursor-pointer active:scale-[0.98]',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

/**
 * CardHeaderコンポーネント
 * カードの上部（タイトル・説明エリア）
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * CardTitleコンポーネント
 * カードのタイトル（見出し）
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-bold leading-tight tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * CardDescriptionコンポーネント
 * カードの説明文（サブタイトル）
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContentコンポーネント
 * カードのメインコンテンツエリア
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * CardFooterコンポーネント
 * カードの下部（ボタンエリアなど）
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-3 p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
