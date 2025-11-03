"""
作図データ（Konva/足場設計JSON）保存・読込API

エンドポイント概要:
- GET /api/drawings/{project_id}: 指定プロジェクトの最新作図JSONを取得
- POST /api/drawings: 作図JSONを保存（バージョン履歴として新規行を作成）

実装方針:
- DBテーブルは `scaffold_designs` を使用し、列 `project_id`, `design_json` を主に操作
- バージョン管理は行履歴（created_at降順）で表現。最新=復元対象
- RLSにより、ユーザーは自分のプロジェクト配下のデータのみアクセス可能

注意:
- 本APIはフロントエンドの自動保存フック（useDrawingSave）から呼び出されることを想定
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from utils.supabase_client import get_supabase_client


logger = logging.getLogger(__name__)

# ルーター定義
router = APIRouter(prefix="/api", tags=["drawings"])


class DrawingSaveRequest(BaseModel):
    """作図保存リクエスト

    フロントエンドのエクスポートJSON（storeベースの構造）を `design_json` として保存する。
    """

    project_id: str = Field(..., description="プロジェクトID（UUID）")
    design_json: Dict[str, Any] = Field(..., description="作図データ（Konva相当/StoreエクスポートJSON）")
    # 将来的な拡張用（OCR/建物データと紐付け）
    building_data_id: Optional[str] = Field(None, description="建物データID（任意）")


class DrawingResponse(BaseModel):
    """作図レスポンスモデル

    DBから取得した作図データの返却用
    """

    id: str
    project_id: str
    design_json: Dict[str, Any]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.get("/drawings/{project_id}", response_model=DrawingResponse)
def get_latest_drawing(project_id: str) -> DrawingResponse:
    """
    指定プロジェクトの最新作図JSONを取得する

    - created_at の降順で1件取得
    - データが無い場合は 404 を返す
    """
    try:
        supabase = get_supabase_client()
        resp = (
            supabase.table("scaffold_designs")
            .select("id, project_id, design_json, created_at, updated_at")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if not resp.data:
            raise HTTPException(status_code=404, detail="作図データが存在しません")

        row = resp.data[0]
        return DrawingResponse(**row)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("作図データ取得時にエラーが発生しました")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/drawings", response_model=DrawingResponse)
def save_drawing(payload: DrawingSaveRequest) -> DrawingResponse:
    """
    作図JSONを保存する（新規行として挿入）

    - 自動保存/手動保存どちらも本APIを利用する想定
    - バージョンは created_at により履歴管理（必要に応じて別テーブル/列で拡張）
    """
    try:
        supabase = get_supabase_client()

        data = {
            "project_id": payload.project_id,
            "design_json": payload.design_json,
            # building_data_id が指定されていれば保存
            **({"building_data_id": payload.building_data_id} if payload.building_data_id else {}),
            # 任意でDXFなどを追加したい場合は別エンドポイントで処理
        }

        resp = supabase.table("scaffold_designs").insert(data).execute()

        if not resp.data:
            raise HTTPException(status_code=500, detail="作図データの保存に失敗しました")

        row = resp.data[0]
        # Supabaseが返す created_at/updated_at が無い場合は暫定で現在時刻を付与
        row.setdefault("created_at", datetime.utcnow().isoformat())
        row.setdefault("updated_at", row["created_at"])  # 初回は同値
        return DrawingResponse(**row)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("作図データ保存時にエラーが発生しました")
        raise HTTPException(status_code=500, detail=str(e))

