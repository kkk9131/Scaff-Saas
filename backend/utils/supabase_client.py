"""
Supabaseクライアント設定

SupabaseのPythonクライアントを初期化し、
データベースとStorageへのアクセスを提供する
"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# 環境変数の読み込み
load_dotenv()

logger = logging.getLogger(__name__)

# Supabase接続情報
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service Roleキー（バックエンド用）


class SupabaseClient:
    """
    Supabaseクライアントのシングルトンクラス
    アプリケーション全体で1つのインスタンスを共有
    """

    _instance: Optional["SupabaseClient"] = None
    _client: Optional[Client] = None

    def __new__(cls):
        """
        シングルトンパターンの実装
        インスタンスが1つしか作成されないことを保証
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """
        Supabaseクライアントの初期化
        """
        if self._client is None:
            if not SUPABASE_URL or not SUPABASE_KEY:
                raise ValueError(
                    "SUPABASE_URLとSUPABASE_KEYが環境変数に設定されていません。"
                    ".envファイルを確認してください。"
                )

            try:
                self._client = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info("Supabaseクライアントの初期化に成功しました")
            except Exception as e:
                logger.error(f"Supabaseクライアントの初期化に失敗しました: {e}")
                raise

    @property
    def client(self) -> Client:
        """
        Supabaseクライアントインスタンスを取得
        """
        if self._client is None:
            raise RuntimeError("Supabaseクライアントが初期化されていません")
        return self._client

    def get_table(self, table_name: str):
        """
        指定されたテーブルへのアクセスを取得

        Args:
            table_name: テーブル名

        Returns:
            Supabaseテーブルクエリビルダー
        """
        return self.client.table(table_name)

    def get_storage(self, bucket_name: str):
        """
        指定されたStorageバケットへのアクセスを取得

        Args:
            bucket_name: バケット名

        Returns:
            Supabase Storageクライアント
        """
        return self.client.storage.from_(bucket_name)

    async def health_check(self) -> bool:
        """
        Supabase接続のヘルスチェック

        Returns:
            接続が正常ならTrue、異常ならFalse
        """
        try:
            # projectsテーブルへの軽量クエリで接続確認
            response = self.client.table("projects").select("id").limit(1).execute()
            logger.info("Supabase接続チェック: OK")
            return True
        except Exception as e:
            logger.error(f"Supabase接続チェック: NG - {e}")
            return False


# グローバルインスタンス
_supabase_client: Optional[SupabaseClient] = None


def get_supabase() -> SupabaseClient:
    """
    Supabaseクライアントのグローバルインスタンスを取得

    Returns:
        SupabaseClientインスタンス

    Example:
        >>> supabase = get_supabase()
        >>> projects = supabase.get_table("projects").select("*").execute()
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client


# 便利関数: 直接クライアントを取得
def get_supabase_client() -> Client:
    """
    Supabaseクライアントを直接取得

    Returns:
        Supabase Clientインスタンス

    Example:
        >>> client = get_supabase_client()
        >>> response = client.table("projects").select("*").execute()
    """
    return get_supabase().client
