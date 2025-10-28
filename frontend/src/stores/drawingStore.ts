/**
 * 作図状態管理ストア
 * キャンバス上の作図データと編集状態を管理
 */

import { create } from 'zustand';

// 作図要素の型定義
export interface DrawingElement {
  id: string;
  type: 'line' | 'rect' | 'circle' | 'scaffold' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
}

// 作図ツールの型
export type DrawingTool =
  | 'select'
  | 'line'
  | 'rect'
  | 'circle'
  | 'scaffold'
  | 'text'
  | 'eraser'
  | 'pan';

// 作図ストアの状態型定義
interface DrawingState {
  // 状態
  elements: DrawingElement[];
  selectedElementIds: string[];
  currentTool: DrawingTool;
  isDrawing: boolean;
  canvasScale: number;
  canvasPosition: { x: number; y: number };
  history: DrawingElement[][];
  historyIndex: number;

  // グリッド設定
  gridSize: 150 | 300;
  snapToGrid: boolean;
  showGrid: boolean;
  mousePosition: { x: number; y: number };

  // UI状態
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  underbarVisible: boolean;
  modeTabsVisible: boolean;

  // アクション - 要素操作
  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  removeElement: (id: string) => void;
  clearElements: () => void;

  // アクション - 選択操作
  selectElement: (id: string) => void;
  selectMultipleElements: (ids: string[]) => void;
  deselectAll: () => void;

  // アクション - ツール操作
  setTool: (tool: DrawingTool) => void;
  setDrawing: (isDrawing: boolean) => void;

  // アクション - キャンバス操作
  setCanvasScale: (scale: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
  resetCanvas: () => void;

  // アクション - グリッド操作
  setGridSize: (size: 150 | 300) => void;
  toggleSnapToGrid: () => void;
  toggleShowGrid: () => void;
  setMousePosition: (position: { x: number; y: number }) => void;

  // アクション - UI操作
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleUnderbar: () => void;
  toggleModeTabs: () => void;

  // アクション - 履歴操作
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
}

/**
 * 作図ストア
 * 作図キャンバスの状態と操作を管理
 */
export const useDrawingStore = create<DrawingState>()((set, get) => ({
  // 初期状態
  elements: [],
  selectedElementIds: [],
  currentTool: 'select',
  isDrawing: false,
  canvasScale: 1,
  canvasPosition: { x: 0, y: 0 },
  history: [[]],
  historyIndex: 0,

  // グリッド設定の初期状態
  gridSize: 150, // デフォルトは150mm
  snapToGrid: true, // デフォルトでスナップON
  showGrid: true, // デフォルトでグリッド表示ON
  mousePosition: { x: 0, y: 0 },

  // UI状態の初期状態
  leftSidebarOpen: true, // デフォルトで左サイドバー表示
  rightSidebarOpen: true, // デフォルトで右サイドバー表示
  underbarVisible: true, // デフォルトでアンダーバー表示
  modeTabsVisible: true, // デフォルトでモードタブ表示

  // 要素を追加
  addElement: (element) =>
    set((state) => {
      const newElements = [...state.elements, element];
      return {
        elements: newElements,
      };
    }),

  // 要素を更新
  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),

  // 要素を削除
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementIds: state.selectedElementIds.filter(
        (selectedId) => selectedId !== id
      ),
    })),

  // すべての要素をクリア
  clearElements: () =>
    set({
      elements: [],
      selectedElementIds: [],
    }),

  // 要素を選択
  selectElement: (id) =>
    set({
      selectedElementIds: [id],
    }),

  // 複数要素を選択
  selectMultipleElements: (ids) =>
    set({
      selectedElementIds: ids,
    }),

  // すべての選択を解除
  deselectAll: () =>
    set({
      selectedElementIds: [],
    }),

  // ツールを設定
  setTool: (tool) =>
    set({
      currentTool: tool,
      selectedElementIds: [], // ツール変更時は選択解除
    }),

  // 描画中フラグを設定
  setDrawing: (isDrawing) =>
    set({
      isDrawing,
    }),

  // キャンバスの拡大率を設定
  setCanvasScale: (scale) =>
    set({
      canvasScale: Math.max(0.1, Math.min(scale, 5)), // 0.1〜5倍の範囲
    }),

  // キャンバスの位置を設定
  setCanvasPosition: (position) =>
    set({
      canvasPosition: position,
    }),

  // キャンバスをリセット
  resetCanvas: () =>
    set({
      canvasScale: 1,
      canvasPosition: { x: 0, y: 0 },
    }),

  // グリッドサイズを設定（150mm or 300mm）
  setGridSize: (size) =>
    set({
      gridSize: size,
    }),

  // スナップのON/OFF切替
  toggleSnapToGrid: () =>
    set((state) => ({
      snapToGrid: !state.snapToGrid,
    })),

  // グリッド表示のON/OFF切替
  toggleShowGrid: () =>
    set((state) => ({
      showGrid: !state.showGrid,
    })),

  // マウス座標を更新
  setMousePosition: (position) =>
    set({
      mousePosition: position,
    }),

  // UI操作 - 左サイドバーの開閉
  toggleLeftSidebar: () =>
    set((state) => ({
      leftSidebarOpen: !state.leftSidebarOpen,
    })),

  // UI操作 - 右サイドバーの開閉
  toggleRightSidebar: () =>
    set((state) => ({
      rightSidebarOpen: !state.rightSidebarOpen,
    })),

  // UI操作 - アンダーバーの表示/非表示
  toggleUnderbar: () =>
    set((state) => ({
      underbarVisible: !state.underbarVisible,
    })),

  // UI操作 - モードタブの表示/非表示
  toggleModeTabs: () =>
    set((state) => ({
      modeTabsVisible: !state.modeTabsVisible,
    })),

  // 履歴を保存
  saveHistory: () =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.elements]);
      return {
        history: newHistory.slice(-50), // 最大50履歴まで保持
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // 元に戻す
  undo: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          elements: [...state.history[newIndex]],
          historyIndex: newIndex,
        };
      }
      return state;
    }),

  // やり直す
  redo: () =>
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          elements: [...state.history[newIndex]],
          historyIndex: newIndex,
        };
      }
      return state;
    }),
}));
