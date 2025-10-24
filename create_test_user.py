#!/usr/bin/env python3
"""
テストユーザー作成スクリプト

Supabase Admin APIを使用してテストユーザーを作成します。
"""

import os
from supabase import create_client, Client

# 環境変数から認証情報を取得
SUPABASE_URL = "https://jbcltijeibwrblgoymwf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiY2x0aWplaWJ3cmJsZ295bXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTExMzc0MSwiZXhwIjoyMDc2Njg5NzQxfQ.BrJZZfSci-j1PFOk_HHZnJ1W--x29iwXS2xKDBmaxO4"

# テストユーザーの認証情報
TEST_EMAIL = "playwright-test@example.com"
TEST_PASSWORD = "TestPassword123!"

def main():
    """テストユーザーを作成"""
    try:
        # Supabase管理者クライアントを作成
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        print(f"テストユーザーを作成中: {TEST_EMAIL}")

        # ユーザーを作成
        response = supabase.auth.admin.create_user({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "email_confirm": True  # メール確認をスキップ
        })

        print(f"✅ テストユーザーを作成しました")
        print(f"   Email: {TEST_EMAIL}")
        print(f"   Password: {TEST_PASSWORD}")
        print(f"   User ID: {response.user.id}")

    except Exception as e:
        print(f"❌ エラーが発生しました: {str(e)}")

if __name__ == "__main__":
    main()
