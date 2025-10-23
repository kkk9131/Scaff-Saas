"""
Supabaseクライアントユーティリティ

このモジュールは、FastAPIバックエンドでSupabaseを使用するための
クライアントとヘルスチェック機能を提供します。
"""

import os
from typing import Optional, Dict, Any
import httpx
from supabase import create_client, Client


class SupabaseConfig:
    """Supabase設定クラス"""

    def __init__(self):
        """環境変数からSupabase設定を読み込む"""
        self.url = os.getenv("SUPABASE_URL")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.url or not self.anon_key:
            raise ValueError(
                "SUPABASE_URLとSUPABASE_ANON_KEYの環境変数が必要です"
            )

    @property
    def rest_url(self) -> str:
        """Supabase REST APIのURLを返す"""
        return f"{self.url}/rest/v1"


# グローバル設定インスタンス
_config: Optional[SupabaseConfig] = None


def get_config() -> SupabaseConfig:
    """
    Supabase設定を取得（シングルトン）

    Returns:
        SupabaseConfig: Supabase設定インスタンス
    """
    global _config
    if _config is None:
        _config = SupabaseConfig()
    return _config


def get_supabase_client() -> Client:
    """
    Supabaseクライアントを取得

    Returns:
        Client: Supabaseクライアントインスタンス
    """
    config = get_config()
    return create_client(config.url, config.anon_key)


def get_admin_client() -> Client:
    """
    管理者権限のSupabaseクライアントを取得

    Returns:
        Client: サービスロールキーを使用したSupabaseクライアント

    Raises:
        ValueError: サービスロールキーが設定されていない場合
    """
    config = get_config()
    if not config.service_role_key:
        raise ValueError(
            "SUPABASE_SERVICE_ROLE_KEYの環境変数が設定されていません"
        )
    return create_client(config.url, config.service_role_key)


async def check_supabase_health() -> Dict[str, Any]:
    """
    Supabaseのヘルスチェックを実行

    レビュー指摘に対応:
    - get_session()はサーバーサイドで常に空を返すため使用しない
    - _supabase_internalテーブルは存在しない可能性があるため使用しない
    - HTTP経由でSupabase REST APIに直接リクエストする方法に変更

    Returns:
        Dict[str, Any]: ヘルスチェック結果
            - status: "healthy" または "unhealthy"
            - message: ステータスメッセージ
            - details: 詳細情報（エラー時のみ）
    """
    config = get_config()

    try:
        # HTTP経由でSupabase REST APIにヘルスチェックリクエストを送信
        async with httpx.AsyncClient() as client:
            # REST APIのルートエンドポイントにアクセス
            # これはSupabaseが稼働していれば必ず応答する
            response = await client.get(
                config.rest_url,
                headers={
                    "apikey": config.anon_key,
                    "Authorization": f"Bearer {config.anon_key}",
                },
                timeout=5.0,  # 5秒でタイムアウト
            )

            # ステータスコードが200番台または400番台であればSupabaseは稼働している
            # (400番台はテーブルが存在しない等のエラーだが、APIは応答している)
            if response.status_code < 500:
                return {
                    "status": "healthy",
                    "message": "Supabaseに正常に接続できました",
                    "api_status_code": response.status_code,
                }
            else:
                return {
                    "status": "unhealthy",
                    "message": "SupabaseのREST APIがエラーを返しました",
                    "details": {
                        "status_code": response.status_code,
                        "error": response.text,
                    },
                }

    except httpx.TimeoutException:
        return {
            "status": "unhealthy",
            "message": "Supabase接続がタイムアウトしました",
            "details": {"error": "接続タイムアウト（5秒）"},
        }
    except httpx.RequestError as e:
        return {
            "status": "unhealthy",
            "message": "Supabaseへの接続に失敗しました",
            "details": {"error": str(e)},
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": "予期しないエラーが発生しました",
            "details": {"error": str(e)},
        }


async def verify_user_token(token: str) -> Optional[Dict[str, Any]]:
    """
    ユーザートークンを検証

    Args:
        token: JWTトークン

    Returns:
        Optional[Dict[str, Any]]: ユーザー情報（検証成功時）またはNone（検証失敗時）
    """
    try:
        client = get_supabase_client()
        # トークンを使用してユーザー情報を取得
        user = client.auth.get_user(token)
        return user.user.model_dump() if user.user else None
    except Exception:
        return None
