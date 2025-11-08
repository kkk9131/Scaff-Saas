/**
 * 作図状態管理ストア
 * キャンバス上の作図データと編集状態を管理
 */

import { create } from 'zustand';
import type { BracketSize, ScaffoldGroup, ScaffoldPartType } from '@/types/scaffold';

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

/**
 * メモの型定義
 * キャンバス上のメモ領域を表す
 */
export interface Memo {
  id: string;
  /** メモ領域の左上座標（キャンバス座標系） */
  position: { x: number; y: number };
  /** メモ領域のサイズ（px） */
  size: { width: number; height: number };
  /** メモのテキスト内容 */
  text: string;
  /** 作成日時（ISO文字列） */
  createdAt: string;
  /** 更新日時（ISO文字列） */
  updatedAt: string;
}

/**
 * 履歴スナップショットの型定義
 * 作図状態を保存するためのスナップショット
 */
interface DrawingSnapshot {
  scaffoldGroups: ScaffoldGroup[];
  memos: Memo[];
  elements: DrawingElement[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

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
  history: DrawingSnapshot[];
  historyIndex: number;

  // グリッド設定
  gridSize: 150 | 300;
  snapToGrid: boolean;
  showGrid: boolean;
  snapToRightAngle: boolean; // 直角モード（90度の倍数にスナップ）
  mousePosition: { x: number; y: number };

  // サックスモード設定
  currentColor: 'white' | 'red' | 'blue' | 'green';
  bracketSize: BracketSize;
  directionReversed: boolean;

  // 編集モード設定
  /**
   * 編集対象の部材種別
   * - 編集モード時に左サイドバーで選択する対象（柱/布材/ブラケット/アンチ/階段/梁枠）
   */
  editTargetType: ScaffoldPartType;
  /**
   * 編集モード時の選択モード
   * - 'select': 通常の選択モード（クリックで選択）
   * - 'lasso': 投げ縄モード（ドラッグで範囲選択）
   * - 'bulk': 一括選択モード（複数要素を一括操作）
   * - null: 選択モード未選択
   */
  editSelectionMode: 'select' | 'lasso' | 'bulk' | 'delete' | null;

  /**
   * 一括編集時の対象スコープ（柱）
   * - 'selected': ユーザーが選択した柱のみ
   * - 'all': キャンバス内のすべての柱
   */
  bulkPillarScope: 'selected' | 'all';
  /**
   * 一括編集時の対象スコープ（布材）
   * - 'selected': ユーザーが選択した布材のみ
   * - 'all': キャンバス内のすべての布材
   */
  bulkClothScope: 'selected' | 'all';
  /**
   * 一括編集時の対象スコープ（ブラケット）
   * - 'selected': ユーザーが選択したブラケットのみ
   * - 'all': キャンバス内のすべてのブラケット
   */
  bulkBracketScope: 'selected' | 'all';
  /** アンチ一括の動作種別（数量/段数/追加） */
  bulkAntiAction: 'quantity' | 'level' | 'add';
  /**
   * 一括編集時の対象スコープ（アンチ）
   * - 'selected': ユーザーが選択したアンチのみ
   * - 'all': キャンバス内のすべてのアンチ
   */
  bulkAntiScope: 'selected' | 'all';

  /**
   * 投げ縄モード時の発光色選択
   * - 'yellow': 黄色発光（#FACC15）
   * - 'blue': 青色発光（#60A5FA）
   * - 'green': 緑色発光（#34D399）
   * - null: 未選択
   */
  lassoGlowColor: 'yellow' | 'blue' | 'green' | null;

  /**
   * 投げ縄モード時のドラッグ範囲
   * - 投げ縄モードでドラッグ中の囲い範囲を保存
   */
  lassoSelectionArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;

  /**
   * 投げ縄モード時のパス（自由形状）
   * - 投げ縄モードでドラッグ中のパスを保存
   * - 点の配列として保存
   */
  lassoPath: { x: number; y: number }[] | null;

  // 足場グループ
  scaffoldGroups: ScaffoldGroup[];
  /**
   * 編集モード用: 選択中の足場パーツ（グループID:パーツID）キー配列
   * - 例: ["<groupId>:<partId>"]
   * - 柱/布材/ブラケット/アンチ/階段/梁枠の複数選択で使用
   */
  selectedScaffoldPartKeys: string[];

  // メモモード設定
  /** メモ一覧 */
  memos: Memo[];
  /** 選択中のメモID */
  selectedMemoId: string | null;

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
  toggleSnapToRightAngle: () => void;
  setMousePosition: (position: { x: number; y: number }) => void;

  // アクション - サックスモード操作
  setCurrentColor: (color: 'white' | 'red' | 'blue' | 'green') => void;
  setBracketSize: (size: BracketSize) => void;
  setDirectionReversed: (reversed: boolean) => void;
  toggleDirectionReversed: () => void;

  // アクション - 編集モード操作
  /**
   * 編集対象の部材種別を設定
   * @param type - '柱' | '布材' | 'ブラケット' | 'アンチ' | '階段' | '梁枠'
   */
  setEditTargetType: (type: ScaffoldPartType) => void;
  /**
   * 編集モード時の選択モードを設定（トグル機能付き）
   * @param mode - 'select' | 'lasso' | 'bulk' | null
   * 同じモードをクリックした場合はnullに解除
   */
  setEditSelectionMode: (mode: 'select' | 'lasso' | 'bulk' | 'delete' | null) => void;
  /** 投げ縄モード時の発光色を設定 */
  setLassoGlowColor: (color: 'yellow' | 'blue' | 'green' | null) => void;
  /** 投げ縄モード時のドラッグ範囲を設定 */
  setLassoSelectionArea: (area: { start: { x: number; y: number }; end: { x: number; y: number } } | null) => void;
  /** 投げ縄モード時のパスを設定 */
  setLassoPath: (path: { x: number; y: number }[] | null) => void;
  /** 一括編集スコープ（柱）の設定 */
  setBulkPillarScope: (scope: 'selected' | 'all') => void;
  /** 一括編集スコープ（布材）の設定 */
  setBulkClothScope: (scope: 'selected' | 'all') => void;
  /** 一括編集スコープ（ブラケット）の設定 */
  setBulkBracketScope: (scope: 'selected' | 'all') => void;
  /** 一括編集モード（アンチ）の動作を設定（数量/段数/追加） */
  setBulkAntiAction: (action: 'quantity' | 'level' | 'add') => void;
  /** 一括編集スコープ（アンチ）の設定 */
  setBulkAntiScope: (scope: 'selected' | 'all') => void;

  // 編集モード用: 足場パーツ選択操作
  /** 選択をすべて解除 */
  clearScaffoldSelection: () => void;
  /** キー配列で選択を置き換え */
  selectScaffoldParts: (keys: string[]) => void;
  /** 1件トグル（多選択用） */
  toggleSelectScaffoldPart: (key: string) => void;

  // アクション - 足場グループ操作
  addScaffoldGroup: (group: ScaffoldGroup) => void;
  updateScaffoldGroup: (id: string, updates: Partial<ScaffoldGroup>) => void;
  removeScaffoldGroup: (id: string) => void;
  clearScaffoldGroups: () => void;

  // アクション - メモ操作
  /** メモを追加 */
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  /** メモを更新 */
  updateMemo: (id: string, updates: Partial<Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  /** メモを削除 */
  removeMemo: (id: string) => void;
  /** すべてのメモをクリア */
  clearMemos: () => void;
  /** 選択中のメモIDを設定 */
  setSelectedMemoId: (id: string | null) => void;

  // アクション - UI操作
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleUnderbar: () => void;
  toggleModeTabs: () => void;

  // アクション - 履歴操作
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  /**
   * 作図データをすべてリセット
   * scaffoldGroups、memos、elementsをすべてクリアし、履歴もリセット
   */
  resetDrawing: () => void;

  // アクション - データエクスポート
  /**
   * 作図データをJSON形式でエクスポート
   * @returns エクスポート用のJSONデータ
   */
  exportToJSON: () => string;

  /**
   * JSONから作図データをインポート
   * - exportToJSON() が出力する構造、もしくはそれと同等のオブジェクトを受け取る
   * - 既存の作図状態を上書きする
   */
  importFromJSON: (json: string | Record<string, unknown>) => void;
}

/**
 * 作図ストア
 * 作図キャンバスの状態と操作を管理
 */
export const useDrawingStore = create<DrawingState>()((set, get) => ({
  // 初期状態
  elements: [],
  selectedElementIds: [],
  currentTool: 'scaffold', // デフォルトはサックスモード（scaffold）
  isDrawing: false,
  canvasScale: 1,
  canvasPosition: { x: 0, y: 0 },
  history: [{ scaffoldGroups: [], memos: [], elements: [] }],
  historyIndex: 0,

  // グリッド設定の初期状態
  gridSize: 150, // デフォルトは150mm
  snapToGrid: true, // デフォルトでスナップON
  showGrid: true, // デフォルトでグリッド表示ON
  snapToRightAngle: false, // デフォルトで直角モードOFF
  mousePosition: { x: 0, y: 0 },

  // サックスモード設定の初期状態
  currentColor: 'white', // デフォルトは白色
  bracketSize: 'W', // デフォルトはW（600mm）
  directionReversed: false, // デフォルトは通常方向
  scaffoldGroups: [], // 足場グループは空
  selectedScaffoldPartKeys: [], // 足場パーツの選択キー

  // メモモード設定の初期状態
  memos: [], // メモは空
  selectedMemoId: null, // 選択中のメモIDはnull

  // 編集モード設定の初期状態
  editTargetType: '柱', // デフォルトは柱を編集対象にする
  editSelectionMode: 'select', // デフォルトは選択モード（クリックで選択）
  bulkPillarScope: 'selected', // デフォルトは選択対象のみ
  bulkClothScope: 'selected', // デフォルトは選択対象のみ
  bulkBracketScope: 'selected', // デフォルトは選択対象のみ
  bulkAntiAction: 'quantity',
  bulkAntiScope: 'selected', // デフォルトは選択対象のみ
  lassoGlowColor: null, // 投げ縄モード時の発光色は未選択
  lassoSelectionArea: null, // 投げ縄モード時のドラッグ範囲は未設定（互換性のため残す）
  lassoPath: null, // 投げ縄モード時のパスは未設定

  // UI状態の初期状態
  leftSidebarOpen: true, // デフォルトで左サイドバー表示
  rightSidebarOpen: false, // デフォルトではAIチャット（右サイドバー）を閉じておく
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

  // 直角モードのON/OFF切替
  toggleSnapToRightAngle: () =>
    set((state) => ({
      snapToRightAngle: !state.snapToRightAngle,
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
      // scaffoldGroupsとmemosも含めたスナップショットを作成
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(state.scaffoldGroups)), // ディープコピー
        memos: JSON.parse(JSON.stringify(state.memos)), // ディープコピー
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
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
        const snapshot = state.history[newIndex];
        return {
          scaffoldGroups: JSON.parse(JSON.stringify(snapshot.scaffoldGroups)), // ディープコピー
          memos: JSON.parse(JSON.stringify(snapshot.memos)), // ディープコピー
          elements: [...snapshot.elements],
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
        const snapshot = state.history[newIndex];
        return {
          scaffoldGroups: JSON.parse(JSON.stringify(snapshot.scaffoldGroups)), // ディープコピー
          memos: JSON.parse(JSON.stringify(snapshot.memos)), // ディープコピー
          elements: [...snapshot.elements],
          historyIndex: newIndex,
        };
      }
      return state;
    }),

  // サックスモード操作 - 色を設定
  setCurrentColor: (color) =>
    set({
      currentColor: color,
    }),

  // サックスモード操作 - ブラケットサイズを設定
  setBracketSize: (size) =>
    set({
      bracketSize: size,
    }),

  // サックスモード操作 - 方向反転フラグを設定
  setDirectionReversed: (reversed) =>
    set({
      directionReversed: reversed,
    }),

  // サックスモード操作 - 方向反転フラグを切替
  toggleDirectionReversed: () =>
    set((state) => ({
      directionReversed: !state.directionReversed,
    })),

  // 編集モード操作 - 編集対象部材の設定
  setEditTargetType: (type) =>
    set(() => ({
      /**
       * 編集対象の部材種別を切り替える際に、既存の選択（selectedScaffoldPartKeys）をクリアする。
       * 例: 柱選択のまま布材編集に入った場合でも、柱の選択ハイライトが残らないようにするため。
       */
      editTargetType: type,
      selectedScaffoldPartKeys: [],
    })),

  // 編集モード操作 - 選択モードの設定（トグル機能付き）
  setEditSelectionMode: (mode) =>
    set((state) => {
      // 同じモードをクリックした場合は解除（nullに設定）
      if (state.editSelectionMode === mode) {
        return { editSelectionMode: null };
      }
      // 違うモードなら切り替え
      return { editSelectionMode: mode };
    }),

  // 投げ縄モード時の発光色を設定
  setLassoGlowColor: (color) => set({ lassoGlowColor: color }),
  // 投げ縄モード時のドラッグ範囲を設定
  setLassoSelectionArea: (area) => set({ lassoSelectionArea: area }),
  // 投げ縄モード時のパスを設定
  setLassoPath: (path) => set({ lassoPath: path }),

  // 一括編集スコープ（柱）を設定
  setBulkPillarScope: (scope) => set({ bulkPillarScope: scope }),
  // 一括編集スコープ（布材）を設定
  setBulkClothScope: (scope) => set({ bulkClothScope: scope }),
  // 一括編集スコープ（ブラケット）を設定
  setBulkBracketScope: (scope) => set({ bulkBracketScope: scope }),
  setBulkAntiAction: (action) => set({ bulkAntiAction: action }),
  // 一括編集スコープ（アンチ）を設定
  setBulkAntiScope: (scope) => set({ bulkAntiScope: scope }),

  // 足場グループを追加
  addScaffoldGroup: (group) =>
    set((state) => {
      const newGroups = [...state.scaffoldGroups, group];
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(newGroups)),
        memos: JSON.parse(JSON.stringify(state.memos)),
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        scaffoldGroups: newGroups,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // 足場グループを更新
  updateScaffoldGroup: (id, updates) =>
    set((state) => {
      const newGroups = state.scaffoldGroups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      );
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(newGroups)),
        memos: JSON.parse(JSON.stringify(state.memos)),
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        scaffoldGroups: newGroups,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // 足場グループを削除
  removeScaffoldGroup: (id) =>
    set((state) => {
      const newGroups = state.scaffoldGroups.filter((group) => group.id !== id);
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(newGroups)),
        memos: JSON.parse(JSON.stringify(state.memos)),
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        scaffoldGroups: newGroups,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // すべての足場グループをクリア
  clearScaffoldGroups: () =>
    set((state) => {
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: [],
        memos: JSON.parse(JSON.stringify(state.memos)),
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        scaffoldGroups: [],
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // 編集モード用: 足場パーツ選択操作
  clearScaffoldSelection: () =>
    set({ selectedScaffoldPartKeys: [] }),
  selectScaffoldParts: (keys) =>
    set({ selectedScaffoldPartKeys: Array.from(new Set(keys)) }),
  toggleSelectScaffoldPart: (key) =>
    set((state) => ({
      selectedScaffoldPartKeys: state.selectedScaffoldPartKeys.includes(key)
        ? state.selectedScaffoldPartKeys.filter((k) => k !== key)
        : [...state.selectedScaffoldPartKeys, key],
    })),

  // メモ操作 - メモを追加
  addMemo: (memoData) =>
    set((state) => {
      const now = new Date().toISOString();
      const newMemo: Memo = {
        id: 'memo_' + Math.random().toString(36).slice(2, 10),
        ...memoData,
        createdAt: now,
        updatedAt: now,
      };
      const newMemos = [...state.memos, newMemo];
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(state.scaffoldGroups)),
        memos: JSON.parse(JSON.stringify(newMemos)),
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        memos: newMemos,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // メモ操作 - メモを更新
  updateMemo: (id, updates) =>
    set((state) => {
      const newMemos = state.memos.map((memo) =>
        memo.id === id
          ? { ...memo, ...updates, updatedAt: new Date().toISOString() }
          : memo
      );
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(state.scaffoldGroups)),
        memos: JSON.parse(JSON.stringify(newMemos)),
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        memos: newMemos,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // メモ操作 - メモを削除
  removeMemo: (id) =>
    set((state) => {
      const newMemos = state.memos.filter((memo) => memo.id !== id);
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(state.scaffoldGroups)),
        memos: JSON.parse(JSON.stringify(newMemos)),
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        memos: newMemos,
        selectedMemoId: state.selectedMemoId === id ? null : state.selectedMemoId,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // メモ操作 - すべてのメモをクリア
  clearMemos: () =>
    set((state) => {
      // 履歴を保存
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: JSON.parse(JSON.stringify(state.scaffoldGroups)),
        memos: [],
        elements: [...state.elements],
      };
      newHistory.push(snapshot);
      return {
        memos: [],
        selectedMemoId: null,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // メモ操作 - 選択中のメモIDを設定
  setSelectedMemoId: (id) =>
    set({
      selectedMemoId: id,
    }),

  // 作図データをすべてリセット
  resetDrawing: () =>
    set((state) => {
      // リセット前に履歴を保存（リセット自体も履歴に残す）
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const snapshot: DrawingSnapshot = {
        scaffoldGroups: [],
        memos: [],
        elements: [],
      };
      newHistory.push(snapshot);
      return {
        scaffoldGroups: [],
        memos: [],
        elements: [],
        selectedElementIds: [],
        selectedScaffoldPartKeys: [],
        selectedMemoId: null,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    }),

  // 作図データをJSON形式でエクスポート
  exportToJSON: () => {
    const state = get();
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        scaffoldGroups: state.scaffoldGroups,
        memos: state.memos,
        elements: state.elements,
        canvas: {
          scale: state.canvasScale,
          position: state.canvasPosition,
        },
        grid: {
          size: state.gridSize,
          snapToGrid: state.snapToGrid,
          showGrid: state.showGrid,
        },
        settings: {
          currentColor: state.currentColor,
          bracketSize: state.bracketSize,
          directionReversed: state.directionReversed,
        },
      },
    };
    return JSON.stringify(exportData, null, 2);
  },

  // JSONから作図データをインポート
  importFromJSON: (json) =>
    set((state) => {
      try {
        // 文字列の場合はパース
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        const rawData = isRecord(parsed) && isRecord(parsed.data) ? parsed.data : parsed;
        const data = isRecord(rawData) ? rawData : {};

        const scaffoldGroups = Array.isArray(data.scaffoldGroups)
          ? (data.scaffoldGroups as ScaffoldGroup[])
          : state.scaffoldGroups;
        const memos = Array.isArray(data.memos) ? (data.memos as Memo[]) : state.memos;
        const elements = Array.isArray(data.elements)
          ? (data.elements as DrawingElement[])
          : state.elements;

        const canvas = isRecord(data.canvas) ? data.canvas : {};
        const grid = isRecord(data.grid) ? data.grid : {};
        const settings = isRecord(data.settings) ? data.settings : {};

        // 履歴を保存（インポート直後の状態を起点にする）
        const snapshot: DrawingSnapshot = {
          scaffoldGroups: deepClone(scaffoldGroups),
          memos: deepClone(memos),
          elements: [...elements],
        };

        return {
          scaffoldGroups,
          memos,
          elements,
          canvasScale: typeof canvas.scale === 'number' ? canvas.scale : state.canvasScale,
          canvasPosition: canvas.position ?? state.canvasPosition,
          gridSize: grid.size === 150 || grid.size === 300 ? grid.size : state.gridSize,
          snapToGrid:
            typeof grid.snapToGrid === 'boolean' ? grid.snapToGrid : state.snapToGrid,
          showGrid: typeof grid.showGrid === 'boolean' ? grid.showGrid : state.showGrid,
          currentColor: settings.currentColor ?? state.currentColor,
          bracketSize: settings.bracketSize ?? state.bracketSize,
          directionReversed:
            typeof settings.directionReversed === 'boolean'
              ? settings.directionReversed
              : state.directionReversed,
          history: [snapshot],
          historyIndex: 0,
          selectedElementIds: [],
          selectedScaffoldPartKeys: [],
          selectedMemoId: null,
        };
      } catch (error) {
        console.error('作図データのインポートに失敗しました:', error);
        return state;
      }
    }),
}));
