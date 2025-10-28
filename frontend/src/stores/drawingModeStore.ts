/**
 * 作図モード管理ストア
 * 作図画面における4つのモード（draw/edit/memo/view）を管理
 * ショートカットキー（1/2/3/4）と連動
 */

import { create } from 'zustand';

// 作図モードの型定義
export type DrawingMode = 'draw' | 'edit' | 'memo' | 'view';

// モード情報の型定義
export interface ModeInfo {
  id: DrawingMode;
  name: string;
  description: string;
  shortcutKey: string;
  icon: string;
}

// モード定義
export const MODES: Record<DrawingMode, ModeInfo> = {
  draw: {
    id: 'draw',
    name: 'サックスモード',
    description: '足場を描画',
    shortcutKey: '1',
    icon: '✏️',
  },
  edit: {
    id: 'edit',
    name: '編集モード',
    description: '足場を編集',
    shortcutKey: '2',
    icon: '🔧',
  },
  memo: {
    id: 'memo',
    name: 'メモモード',
    description: '注記を追加',
    shortcutKey: '3',
    icon: '📝',
  },
  view: {
    id: 'view',
    name: 'ビューモード',
    description: '閲覧専用',
    shortcutKey: '4',
    icon: '👁️',
  },
};

// 作図モードストアの状態型定義
interface DrawingModeState {
  // 状態
  currentMode: DrawingMode;
  previousMode: DrawingMode | null;

  // アクション
  setMode: (mode: DrawingMode) => void;
  toggleMode: (mode: DrawingMode) => void;
  getPreviousMode: () => DrawingMode | null;
  getCurrentModeInfo: () => ModeInfo;
}

/**
 * 作図モードストア
 * 作図画面のモード状態を管理
 */
export const useDrawingModeStore = create<DrawingModeState>()((set, get) => ({
  // 初期状態
  currentMode: 'draw', // デフォルトはサックスモード
  previousMode: null,

  // モードを設定
  setMode: (mode: DrawingMode) =>
    set((state) => ({
      currentMode: mode,
      previousMode: state.currentMode !== mode ? state.currentMode : state.previousMode,
    })),

  // モードをトグル（同じモードなら前のモードに戻る）
  toggleMode: (mode: DrawingMode) =>
    set((state) => {
      if (state.currentMode === mode && state.previousMode) {
        // 現在と同じモードなら前のモードに戻る
        return {
          currentMode: state.previousMode,
          previousMode: mode,
        };
      } else {
        // 違うモードなら切り替え
        return {
          currentMode: mode,
          previousMode: state.currentMode,
        };
      }
    }),

  // 前のモードを取得
  getPreviousMode: () => get().previousMode,

  // 現在のモード情報を取得
  getCurrentModeInfo: () => MODES[get().currentMode],
}));
