"""
ScaffAI バックエンドAPI
FastAPIベースのメインアプリケーション
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import sys

# backend/utilsディレクトリをPythonパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# 環境変数を読み込む
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    アプリケーションのライフサイクル管理
    起動時と終了時の処理を定義
    """
    # 起動時の処理
    print("🚀 ScaffAI API を起動しています...")
    print(f"📝 ドキュメント: http://localhost:8000/docs")
    yield
    # 終了時の処理
    print("👋 ScaffAI API を終了しています...")


# FastAPIアプリケーションのインスタンスを作成
app = FastAPI(
    title="ScaffAI API",
    description="足場業務支援SaaSのバックエンドAPI",
    version="1.0.0",
    docs_url="/docs",  # Swagger UIのURL
    redoc_url="/redoc",  # ReDocのURL
    lifespan=lifespan,  # ライフサイクルハンドラーを設定
)

# ミドルウェアの設定
# 注意: ミドルウェアは登録の逆順で実行されます
# 最初に実行したいミドルウェアを最後に追加してください

# 将来的に他のミドルウェアを追加する場合は、この上に追加します
# 例: app.add_middleware(AuthenticationMiddleware, ...)

# CORSミドルウェア（最後に追加することで最初に実行される）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なドメインを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """
    ルートエンドポイント
    APIの基本情報を返す
    """
    return {
        "message": "ScaffAI API へようこそ",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    """
    ヘルスチェックエンドポイント
    APIが正常に動作しているか確認する
    """
    return {
        "status": "ok",
        "message": "API は正常に動作しています",
    }


@app.get("/api/health/supabase")
async def supabase_health_check():
    """
    Supabaseヘルスチェックエンドポイント
    Supabaseへの接続が正常に動作しているか確認する

    レビュー指摘に対応:
    - HTTP REST API経由でヘルスチェックを実行
    - get_session()やinternal tableを使用しない
    """
    try:
        from utils.supabase_client import check_supabase_health

        result = await check_supabase_health()
        return result
    except ImportError:
        # Supabaseクライアントがまだ設定されていない場合
        return {
            "status": "unconfigured",
            "message": "Supabaseクライアントが設定されていません",
            "details": {
                "error": "utils/supabase_client.pyが見つかりません"
            },
        }
    except Exception as e:
        return {
            "status": "error",
            "message": "ヘルスチェック中にエラーが発生しました",
            "details": {"error": str(e)},
        }


if __name__ == "__main__":
    import uvicorn

    # 開発サーバーを起動
    # コマンドライン: python main.py
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # コード変更時に自動リロード
    )
