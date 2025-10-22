"""
カスタムミドルウェア

リクエストログ、認証、エラーハンドリングなどのミドルウェアを提供
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    リクエストログミドルウェア

    全てのHTTPリクエストとレスポンスをログに記録
    - リクエストメソッド、パス
    - レスポンスステータスコード
    - 処理時間
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        """
        リクエスト処理の前後でログを記録

        Args:
            request: HTTPリクエスト
            call_next: 次のミドルウェア/ハンドラー

        Returns:
            HTTPレスポンス
        """
        # リクエスト開始時刻を記録
        start_time = time.time()

        # クライアントIPアドレスを取得
        client_host = request.client.host if request.client else "unknown"

        # リクエスト情報をログ出力
        logger.info(
            f"リクエスト開始: {request.method} {request.url.path} "
            f"from {client_host}"
        )

        # 次のハンドラーを実行
        response = await call_next(request)

        # 処理時間を計算
        process_time = time.time() - start_time

        # レスポンス情報をログ出力
        logger.info(
            f"リクエスト完了: {request.method} {request.url.path} "
            f"[{response.status_code}] {process_time:.3f}秒"
        )

        # カスタムヘッダーに処理時間を追加
        response.headers["X-Process-Time"] = str(process_time)

        return response


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    認証ミドルウェア（将来の実装用）

    JWTトークンの検証を行い、認証が必要なエンドポイントへのアクセスを制御
    現在は基本構造のみ実装
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        """
        認証チェック（現在は未実装）

        Args:
            request: HTTPリクエスト
            call_next: 次のミドルウェア/ハンドラー

        Returns:
            HTTPレスポンス
        """
        # 認証不要なパスのリスト
        public_paths = [
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/health",
        ]

        # 認証不要なパスの場合はスキップ
        if request.url.path in public_paths or request.url.path.startswith("/docs"):
            return await call_next(request)

        # TODO: ここにJWT認証ロジックを実装
        # 1. Authorizationヘッダーからトークンを取得
        # 2. Supabase AuthでトークンをDecode
        # 3. 無効な場合は401エラーを返す

        # 現在は全て許可
        response = await call_next(request)
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    エラーハンドリングミドルウェア

    予期しないエラーをキャッチし、統一されたエラーレスポンスを返す
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        """
        エラーハンドリング

        Args:
            request: HTTPリクエスト
            call_next: 次のミドルウェア/ハンドラー

        Returns:
            HTTPレスポンス
        """
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # エラーログを出力
            logger.error(
                f"予期しないエラー: {request.method} {request.url.path} - {str(e)}",
                exc_info=True
            )

            # クライアントには詳細を隠して500エラーを返す
            from fastapi.responses import JSONResponse

            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "サーバーエラーが発生しました。管理者にお問い合わせください。"
                    }
                }
            )
