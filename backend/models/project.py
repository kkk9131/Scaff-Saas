"""
プロジェクトモデル

足場プロジェクトのデータモデルを定義
"""

from pydantic import Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import date
from enum import Enum

from models.base import BaseDBModel


class ProjectStatus(str, Enum):
    """
    プロジェクトのステータス定義

    - draft: 下書き（作成中）
    - active: 進行中
    - completed: 完了
    - archived: アーカイブ済み
    """
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectBase(BaseDBModel):
    """
    プロジェクトの基本情報

    全てのプロジェクト関連モデルで共通するフィールド
    """
    name: str = Field(
        ...,
        description="プロジェクト名",
        min_length=1,
        max_length=200
    )
    description: Optional[str] = Field(
        default=None,
        description="プロジェクトの説明",
        max_length=1000
    )
    status: ProjectStatus = Field(
        default=ProjectStatus.DRAFT,
        description="プロジェクトのステータス"
    )
    customer_name: Optional[str] = Field(
        default=None,
        description="顧客名",
        max_length=100
    )
    site_address: Optional[str] = Field(
        default=None,
        description="現場住所",
        max_length=300
    )
    start_date: Optional[date] = Field(
        default=None,
        description="プロジェクト開始日"
    )
    end_date: Optional[date] = Field(
        default=None,
        description="プロジェクト終了日"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="追加メタデータ（JSON形式）"
    )

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v: Optional[date], info) -> Optional[date]:
        """
        終了日が開始日より後であることを検証

        Args:
            v: 終了日
            info: バリデーション情報（start_dateを含む）

        Returns:
            Optional[date]: 検証済みの終了日

        Raises:
            ValueError: 終了日が開始日より前の場合
        """
        start_date = info.data.get('start_date')
        if v is not None and start_date is not None:
            if v < start_date:
                raise ValueError('終了日は開始日より後である必要があります')
        return v


class ProjectCreate(ProjectBase):
    """
    プロジェクト作成時のリクエストモデル

    新規プロジェクト作成に必要なフィールド
    """
    user_id: str = Field(
        ...,
        description="プロジェクト所有者のユーザーID（UUID）"
    )


class ProjectUpdate(BaseDBModel):
    """
    プロジェクト更新時のリクエストモデル

    全てのフィールドがオプショナル（部分更新可能）
    """
    name: Optional[str] = Field(
        default=None,
        description="プロジェクト名",
        min_length=1,
        max_length=200
    )
    description: Optional[str] = Field(
        default=None,
        description="プロジェクトの説明",
        max_length=1000
    )
    status: Optional[ProjectStatus] = Field(
        default=None,
        description="プロジェクトのステータス"
    )
    customer_name: Optional[str] = Field(
        default=None,
        description="顧客名",
        max_length=100
    )
    site_address: Optional[str] = Field(
        default=None,
        description="現場住所",
        max_length=300
    )
    start_date: Optional[date] = Field(
        default=None,
        description="プロジェクト開始日"
    )
    end_date: Optional[date] = Field(
        default=None,
        description="プロジェクト終了日"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="追加メタデータ（JSON形式）"
    )


class Project(ProjectBase):
    """
    プロジェクトの完全なデータモデル

    データベースから取得したプロジェクト情報を表現
    """
    user_id: str = Field(
        ...,
        description="プロジェクト所有者のユーザーID（UUID）"
    )


class ProjectListResponse(BaseDBModel):
    """
    プロジェクト一覧取得時のレスポンスモデル
    """
    projects: List[Project] = Field(
        ...,
        description="プロジェクトのリスト"
    )
    total: int = Field(
        ...,
        description="総プロジェクト数"
    )
    page: int = Field(
        ...,
        description="現在のページ番号"
    )
    page_size: int = Field(
        ...,
        description="1ページあたりのアイテム数"
    )


class ProjectDuplicateRequest(BaseDBModel):
    """
    プロジェクト複製時のリクエストモデル
    """
    new_name: Optional[str] = Field(
        default=None,
        description="複製後のプロジェクト名（指定しない場合は「〜のコピー」が付与される）",
        max_length=200
    )
