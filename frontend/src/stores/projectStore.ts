/**
 * プロジェクト状態管理ストア
 * 現在選択中のプロジェクト情報を管理
 */

import { create } from 'zustand';

// プロジェクト情報の型定義
export interface Project {
  id: string;
  name: string;
  description?: string;
  customer_name?: string;
  site_address?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  user_id: string;
}

// プロジェクトストアの状態型定義
interface ProjectState {
  // 状態
  currentProject: Project | null;
  recentProjects: Project[];

  // アクション
  setCurrentProject: (project: Project | null) => void;
  setRecentProjects: (projects: Project[]) => void;
  addRecentProject: (project: Project) => void;
  clearCurrentProject: () => void;
}

/**
 * プロジェクトストア
 * 現在選択中のプロジェクトと最近使用したプロジェクトを管理
 */
export const useProjectStore = create<ProjectState>()((set) => ({
  // 初期状態
  currentProject: null,
  recentProjects: [],

  // 現在のプロジェクトをセット
  setCurrentProject: (project) =>
    set({
      currentProject: project,
    }),

  // 最近使用したプロジェクトリストをセット
  setRecentProjects: (projects) =>
    set({
      recentProjects: projects.slice(0, 5), // 最大5件まで保持
    }),

  // 最近使用したプロジェクトに追加
  addRecentProject: (project) =>
    set((state) => {
      // 重複を削除して先頭に追加
      const filtered = state.recentProjects.filter((p) => p.id !== project.id);
      return {
        recentProjects: [project, ...filtered].slice(0, 5),
      };
    }),

  // 現在のプロジェクトをクリア
  clearCurrentProject: () =>
    set({
      currentProject: null,
    }),
}));
