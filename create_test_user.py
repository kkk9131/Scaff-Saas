#!/usr/bin/env python3
"""
テストユーザー作成スクリプト

Supabase Admin API を用いてテストユーザーを作成する補助ツールです。
機密情報をベタ書きせず、環境変数から認証情報を読み込みます。
"""

import os
from typing import Final

from supabase import Client, create_client


SUPABASE_URL_ENV_NAME: Final[str] = "SUPABASE_URL"
SUPABASE_SERVICE_ROLE_ENV_NAME: Final[str] = "SUPABASE_SERVICE_ROLE_KEY"
TEST_EMAIL_ENV_NAME: Final[str] = "TEST_USER_EMAIL"
TEST_PASSWORD_ENV_NAME: Final[str] = "TEST_USER_PASSWORD"


def load_env_variable(env_name: str) -> str:
    """指定した環境変数を取得する

    環境変数が未設定の場合は ValueError を発生させ、秘匿情報の設定漏れに
    早期に気付けるようにします。
    """

    value = os.environ.get(env_name)
    if not value:
        raise ValueError(
            f"環境変数 {env_name} が未設定です。`.env.local` などに安全に設定してください。"
        )
    return value


def main() -> None:
    """テストユーザーを作成するメイン処理"""

    try:
        # Supabase 管理者クライアントを環境変数から初期化
        supabase_url = load_env_variable(SUPABASE_URL_ENV_NAME)
        service_role_key = load_env_variable(SUPABASE_SERVICE_ROLE_ENV_NAME)
        test_email = load_env_variable(TEST_EMAIL_ENV_NAME)
        test_password = load_env_variable(TEST_PASSWORD_ENV_NAME)
        supabase: Client = create_client(supabase_url, service_role_key)

        print(f"テストユーザーを作成中: {test_email}")

        # メール確認をスキップしつつテストユーザーを作成
        response = supabase.auth.admin.create_user(
            {
                "email": test_email,
                "password": test_password,
                "email_confirm": True,
            }
        )

        print("✅ テストユーザーを作成しました")
        print(f"   Email: {test_email}")
        print("   Password: （環境変数 TEST_USER_PASSWORD を参照してください）")
        print(f"   User ID: {response.user.id}")

    except Exception as error:  # noqa: BLE001
        print(f"❌ エラーが発生しました: {error}")

if __name__ == "__main__":
    main()
