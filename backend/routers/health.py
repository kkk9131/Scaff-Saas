"""
ヘルスチェックエンドポイント

APIとデータベースの稼働状態を確認するエンドポイント
"""

from fastapi import APIRouter
from datetime import datetime
import sys
import logging
import traceback

from utils.responses import success_response, error_response
from utils.supabase_client import get_supabase
from config import APP_VERSION, HTTP_STATUS_SERVICE_UNAVAILABLE

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    ヘルスチェックエンドポイント

    APIサーバーとSupabaseデータベースの接続状態を確認

    Returns:
        JSONResponse: システムの稼働状態

    Example Response:
        {
            "success": true,
            "data": {
                "status": "healthy",
                "timestamp": "2025-10-22T12:00:00.000Z",
                "api": {
                    "version": "1.0.0",
                    "python_version": "3.11.5"
                },
                "database": {
                    "status": "connected",
                    "connection_test": "passed"
                }
            }
        }
    """
    # Supabase接続テスト
    supabase = get_supabase()
    db_status = "connected"
    db_test = "passed"

    try:
        # データベース接続を確認
        db_healthy = supabase.health_check()
        if not db_healthy:
            db_status = "disconnected"
            db_test = "failed"
            logger.warning("Supabaseヘルスチェックが失敗しました")
    except Exception as e:
        db_status = "error"
        db_test = f"failed: {str(e)}"
        # トレースバック付きでエラーログを記録
        logger.error(
            f"Supabaseヘルスチェック中に例外が発生しました: {str(e)}\n"
            f"トレースバック:\n{traceback.format_exc()}"
        )

    # 全体のステータスを判定
    overall_status = "healthy" if db_test == "passed" else "unhealthy"

    health_data = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "api": {
            "version": APP_VERSION,
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        },
        "database": {"status": db_status, "connection_test": db_test},
    }

    # データベース接続に失敗している場合は503エラーを返す
    if overall_status == "unhealthy":
        return error_response(
            code="SERVICE_UNAVAILABLE",
            message="データベースに接続できません",
            status_code=HTTP_STATUS_SERVICE_UNAVAILABLE,
        )

    return success_response(data=health_data)


@router.get("/health/ping")
async def ping():
    """
    簡易ヘルスチェック（Ping）

    APIサーバーが起動しているかの簡易確認

    Returns:
        JSONResponse: Pongレスポンス

    Example Response:
        {
            "success": true,
            "data": {
                "message": "pong",
                "timestamp": "2025-10-22T12:00:00.000Z"
            }
        }
    """
    return success_response(
        data={"message": "pong", "timestamp": datetime.utcnow().isoformat() + "Z"}
    )
