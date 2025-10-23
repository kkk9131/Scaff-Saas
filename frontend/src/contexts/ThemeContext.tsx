'use client';

import * as React from 'react';

/**
 * テーマモードの型定義
 * - light: 明るいテーマ
 * - dark: 暗いテーマ
 */
export type ThemeMode = 'light' | 'dark';

/**
 * テーマコンテキストで提供する値の型定義
 */
interface ThemeContextValue {
  /** 現在のテーマモード */
  theme: ThemeMode;
  /** ダークモードかどうか */
  isDark: boolean;
  /** テーマを明示的に設定する関数 */
  setTheme: (mode: ThemeMode) => void;
  /** テーマをトグルする関数 */
  toggleTheme: () => void;
}

/**
 * ブラウザに保存する際のキー定義
 */
const STORAGE_KEY = 'scaffai-theme-preference';

/**
 * テーマコンテキスト本体
 */
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

/**
 * ドキュメントルートにテーマクラスを適用する
 * @param mode 適用するテーマモード
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = React.useState<ThemeMode>('light');
  const [hasMounted, setHasMounted] = React.useState(false);

  /**
   * マウント後に初期テーマを決定
   */
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setHasMounted(true);

    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const legacy = window.localStorage.getItem('theme') as ThemeMode | null;

    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
      return;
    }

    if (legacy === 'light' || legacy === 'dark') {
      window.localStorage.setItem(STORAGE_KEY, legacy);
      window.localStorage.removeItem('theme');
      setThemeState(legacy);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const preferredMode: ThemeMode = mediaQuery.matches ? 'dark' : 'light';
    setThemeState(preferredMode);

    const handleChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  /**
   * テーマ変更時にDOMへ反映
   */
  React.useEffect(() => {
    if (!hasMounted || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    root.dataset.theme = theme;
    body.dataset.theme = theme;
    body.style.colorScheme = theme;

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, hasMounted]);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

/**
 * テーマコンテキストを安全に利用するためのカスタムフック
 */
export const useTheme = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeはThemeProvider内で使用してください');
  }

  return context;
};
