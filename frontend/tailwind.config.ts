import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS設定ファイル
 * 足場業務SaaS向けのカスタムデザインシステム
 *
 * デザインコンセプト:
 * - 建設現場の力強さと安全性を表現
 * - 職人が直感的に理解できる視覚言語
 * - モダンでワクワクするUI
 */
const config: Config = {
  // ダークモードをクラスベースで制御
  darkMode: ['class'],

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // 建設業界にふさわしい配色システム
      colors: {
        // 建設現場の安全色をベースにした配色
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // プライマリカラー: 建設現場のセーフティオレンジ
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        // セカンダリカラー: 足場の鉄骨グレー
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        // アクセントカラー: 現場の活気を表すブルー
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // 破壊的アクション: 警告レッド
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        // 成功カラー: 完了グリーン
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },

        // 警告カラー: 注意イエロー
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },

        // UIコンポーネント用カラー
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // 職人が使いやすい大きなボーダー半径
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // 滑らかなアニメーション設定
      keyframes: {
        // フェードイン（上からスライド）
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        // スケールアップ
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        // スライドイン（左から）
        'slide-in-left': {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(0)',
          },
        },
        // スライドイン（右から）
        'slide-in-right': {
          '0%': {
            transform: 'translateX(100%)',
          },
          '100%': {
            transform: 'translateX(0)',
          },
        },
        // パルスアニメーション
        pulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
        // スピナー回転
        spin: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      },

      // アニメーション定義
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
      },

      // タッチターゲットを大きくするためのスペーシング
      spacing: {
        '18': '4.5rem', // 72px - 大きなボタンサイズ
        '22': '5.5rem', // 88px - 特大ボタンサイズ
      },

      // 読みやすいフォントサイズ
      fontSize: {
        'xxs': '0.625rem', // 10px
        'xs': '0.75rem', // 12px
        'sm': '0.875rem', // 14px
        'base': '1rem', // 16px
        'lg': '1.125rem', // 18px
        'xl': '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem', // 48px
      },
    },
  },

  plugins: [],
};

export default config;
