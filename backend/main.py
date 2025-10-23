"""
ScaffAI Backend API - メインエントリーポイント

FastAPIアプリケーションの初期化とルーター設定を行う
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from routers import health
from utils.middleware import RequestLoggingMiddleware

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
    title="ScaffAI Backend API",
    description="足場業務支援SaaSのバックエンドAPI",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
)

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js開発サーバー
        "http://localhost:3001",
        "https://scaffai.vercel.app",  # 本番環境（後で設定）
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # 必要なメソッドのみ許可
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Requested-With",
    ],  # 必要なヘッダーのみ許可
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
        "message": "ScaffAI Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
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
