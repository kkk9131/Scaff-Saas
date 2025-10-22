#!/bin/bash

# ScaffAI 開発サーバー起動スクリプト
# フロントエンドとバックエンドを同時に起動します

set -e

echo "🚀 ScaffAI 開発サーバーを起動します..."
echo ""

# カレントディレクトリ確認
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ エラー: プロジェクトルートディレクトリで実行してください"
    exit 1
fi

# 環境変数ファイルのチェック
if [ ! -f "frontend/.env.local" ]; then
    echo "❌ エラー: frontend/.env.local が見つかりません"
    echo "   ./scripts/setup.sh を先に実行してください"
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo "❌ エラー: backend/.env が見つかりません"
    echo "   ./scripts/setup.sh を先に実行してください"
    exit 1
fi

# Docker Compose使用か通常起動か選択
if command -v docker-compose &> /dev/null; then
    echo "📦 Docker Composeを使用しますか？ (y/n)"
    read -r use_docker

    if [ "$use_docker" = "y" ] || [ "$use_docker" = "Y" ]; then
        echo "🐳 Docker Composeで起動中..."
        docker-compose up
        exit 0
    fi
fi

echo "💻 ローカル環境で起動中..."
echo ""

# バックグラウンドでバックエンドを起動
echo "🔧 バックエンド（FastAPI）を起動中..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
fi
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo "✅ バックエンドを起動しました（PID: $BACKEND_PID）"
echo "   URL: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

# バックエンドの起動を待つ
sleep 3

# フロントエンドを起動（フォアグラウンド）
echo "🎨 フロントエンド（Next.js）を起動中..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ フロントエンドを起動しました（PID: $FRONTEND_PID）"
echo "   URL: http://localhost:3000"
echo ""

# 終了ハンドラ
trap 'echo ""; echo "🛑 開発サーバーを停止中..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT TERM

echo "✨ 開発サーバーが起動しました！"
echo ""
echo "  フロントエンド: http://localhost:3000"
echo "  バックエンド:   http://localhost:8000"
echo "  API Docs:       http://localhost:8000/docs"
echo ""
echo "Ctrl+C で停止します"
echo ""

# プロセスを待機
wait
