"""
Supabaseクライアント設定

SupabaseのPythonクライアントを初期化し、
データベースとStorageへのアクセスを提供する
"""

import os
import threading
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# 環境変数の読み込み
load_dotenv()

logger = logging.getLogger(__name__)

# Supabase接続情報
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service Roleキー（バックエンド用・管理操作）
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # 匿名キー（ヘルスチェック用）


class SupabaseClient:
    """
    Supabaseクライアントのシングルトンクラス（スレッドセーフ）
    アプリケーション全体で1つのインスタンスを共有
    """

    _instance: Optional["SupabaseClient"] = None
    _lock = threading.Lock()  # スレッドセーフのためのロック
    _initialized = False  # 初期化済みフラグ
    _client: Optional[Client] = None
    _anon_client: Optional[Client] = None  # ヘルスチェック用匿名クライアント

    def __new__(cls):
        """
        スレッドセーフなシングルトンパターンの実装
        Double-checked lockingパターンでインスタンスが1つしか作成されないことを保証
        """
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """
        Supabaseクライアントの初期化（1回のみ実行される）
        """
        # 既に初期化済みの場合は何もしない
        if self._initialized:
            return

        with self._lock:
            # Double-checked locking: ロック取得後に再度確認
            if self._initialized:
                return

            # 環境変数の検証
            if not SUPABASE_URL or not SUPABASE_KEY:
                raise ValueError(
                    "SUPABASE_URLとSUPABASE_KEYが環境変数に設定されていません。"
                    ".envファイルを確認してください。"
                )

            try:
                # 管理用クライアント（Service Role Key）
                self._client = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info("Supabaseクライアント（管理用）の初期化に成功しました")

                # ヘルスチェック用クライアント（匿名キー）
                if SUPABASE_ANON_KEY:
                    self._anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
                    logger.info("Supabaseクライアント（匿名用）の初期化に成功しました")
                else:
                    logger.warning(
                        "SUPABASE_ANON_KEYが設定されていません。ヘルスチェックには管理用キーが使用されます。"
                    )

                # 初期化完了フラグを立てる
                self._initialized = True

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
        セキュリティのため、匿名キー（ANON_KEY）を使用

        Returns:
            接続が正常ならTrue、異常ならFalse
        """
        try:
            # ヘルスチェックには匿名クライアントを使用（RLSが適用される安全なキー）
            # 匿名クライアントが無い場合は管理用クライアントを使用（後方互換性）
            check_client = self._anon_client if self._anon_client else self._client

            if not check_client:
                logger.error("Supabase接続チェック: クライアントが初期化されていません")
                return False

            # projectsテーブルへの軽量クエリで接続確認
            # RLSポリシーが設定されている場合、匿名キーでは空の結果が返る可能性があるが
            # それでも接続自体は成功しているため、例外が発生しなければOK
            response = check_client.table("projects").select("id").limit(1).execute()
            logger.info(
                f"Supabase接続チェック: OK "
                f"(使用キー: {'匿名' if self._anon_client else '管理用'})"
            )
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
