"""
ヘルスチェックエンドポイントのテスト
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """
    ルートエンドポイントのテスト
    API情報が正しく返されることを確認
    """
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert "message" in data
    assert "version" in data
    assert data["version"] == "1.0.0"


def test_health_ping():
    """
    Pingエンドポイントのテスト
    Pongレスポンスが返されることを確認
    """
    response = client.get("/api/health/ping")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["message"] == "pong"
    assert "timestamp" in data["data"]


def test_health_check():
    """
    ヘルスチェックエンドポイントのテスト
    APIとデータベースの状態が返されることを確認
    """
    response = client.get("/api/health")

    # ステータスコードは200または503のいずれか
    assert response.status_code in [200, 503]

    data = response.json()
    assert "success" in data

    if data["success"]:
        # 成功時のレスポンス構造を確認
        assert "data" in data
        assert "status" in data["data"]
        assert "api" in data["data"]
        assert "database" in data["data"]
        assert "version" in data["data"]["api"]
        assert "python_version" in data["data"]["api"]
    else:
        # エラー時のレスポンス構造を確認
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]


def test_health_response_format():
    """
    ヘルスチェックレスポンスフォーマットのテスト
    統一されたレスポンス形式に従っているか確認
    """
    response = client.get("/api/health/ping")
    data = response.json()

    # 必須フィールドが存在するか確認
    assert "success" in data
    assert isinstance(data["success"], bool)
    assert "data" in data
