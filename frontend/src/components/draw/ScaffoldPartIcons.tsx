/**
 * ScaffoldPartIcons.tsx
 * 編集サイドバーで使用する足場部材アイコン集
 * 
 * ポリシー:
 * - すべてのアイコンは `stroke` ベースで描画し、ボタンの文字色と連動させる
 * - 24x24 のビューボックス内で統一し、サイズ指定でスケールさせる
 * - より実物に近い形状で直感的にわかりやすく
 */

import type { ReactElement, SVGProps } from 'react';
import type { ScaffoldPartType } from '@/types/scaffold';

/**
 * 足場部材アイコン共通のプロパティ
 * - `size` を指定すると幅/高さの両方に適用される
 */
export interface ScaffoldPartIconProps extends SVGProps<SVGSVGElement> {
  /** 表示サイズ（px） */
  size?: number;
}

/**
 * SVG 要素に共通設定を付与するユーティリティ
 * @param size サイズ（px）
 * @param props 追加プロパティ
 */
function createSvgProps(size: number, props: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': 'true' as const,
    focusable: 'false' as const,
    ...props,
  } satisfies SVGProps<SVGSVGElement>;
}

/**
 * 柱アイコン
 * - 美ケ足場の支柱：円柱パイプに上下のフランジ接合部を表現
 */
