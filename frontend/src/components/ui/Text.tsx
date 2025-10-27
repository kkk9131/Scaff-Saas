/**
 * テキストスタイル共通コンポーネント
 * - Tailwindのユーティリティを内包し、見出し/本文などのスタイルを統一
 * - 画面全体で一貫したタイポグラフィを提供
 */

'use client'

import React from 'react'
import clsx from 'clsx'

/**
 * 共通の基底テキスト。size/weight/colorをpropsで簡易調整。
 */
export interface TextBaseProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements
  /** テキストサイズのトークン */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  /** フォントウェイト */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  /** ミュート（補助文）かどうか */
  muted?: boolean
  /** 追加クラス名 */
  className?: string
}

/**
 * TextBase
 * - 初心者にも分かるよう、propsで分かりやすく文字サイズ/太さを指定
 */
export const TextBase: React.FC<TextBaseProps> = ({
  as: Tag = 'p',
  size = 'base',
  weight = 'normal',
  muted = false,
  className,
  children,
  ...rest
}) => {
  const sizeClass =
    size === 'xs'
      ? 'text-xs'
      : size === 'sm'
      ? 'text-sm'
      : size === 'lg'
      ? 'text-lg'
      : size === 'xl'
      ? 'text-xl'
      : size === '2xl'
      ? 'text-2xl'
      : size === '3xl'
      ? 'text-3xl'
      : 'text-base'

  const weightClass =
    weight === 'medium'
      ? 'font-medium'
      : weight === 'semibold'
      ? 'font-semibold'
      : weight === 'bold'
      ? 'font-bold'
      : 'font-normal'

  const colorClass = muted
    ? 'text-gray-600 dark:text-gray-400'
    : 'text-gray-900 dark:text-slate-100'

  return (
    <Tag className={clsx(sizeClass, weightClass, colorClass, className)} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * 見出し（H1/H2/H3）と本文・注釈のショートカットコンポーネント
 * - 使う側はTailwindクラスを意識せずに統一スタイルを利用可能
 */
export const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...rest }) => (
  <TextBase as="h1" size="3xl" weight="bold" className={clsx('leading-tight tracking-tight', className)} {...rest} />
)

export const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...rest }) => (
  <TextBase as="h2" size="2xl" weight="bold" className={clsx('leading-tight', className)} {...rest} />
)

export const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...rest }) => (
  <TextBase as="h3" size="xl" weight="semibold" className={clsx('leading-tight', className)} {...rest} />
)

export const Body: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...rest }) => (
  <TextBase as="p" size="base" className={clsx('leading-relaxed', className)} {...rest} />
)

export const Muted: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...rest }) => (
  <TextBase as="p" size="sm" muted className={clsx('leading-relaxed', className)} {...rest} />
)

/**
 * Eyebrow（セクションの小見出し）
 * - 小さな大文字 + 広めのトラッキングでモダンな印象
 */
export const Eyebrow: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div
    className={clsx(
      'text-[11px] uppercase tracking-[0.18em] text-gray-600/90 dark:text-gray-400/90',
      'select-none',
      className,
    )}
    {...rest}
  />
)

/**
 * GradientText（ブランドグラデ適用の見出し）
 * - 背景グラデーションを文字にクリップ。asでh1/h2/spanなどを指定可能
 */
export interface GradientTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements
  from?: string
  via?: string
  to?: string
}

export const GradientText: React.FC<GradientTextProps> = ({
  as: Tag = 'span',
  from = 'from-[#6366F1]',
  via = 'via-[#06B6D4]',
  to = 'to-[#8B5CF6]',
  className,
  children,
  ...rest
}) => (
  <Tag
    className={clsx(
      'bg-clip-text text-transparent bg-gradient-to-r',
      from,
      via,
      to,
      'tracking-tight',
      className,
    )}
    {...rest}
  >
    {children}
  </Tag>
)
