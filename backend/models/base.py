"""
ベースモデル

全てのPydanticモデルの基底クラスと共通フィールドを定義
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class TimestampMixin(BaseModel):
    """
    タイムスタンプフィールドのMixin

    作成日時と更新日時を持つモデルで使用
    """
    created_at: Optional[datetime] = Field(
        default=None,
        description="作成日時"
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        description="更新日時"
    )


class BaseDBModel(TimestampMixin):
    """
    データベースモデルの基底クラス

    全てのデータベースモデルで共通するフィールドを定義
    """
    id: Optional[str] = Field(
        default=None,
        description="UUID形式のID"
    )

    model_config = ConfigDict(
        from_attributes=True,  # ORMモードを有効化（Pydantic v2）
        populate_by_name=True,  # エイリアス名でのフィールド設定を許可
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    )


class APIResponse(BaseModel):
    """
    API共通レスポンスモデル
    """
    success: bool = Field(description="処理の成功/失敗")
    message: Optional[str] = Field(
        default=None,
        description="レスポンスメッセージ"
    )


class PaginationParams(BaseModel):
    """
    ページネーションパラメータ

    クエリパラメータとして使用
    """
    page: int = Field(
        default=1,
        ge=1,
        description="ページ番号（1から開始）"
    )
    page_size: int = Field(
        default=20,
        ge=1,
        le=100,
        description="1ページあたりのアイテム数（最大100）"
    )

    @property
    def offset(self) -> int:
        """
        SQLのOFFSET値を計算

        Returns:
            int: オフセット値
        """
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        """
        SQLのLIMIT値を取得

        Returns:
            int: リミット値
        """
        return self.page_size


class ErrorDetail(BaseModel):
    """
    エラー詳細モデル
    """
    code: str = Field(description="エラーコード")
    message: str = Field(description="エラーメッセージ")
    field: Optional[str] = Field(
        default=None,
        description="エラーが発生したフィールド名"
    )
