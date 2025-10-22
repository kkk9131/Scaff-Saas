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
