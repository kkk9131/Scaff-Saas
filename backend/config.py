"""
アプリケーション設定と定数管理

バージョン番号、HTTPステータスコード、タイムアウト設定などの
定数を一元管理するモジュール
"""

from typing import Final

# ===== アプリケーション情報 =====
APP_NAME: Final[str] = "ScaffAI Backend API"
APP_DESCRIPTION: Final[str] = "足場業務支援SaaSのバックエンドAPI"
APP_VERSION: Final[str] = "1.0.0"

# ===== HTTPステータスコード =====
HTTP_STATUS_OK: Final[int] = 200
HTTP_STATUS_SERVICE_UNAVAILABLE: Final[int] = 503

# ===== タイムアウト設定（秒） =====
DB_CONNECTION_TIMEOUT: Final[int] = 30

# ===== CORS設定 =====
CORS_MAX_AGE: Final[int] = 600  # プリフライトリクエストのキャッシュ時間（秒）
