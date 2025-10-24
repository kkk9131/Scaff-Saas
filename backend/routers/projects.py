"""
プロジェクトルーター

プロジェクト管理のAPIエンドポイントを提供
"""

from fastapi import APIRouter, Depends, Query, Path, HTTPException
from typing import Optional, Dict, Any
import logging

from models.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectListResponse,
    ProjectDuplicateRequest,
    ProjectStatus
)
from services.project_service import ProjectService
from utils.responses import success_response, error_response
from utils.middleware import get_current_user
from config import HTTP_STATUS_NOT_FOUND, HTTP_STATUS_BAD_REQUEST

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/projects", response_model=Dict[str, Any])
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    新規プロジェクトを作成

    Args:
        project_data: プロジェクト作成データ
        current_user: 認証済みユーザー情報

    Returns:
        作成されたプロジェクト

    Example Request:
        POST /api/projects
        {
            "name": "新規足場プロジェクト",
            "description": "3階建てビルの足場設計",
            "customer_name": "山田建設",
            "site_address": "東京都渋谷区〇〇1-2-3",
            "start_date": "2025-11-01",
            "end_date": "2025-12-31",
            "user_id": "user-uuid-here"
        }

    Example Response:
        {
            "success": true,
            "data": {
                "id": "project-uuid",
                "name": "新規足場プロジェクト",
                "status": "draft",
                "created_at": "2025-10-24T12:00:00Z",
                ...
            }
        }
    """
    try:
        # ユーザーIDを上書き（セキュリティ対策）
        project_data.user_id = current_user["id"]

        service = ProjectService()
        project = await service.create_project(project_data)

        return success_response(
            data=project.model_dump(),
            message="プロジェクトを作成しました"
        )

    except ValueError as e:
        return error_response(
            code="VALIDATION_ERROR",
            message=str(e),
            status_code=HTTP_STATUS_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"プロジェクト作成エラー: {str(e)}")
        return error_response(
            code="CREATE_ERROR",
            message="プロジェクトの作成に失敗しました"
        )


@router.get("/projects", response_model=Dict[str, Any])
async def list_projects(
    page: int = Query(1, ge=1, description="ページ番号（1から開始）"),
    page_size: int = Query(20, ge=1, le=100, description="1ページあたりのアイテム数"),
    status: Optional[ProjectStatus] = Query(None, description="ステータスフィルター"),
    current_user: dict = Depends(get_current_user)
):
    """
    プロジェクト一覧を取得

    Args:
        page: ページ番号
        page_size: 1ページあたりのアイテム数
        status: ステータスフィルター（オプション）
        current_user: 認証済みユーザー情報

    Returns:
        プロジェクト一覧

    Example Request:
        GET /api/projects?page=1&page_size=20&status=active

    Example Response:
        {
            "success": true,
            "data": {
                "projects": [
                    {
                        "id": "project-uuid-1",
                        "name": "プロジェクト1",
                        ...
                    },
                    ...
                ],
                "total": 45,
                "page": 1,
                "page_size": 20
            }
        }
    """
    try:
        service = ProjectService()
        result = await service.list_projects(
            user_id=current_user["id"],
            page=page,
            page_size=page_size,
            status=status
        )

        # Projectオブジェクトを辞書に変換
        result["projects"] = [p.model_dump() for p in result["projects"]]

        return success_response(data=result)

    except Exception as e:
        logger.error(f"プロジェクト一覧取得エラー: {str(e)}")
        return error_response(
            code="LIST_ERROR",
            message="プロジェクト一覧の取得に失敗しました"
        )


@router.get("/projects/{project_id}", response_model=Dict[str, Any])
async def get_project(
    project_id: str = Path(..., description="プロジェクトID"),
    current_user: dict = Depends(get_current_user)
):
    """
    プロジェクト詳細を取得

    Args:
        project_id: プロジェクトID
        current_user: 認証済みユーザー情報

    Returns:
        プロジェクト詳細

    Example Request:
        GET /api/projects/{project_id}

    Example Response:
        {
            "success": true,
            "data": {
                "id": "project-uuid",
                "name": "プロジェクト名",
                "status": "active",
                ...
            }
        }
    """
    try:
        service = ProjectService()
        project = await service.get_project(
            project_id=project_id,
            user_id=current_user["id"]
        )

        if not project:
            return error_response(
                code="NOT_FOUND",
                message="プロジェクトが見つかりません",
                status_code=HTTP_STATUS_NOT_FOUND
            )

        return success_response(data=project.model_dump())

    except Exception as e:
        logger.error(f"プロジェクト取得エラー: {str(e)}")
        return error_response(
            code="GET_ERROR",
            message="プロジェクトの取得に失敗しました"
        )


@router.put("/projects/{project_id}", response_model=Dict[str, Any])
async def update_project(
    project_data: ProjectUpdate,
    project_id: str = Path(..., description="プロジェクトID"),
    current_user: dict = Depends(get_current_user)
):
    """
    プロジェクトを更新

    Args:
        project_id: プロジェクトID
        project_data: 更新データ
        current_user: 認証済みユーザー情報

    Returns:
        更新されたプロジェクト

    Example Request:
        PUT /api/projects/{project_id}
        {
            "name": "更新後のプロジェクト名",
            "status": "active",
            "description": "更新された説明"
        }

    Example Response:
        {
            "success": true,
            "data": {
                "id": "project-uuid",
                "name": "更新後のプロジェクト名",
                ...
            },
            "message": "プロジェクトを更新しました"
        }
    """
    try:
        service = ProjectService()
        project = await service.update_project(
            project_id=project_id,
            user_id=current_user["id"],
            project_data=project_data
        )

        if not project:
            return error_response(
                code="NOT_FOUND",
                message="プロジェクトが見つかりません",
                status_code=HTTP_STATUS_NOT_FOUND
            )

        return success_response(
            data=project.model_dump(),
            message="プロジェクトを更新しました"
        )

    except ValueError as e:
        return error_response(
            code="VALIDATION_ERROR",
            message=str(e),
            status_code=HTTP_STATUS_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"プロジェクト更新エラー: {str(e)}")
        return error_response(
            code="UPDATE_ERROR",
            message="プロジェクトの更新に失敗しました"
        )


@router.delete("/projects/{project_id}", response_model=Dict[str, Any])
async def delete_project(
    project_id: str = Path(..., description="プロジェクトID"),
    current_user: dict = Depends(get_current_user)
):
    """
    プロジェクトを削除

    Args:
        project_id: プロジェクトID
        current_user: 認証済みユーザー情報

    Returns:
        削除成功メッセージ

    Example Request:
        DELETE /api/projects/{project_id}

    Example Response:
        {
            "success": true,
            "message": "プロジェクトを削除しました"
        }
    """
    try:
        service = ProjectService()
        success = await service.delete_project(
            project_id=project_id,
            user_id=current_user["id"]
        )

        if not success:
            return error_response(
                code="NOT_FOUND",
                message="プロジェクトが見つかりません",
                status_code=HTTP_STATUS_NOT_FOUND
            )

        return success_response(message="プロジェクトを削除しました")

    except Exception as e:
        logger.error(f"プロジェクト削除エラー: {str(e)}")
        return error_response(
            code="DELETE_ERROR",
            message="プロジェクトの削除に失敗しました"
        )


@router.post("/projects/{project_id}/duplicate", response_model=Dict[str, Any])
async def duplicate_project(
    duplicate_request: ProjectDuplicateRequest,
    project_id: str = Path(..., description="複製元プロジェクトID"),
    current_user: dict = Depends(get_current_user)
):
    """
    プロジェクトを複製

    Args:
        project_id: 複製元プロジェクトID
        duplicate_request: 複製設定（新しい名前など）
        current_user: 認証済みユーザー情報

    Returns:
        複製されたプロジェクト

    Example Request:
        POST /api/projects/{project_id}/duplicate
        {
            "new_name": "プロジェクトのコピー"
        }

    Example Response:
        {
            "success": true,
            "data": {
                "id": "new-project-uuid",
                "name": "プロジェクトのコピー",
                "status": "draft",
                ...
            },
            "message": "プロジェクトを複製しました"
        }
    """
    try:
        service = ProjectService()
        duplicated = await service.duplicate_project(
            project_id=project_id,
            user_id=current_user["id"],
            new_name=duplicate_request.new_name
        )

        if not duplicated:
            return error_response(
                code="NOT_FOUND",
                message="複製元のプロジェクトが見つかりません",
                status_code=HTTP_STATUS_NOT_FOUND
            )

        return success_response(
            data=duplicated.model_dump(),
            message="プロジェクトを複製しました"
        )

    except Exception as e:
        logger.error(f"プロジェクト複製エラー: {str(e)}")
        return error_response(
            code="DUPLICATE_ERROR",
            message="プロジェクトの複製に失敗しました"
        )
