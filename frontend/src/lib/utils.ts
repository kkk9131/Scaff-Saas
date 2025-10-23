import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * クラス名を結合するユーティリティ関数
 * Tailwind CSSのクラスをマージする際に便利
 *
 * @param inputs - クラス名の配列
 * @returns マージされたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
