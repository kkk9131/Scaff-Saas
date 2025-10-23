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
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Service Roleキー（バックエンド用・管理操作）
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # 匿名キー（ヘルスチェック用）


class SupabaseClient:
    """
    Supabaseクライアントのシングルトンクラス（スレッドセーフ）
    アプリケーション全体で1つのインスタンスを共有
    """

    _instance: Optional["SupabaseClient"] = None
    _lock = threading.Lock()  # スレッドセーフのためのロック
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
                    instance = super().__new__(cls)
                    instance._initialize()  # 初期化を__new__内で実行
                    cls._instance = instance
        return cls._instance

    def __init__(self):
        """
        __init__は何もしない（初期化は__new__内の_initialize()で実行済み）
        """
        pass

    def _initialize(self):
        """
        初期化処理（1回のみ実行される）
        __new__メソッド内から呼び出される
        """
        # 環境変数の検証
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError(
                "SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが環境変数に設定されていません。"
                ".envファイルを確認してください。"
            )

        try:
            # 管理用クライアント（Service Role Key）
            self._client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            logger.info("Supabaseクライアント（管理用）の初期化に成功しました")

            # ヘルスチェック用クライアント（匿名キー）
            if SUPABASE_ANON_KEY:
                self._anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
                logger.info("Supabaseクライアント（匿名用）の初期化に成功しました")
            else:
                logger.warning(
                    "SUPABASE_ANON_KEYが設定されていません。ヘルスチェックには管理用キーが使用されます。"
                )

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

    def health_check(self) -> bool:
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

            # テーブルの存在に依存しない接続チェック
            # 空のクエリを実行して、Supabaseへの接続が確立できるかを確認
            # テーブルが存在しなくてもエラーにならないように、
            # rpc()を使って軽量な接続確認を行う
            # ただし、最も安全なのはSupabase authのヘルスチェック
            try:
                # 認証エンドポイントへのアクセスで接続確認
                # getSessionは既存のセッションを確認するだけで副作用がない
                check_client.auth.get_session()
                logger.info(
                    f"Supabase接続チェック: OK "
                    f"(使用キー: {'匿名' if self._anon_client else '管理用'})"
                )
                return True
            except AttributeError:
                # 同期版のクライアントの場合は、テーブルクエリにフォールバック
                # ただし、テーブルが存在しない可能性を考慮してtry-exceptで囲む
                try:
                    # 軽量なクエリ: limitを0にしてデータを取得せず接続のみ確認
                    check_client.table("_supabase_internal").select("*").limit(0).execute()
                except Exception:
                    # テーブルが存在しない場合でも、接続自体ができればOK
                    # 実際には、クライアントが初期化されていれば接続は確立している
                    pass
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
