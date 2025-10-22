#!/bin/bash

# ScaffAI 開発環境セットアップスクリプト
# このスクリプトは初回セットアップ時に実行してください

set -e

echo "🚀 ScaffAI 開発環境セットアップを開始します..."
echo ""

# カレントディレクトリ確認
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ エラー: プロジェクトルートディレクトリで実行してください"
    exit 1
fi

# 環境変数ファイルのチェック
echo "📝 環境変数ファイルをチェック中..."

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local が見つかりません"
    if [ -f "frontend/.env.local.example" ]; then
        echo "📋 frontend/.env.local.example をコピーしています..."
        cp frontend/.env.local.example frontend/.env.local
        echo "✅ frontend/.env.local を作成しました"
        echo "⚠️  frontend/.env.local を編集して、実際の値を設定してください"
    fi
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env が見つかりません"
    if [ -f "backend/.env.example" ]; then
        echo "📋 backend/.env.example をコピーしています..."
        cp backend/.env.example backend/.env
        echo "✅ backend/.env を作成しました"
        echo "⚠️  backend/.env を編集して、実際の値を設定してください"
    fi
fi

echo ""
echo "📦 依存関係をインストール中..."

# フロントエンドの依存関係インストール
if [ -d "frontend" ]; then
    echo "  → フロントエンド（Next.js）"
    cd frontend
    npm install
    cd ..
    echo "  ✅ フロントエンドの依存関係をインストールしました"
fi

# バックエンドの依存関係インストール
if [ -d "backend" ]; then
    echo "  → バックエンド（FastAPI）"
    cd backend
    if [ -f "requirements.txt" ]; then
        python3 -m venv venv || true
        source venv/bin/activate || true
        pip install -r requirements.txt
        deactivate || true
    fi
    cd ..
    echo "  ✅ バックエンドの依存関係をインストールしました"
fi

echo ""
echo "🎉 セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. frontend/.env.local を編集して、Supabaseの設定を追加"
echo "2. backend/.env を編集して、Supabase と OpenAI の設定を追加"
echo "3. ./scripts/dev.sh を実行して開発サーバーを起動"
echo ""
echo "または、Docker Composeを使用する場合:"
echo "  docker-compose up"
echo ""