export function PillarIcon({ size = 22, ...props }: ScaffoldPartIconProps) {
  return (
    <svg {...createSvgProps(size, props)}>
      {/* 上部フランジ（太いリング） */}
      <ellipse cx="12" cy="5" rx="3.5" ry="1.2" strokeWidth="2" />
      {/* 中央の円柱パイプ（左右の輪郭線） */}
      <path d="M8.5 5v13" strokeWidth="2" />
      <path d="M15.5 5v13" strokeWidth="2" />
      {/* 下部フランジ（太いリング） */}
      <ellipse cx="12" cy="18" rx="3.5" ry="1.2" strokeWidth="2" />
      {/* ベースプレート（下端の楕円） */}
      <ellipse cx="12" cy="20.5" rx="4.5" ry="1" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * 布材アイコン
 * - 足場の手すり：横向きパイプのみのシンプル構造
 */
export function LedgerIcon({ size = 22, ...props }: ScaffoldPartIconProps) {
  return (
    <svg {...createSvgProps(size, props)}>
      {/* 上段手すりパイプ */}
      <rect x="4" y="8" width="16" height="2" rx="1" strokeWidth="2.2" />
      {/* 下段手すりパイプ */}
      <rect x="4" y="14" width="16" height="2" rx="1" strokeWidth="2.2" />
    </svg>
  );
}

/**
 * ブラケットアイコン
 * - L字型ブラケット：縦パイプ＋横パイプ＋三角形の斜材
 */
export function BracketIcon({ size = 22, ...props }: ScaffoldPartIconProps) {
  return (
    <svg {...createSvgProps(size, props)}>
      {/* 縦のパイプ（取り付け部） */}
      <rect x="5" y="4" width="2" height="16" rx="1" strokeWidth="2.2" />
      {/* 水平張り出しパイプ */}
      <rect x="6" y="10.5" width="13" height="2" rx="1" strokeWidth="2.2" />
      {/* 斜め補強材（縦パイプの下から横パイプの先端へ：三角形） */}
      <path d="M6 16l12.5 -4.5" strokeWidth="2.2" strokeLinecap="round" />
      {/* 先端の固定金具 */}
      <circle cx="18.5" cy="11.5" r="1.5" strokeWidth="2" fill="none" />
    </svg>
  );
}

/**
 * アンチアイコン
 * - 足場の踏み板：格子模様の木製ボード
 */
export function AntiIcon({ size = 22, ...props }: ScaffoldPartIconProps) {
  return (
    <svg {...createSvgProps(size, props)}>
      {/* 踏み板本体（厚みのある矩形） */}
      <rect x="3" y="9" width="18" height="6" rx="0.8" strokeWidth="2.2" />
      {/* 木目＆滑り止めパターン（格子状） */}
      <path d="M6 10v4" strokeWidth="1.2" opacity="0.7" />
      <path d="M9 10v4" strokeWidth="1.2" opacity="0.7" />
      <path d="M12 10v4" strokeWidth="1.2" opacity="0.7" />
      <path d="M15 10v4" strokeWidth="1.2" opacity="0.7" />
      <path d="M18 10v4" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}

/**
 * 階段アイコン
 * - 足場用階段：明確な3段ステップ＋斜め手すり
 */
export function StairIcon({ size = 22, ...props }: ScaffoldPartIconProps) {
  return (
    <svg {...createSvgProps(size, props)}>
      {/* 下段（最も低い） */}
      <rect x="4" y="15" width="5" height="2" rx="0.5" strokeWidth="2" />
      {/* 中段 */}
      <rect x="9" y="11" width="5" height="2" rx="0.5" strokeWidth="2" />
      {/* 上段（最も高い） */}
      <rect x="14" y="7" width="5" height="2" rx="0.5" strokeWidth="2" />
      {/* 斜めの手すり */}
      <path d="M5 16l13 -9" strokeWidth="2" />
      {/* 左右の支柱 */}
      <path d="M5 17v2" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8v2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 梁枠アイコン
 * - 張り枠：四角フレーム＋X字筋交い＋四隅のボルト
 */
export function FrameIcon({ size = 22, ...props }: ScaffoldPartIconProps) {
  return (
    <svg {...createSvgProps(size, props)}>
      {/* 外枠の四辺 */}
      <rect x="4" y="4" width="16" height="16" rx="0.5" strokeWidth="2.5" />
      {/* X字筋交い（斜め補強） */}
      <path d="M6 6l12 12" strokeWidth="1.5" opacity="0.8" />
      <path d="M18 6l-12 12" strokeWidth="1.5" opacity="0.8" />
      {/* 四隅の接合ボルト */}
      <circle cx="6" cy="6" r="1.2" fill="currentColor" />
      <circle cx="18" cy="6" r="1.2" fill="currentColor" />
      <circle cx="6" cy="18" r="1.2" fill="currentColor" />
      <circle cx="18" cy="18" r="1.2" fill="currentColor" />
    </svg>
  );
}

/**
 * ハネ（持ち出しブラケット）アイコン
 * - ブラケット形状の先端に縦パイプ、三角形の斜材で補強
 */
export function CantileverIcon({ size = 22, ...props }: ScaffoldPartIconProps) {
  return (
    <svg {...createSvgProps(size, props)}>
      {/* 縦の支柱（取り付け部） */}
      <rect x="4" y="4" width="2" height="16" rx="1" strokeWidth="2.2" />
      {/* 斜め上への張り出しアーム */}
      <path d="M5 12l10 -6" strokeWidth="2.5" strokeLinecap="round" />
      {/* 斜め補強材（縦パイプの下から先端へ：三角形） */}
      <path d="M5 16l10 -10" strokeWidth="2.2" strokeLinecap="round" />
      {/* 張り出し先端の縦パイプ */}
      <rect x="14" y="3" width="2" height="8" rx="1" strokeWidth="2.2" />
      {/* 先端の固定金具 */}
      <circle cx="15" cy="6" r="1.2" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

/**
 * 足場部材種別とアイコンの対応マップ
 * - Sidebars などで参照し、種別に応じた SVG を提供
 */
export const scaffoldPartIconMap: Record<ScaffoldPartType, (props: ScaffoldPartIconProps) => ReactElement> = {
  柱: PillarIcon,
  布材: LedgerIcon,
  ブラケット: BracketIcon,
  アンチ: AntiIcon,
  階段: StairIcon,
  ハネ: CantileverIcon,
  梁枠: FrameIcon,
};
