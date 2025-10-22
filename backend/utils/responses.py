"""
統一されたAPIレスポンスフォーマット

全てのエンドポイントで一貫したレスポンス形式を提供
"""

from typing import Any, Optional, Dict, List
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi import status


class ErrorDetail(BaseModel):
    """
    エラー詳細情報

    Attributes:
        code: エラーコード（例: "VALIDATION_ERROR", "NOT_FOUND"）
        message: ユーザー向けエラーメッセージ
        field: エラーが発生したフィールド名（オプション）
    """
    code: str
    message: str
    field: Optional[str] = None


class SuccessResponse(BaseModel):
    """
    成功レスポンスの標準形式

    Attributes:
        success: 処理が成功したかどうか（常にTrue）
        data: レスポンスデータ
        message: 成功メッセージ（オプション）
    """
    success: bool = True
    data: Any
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """
    エラーレスポンスの標準形式

    Attributes:
        success: 処理が成功したかどうか（常にFalse）
        error: エラー詳細情報
    """
    success: bool = False
    error: ErrorDetail


class PaginatedResponse(BaseModel):
    """
    ページネーション付きレスポンス

    Attributes:
        success: 処理が成功したかどうか
        data: レスポンスデータ配列
        pagination: ページネーション情報
    """
    success: bool = True
    data: List[Any]
    pagination: Dict[str, Any]


def success_response(
    data: Any,
    message: Optional[str] = None,
    status_code: int = status.HTTP_200_OK
) -> JSONResponse:
    """
    成功レスポンスを生成

    Args:
        data: レスポンスデータ
        message: 成功メッセージ（オプション）
        status_code: HTTPステータスコード（デフォルト: 200）

    Returns:
        JSONResponse: 統一された成功レスポンス

    Example:
        >>> return success_response(data={"id": 1, "name": "Project A"})
        >>> return success_response(data=projects, message="プロジェクト一覧を取得しました")
    """
    response_data = {
        "success": True,
        "data": data
    }

    if message:
        response_data["message"] = message

    return JSONResponse(
        status_code=status_code,
        content=response_data
    )


def error_response(
    code: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    field: Optional[str] = None
) -> JSONResponse:
    """
    エラーレスポンスを生成

    Args:
        code: エラーコード
        message: エラーメッセージ
        status_code: HTTPステータスコード（デフォルト: 400）
        field: エラーが発生したフィールド名（オプション）

    Returns:
        JSONResponse: 統一されたエラーレスポンス

    Example:
        >>> return error_response(
        ...     code="VALIDATION_ERROR",
        ...     message="プロジェクト名は必須です",
        ...     field="name"
        ... )
    """
    error_detail = {
        "code": code,
        "message": message
    }

    if field:
        error_detail["field"] = field

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error_detail
        }
    )


def paginated_response(
    data: List[Any],
    total: int,
    page: int,
    page_size: int,
    status_code: int = status.HTTP_200_OK
) -> JSONResponse:
    """
    ページネーション付きレスポンスを生成

    Args:
        data: レスポンスデータ配列
        total: 総レコード数
        page: 現在のページ番号（1から始まる）
        page_size: 1ページあたりのアイテム数
        status_code: HTTPステータスコード（デフォルト: 200）

    Returns:
        JSONResponse: ページネーション情報付きレスポンス

    Example:
        >>> return paginated_response(
        ...     data=projects,
        ...     total=100,
        ...     page=1,
        ...     page_size=20
        ... )
    """
    total_pages = (total + page_size - 1) // page_size  # 切り上げ

    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "data": data,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    )


def created_response(
    data: Any,
    message: Optional[str] = None
) -> JSONResponse:
    """
    作成成功レスポンスを生成（201 Created）

    Args:
        data: 作成されたリソースのデータ
        message: 成功メッセージ（オプション）

    Returns:
        JSONResponse: 201ステータスコード付きレスポンス

    Example:
        >>> return created_response(
        ...     data=new_project,
        ...     message="プロジェクトを作成しました"
        ... )
    """
    return success_response(
        data=data,
        message=message,
        status_code=status.HTTP_201_CREATED
    )


def no_content_response() -> JSONResponse:
    """
    内容なし成功レスポンスを生成（204 No Content）

    削除や更新完了時など、レスポンスボディが不要な場合に使用

    Returns:
        JSONResponse: 204ステータスコード付き空レスポンス

    Example:
        >>> return no_content_response()
    """
    return JSONResponse(
        status_code=status.HTTP_204_NO_CONTENT,
        content=None
    )


def not_found_response(
    message: str = "リソースが見つかりません",
    resource: Optional[str] = None
) -> JSONResponse:
    """
    404 Not Foundレスポンスを生成

    Args:
        message: エラーメッセージ
        resource: 見つからなかったリソース名（オプション）

    Returns:
        JSONResponse: 404ステータスコード付きエラーレスポンス

    Example:
        >>> return not_found_response(
        ...     message="指定されたプロジェクトが見つかりません",
        ...     resource="project"
        ... )
    """
    code = f"{resource.upper()}_NOT_FOUND" if resource else "NOT_FOUND"

    return error_response(
        code=code,
        message=message,
        status_code=status.HTTP_404_NOT_FOUND
    )


def unauthorized_response(
    message: str = "認証が必要です"
) -> JSONResponse:
    """
    401 Unauthorizedレスポンスを生成

    Args:
        message: エラーメッセージ

    Returns:
        JSONResponse: 401ステータスコード付きエラーレスポンス

    Example:
        >>> return unauthorized_response(message="無効なトークンです")
    """
    return error_response(
        code="UNAUTHORIZED",
        message=message,
        status_code=status.HTTP_401_UNAUTHORIZED
    )


def forbidden_response(
    message: str = "アクセスが拒否されました"
) -> JSONResponse:
    """
    403 Forbiddenレスポンスを生成

    Args:
        message: エラーメッセージ

    Returns:
        JSONResponse: 403ステータスコード付きエラーレスポンス

    Example:
        >>> return forbidden_response(message="このプロジェクトにアクセスする権限がありません")
    """
    return error_response(
        code="FORBIDDEN",
        message=message,
        status_code=status.HTTP_403_FORBIDDEN
    )
