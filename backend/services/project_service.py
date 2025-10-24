"""
プロジェクトサービス

プロジェクト関連のビジネスロジックを実装
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import uuid

from utils.supabase_client import get_supabase
from models.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectStatus
)

logger = logging.getLogger(__name__)


class ProjectService:
    """
    プロジェクト管理サービス

    プロジェクトのCRUD操作とビジネスロジックを提供
    """

    def __init__(self):
        """サービスの初期化"""
        self.supabase = get_supabase()
        self.table_name = "projects"

    async def create_project(
        self,
        project_data: ProjectCreate
    ) -> Project:
        """
        新規プロジェクトを作成

        Args:
            project_data: プロジェクト作成データ

        Returns:
            Project: 作成されたプロジェクト

        Raises:
            Exception: データベースエラー
        """
        try:
            # プロジェクトデータを辞書に変換
            data = project_data.model_dump(exclude_unset=True)

            # 日付をISO形式の文字列に変換
            if 'start_date' in data and data['start_date'] is not None:
                data['start_date'] = data['start_date'].isoformat()
            if 'end_date' in data and data['end_date'] is not None:
                data['end_date'] = data['end_date'].isoformat()

            # データベースに挿入
            response = self.supabase.table(self.table_name).insert(data).execute()

            if not response.data:
                raise Exception("プロジェクトの作成に失敗しました")

            logger.info(f"プロジェクトを作成しました: {response.data[0]['id']}")
            return Project(**response.data[0])

        except Exception as e:
            logger.error(f"プロジェクト作成エラー: {str(e)}")
            raise

    async def get_project(
        self,
        project_id: str,
        user_id: str
    ) -> Optional[Project]:
        """
        プロジェクトを取得

        Args:
            project_id: プロジェクトID
            user_id: ユーザーID（権限確認用）

        Returns:
            Optional[Project]: プロジェクト（存在しない場合はNone）

        Raises:
            Exception: データベースエラー
        """
        try:
            response = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("id", project_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                logger.warning(f"プロジェクトが見つかりません: {project_id}")
                return None

            return Project(**response.data[0])

        except Exception as e:
            logger.error(f"プロジェクト取得エラー: {str(e)}")
            raise

    async def list_projects(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ProjectStatus] = None
    ) -> Dict[str, Any]:
        """
        プロジェクト一覧を取得

        Args:
            user_id: ユーザーID
            page: ページ番号（1から開始）
            page_size: 1ページあたりのアイテム数
            status: フィルター用ステータス（オプション）

        Returns:
            Dict[str, Any]: プロジェクト一覧と総数

        Raises:
            Exception: データベースエラー
        """
        try:
            # 基本クエリ
            query = (
                self.supabase.table(self.table_name)
                .select("*", count="exact")
                .eq("user_id", user_id)
            )

            # ステータスフィルター
            if status:
                query = query.eq("status", status.value)

            # ソート（更新日時の降順）
            query = query.order("updated_at", desc=True)

            # ページネーション
            offset = (page - 1) * page_size
            query = query.range(offset, offset + page_size - 1)

            # 実行
            response = query.execute()

            projects = [Project(**item) for item in response.data]
            total = response.count if response.count is not None else 0

            logger.info(f"プロジェクト一覧を取得しました: {len(projects)}件")

            return {
                "projects": projects,
                "total": total,
                "page": page,
                "page_size": page_size
            }

        except Exception as e:
            logger.error(f"プロジェクト一覧取得エラー: {str(e)}")
            raise

    async def update_project(
        self,
        project_id: str,
        user_id: str,
        project_data: ProjectUpdate
    ) -> Optional[Project]:
        """
        プロジェクトを更新

        Args:
            project_id: プロジェクトID
            user_id: ユーザーID（権限確認用）
            project_data: 更新データ

        Returns:
            Optional[Project]: 更新されたプロジェクト（存在しない場合はNone）

        Raises:
            Exception: データベースエラー
        """
        try:
            # 更新データを辞書に変換（Noneを除外）
            data = project_data.model_dump(exclude_unset=True, exclude_none=True)

            if not data:
                # 更新するデータがない場合は現在のデータを返す
                return await self.get_project(project_id, user_id)

            # 日付をISO形式の文字列に変換
            if 'start_date' in data and data['start_date'] is not None:
                data['start_date'] = data['start_date'].isoformat()
            if 'end_date' in data and data['end_date'] is not None:
                data['end_date'] = data['end_date'].isoformat()

            # updated_atを現在時刻に更新
            data['updated_at'] = datetime.utcnow().isoformat()

            # データベースを更新
            response = (
                self.supabase.table(self.table_name)
                .update(data)
                .eq("id", project_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                logger.warning(f"プロジェクトが見つかりません: {project_id}")
                return None

            logger.info(f"プロジェクトを更新しました: {project_id}")
            return Project(**response.data[0])

        except Exception as e:
            logger.error(f"プロジェクト更新エラー: {str(e)}")
            raise

    async def delete_project(
        self,
        project_id: str,
        user_id: str
    ) -> bool:
        """
        プロジェクトを削除

        Args:
            project_id: プロジェクトID
            user_id: ユーザーID（権限確認用）

        Returns:
            bool: 削除成功したか

        Raises:
            Exception: データベースエラー
        """
        try:
            response = (
                self.supabase.table(self.table_name)
                .delete()
                .eq("id", project_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not response.data:
                logger.warning(f"プロジェクトが見つかりません: {project_id}")
                return False

            logger.info(f"プロジェクトを削除しました: {project_id}")
            return True

        except Exception as e:
            logger.error(f"プロジェクト削除エラー: {str(e)}")
            raise

    async def duplicate_project(
        self,
        project_id: str,
        user_id: str,
        new_name: Optional[str] = None
    ) -> Optional[Project]:
        """
        プロジェクトを複製

        Args:
            project_id: 複製元プロジェクトID
            user_id: ユーザーID（権限確認用）
            new_name: 複製後のプロジェクト名（Noneの場合は「〜のコピー」を付与）

        Returns:
            Optional[Project]: 複製されたプロジェクト（元が存在しない場合はNone）

        Raises:
            Exception: データベースエラー
        """
        try:
            # 元のプロジェクトを取得
            original = await self.get_project(project_id, user_id)
            if not original:
                return None

            # 複製データを作成
            duplicate_data = original.model_dump(
                exclude={'id', 'created_at', 'updated_at'}
            )

            # 新しい名前を設定
            if new_name:
                duplicate_data['name'] = new_name
            else:
                duplicate_data['name'] = f"{original.name} のコピー"

            # ステータスをdraftにリセット
            duplicate_data['status'] = ProjectStatus.DRAFT

            # 新規プロジェクトとして作成
            create_data = ProjectCreate(**duplicate_data)
            duplicated = await self.create_project(create_data)

            logger.info(f"プロジェクトを複製しました: {project_id} -> {duplicated.id}")
            return duplicated

        except Exception as e:
            logger.error(f"プロジェクト複製エラー: {str(e)}")
            raise
