"""
ScaffAI Backend API - メインエントリーポイント

FastAPIアプリケーションの初期化とルーター設定を行う
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv

from routers import health
from utils.middleware import RequestLoggingMiddleware
from config import (
    APP_NAME,
    APP_DESCRIPTION,
    APP_VERSION,
    CORS_MAX_AGE,
)

# 環境変数の読み込み
load_dotenv()

# ロガー設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    アプリケーションのライフサイクル管理
    起動時と終了時の処理を定義
    """
    # 起動時処理
    logger.info("ScaffAI Backend API が起動しました")
    yield
    # 終了時処理
    logger.info("ScaffAI Backend API が終了しました")


# FastAPIアプリケーションインスタンス作成
app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
)

# CORS設定（フロントエンドからのアクセスを許可）
# 環境変数からCORS許可オリジンを読み込む
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # 必要なメソッドのみ許可
    allow_headers=[
        "Content-Type",
        "Authorization",
        "apikey",  # Supabase専用
        "X-Client-Info",  # Supabase専用
    ],  # 必要最小限のヘッダーのみ許可
    max_age=CORS_MAX_AGE,  # プリフライトリクエストのキャッシュ時間
)

# カスタムミドルウェア追加
app.add_middleware(RequestLoggingMiddleware)

# ルーター登録
app.include_router(
    health.router,
    prefix="/api",
    tags=["health"]
)


# ルートエンドポイント
@app.get("/")
async def root():
    """
    APIルートエンドポイント
    APIの基本情報を返す
    """
    return {
        "message": APP_NAME,
        "version": APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn

    # 開発サーバー起動
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # ホットリロード有効
        log_level="info"
    )
