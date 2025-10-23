"""
サブスクリプション管理APIルーター

サブスクリプションプラン管理、ユーザーのサブスクリプション状態管理、
Stripeとの連携処理を提供するAPIエンドポイント。
"""

from fastapi import APIRouter, HTTPException, Header, Request, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

from utils.supabase_client import get_supabase_client
from utils.stripe_client import (
    get_stripe_client,
    create_customer,
    create_checkout_session,
    get_subscription,
    cancel_subscription,
    construct_webhook_event,
    get_price_id_by_plan_name,
)
from utils.middleware import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])

# ========================================
# Pydanticモデル定義
# ========================================


class SubscriptionPlanResponse(BaseModel):
    """サブスクリプションプラン情報レスポンス"""

    id: str
    name: str
    description: Optional[str] = None
    monthly_price: float
    currency: str
    max_projects: Optional[int] = None
    max_drawings_per_project: Optional[int] = None
    max_storage_mb: Optional[int] = None
    ai_chat_enabled: bool
    advanced_drawing_enabled: bool
    export_dxf_enabled: bool
    export_pdf_enabled: bool
    ocr_analysis_enabled: bool
    display_order: int


class UserSubscriptionResponse(BaseModel):
    """ユーザーサブスクリプション情報レスポンス"""

    id: str
    user_id: str
    plan_id: str
    plan_name: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None


class CreateCheckoutSessionRequest(BaseModel):
    """Checkout Session作成リクエスト"""

    plan_id: str = Field(..., description="サブスクリプションプランID")
    success_url: str = Field(..., description="支払い成功時のリダイレクトURL")
    cancel_url: str = Field(..., description="支払いキャンセル時のリダイレクトURL")


class CreateCheckoutSessionResponse(BaseModel):
    """Checkout Session作成レスポンス"""

    session_id: str = Field(..., description="Stripe Checkout Session ID")
    url: str = Field(..., description="Stripe Checkout URL")


class CancelSubscriptionRequest(BaseModel):
    """サブスクリプションキャンセルリクエスト"""

    immediately: bool = Field(
        default=False, description="即座にキャンセルするか（False=期間終了時にキャンセル）"
    )


# ========================================
# APIエンドポイント
# ========================================


@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans():
    """
    全サブスクリプションプラン一覧を取得

    アクティブなプランのみを表示順に返します。
    """
    try:
        supabase = get_supabase_client()

        # アクティブなプランを表示順に取得
        response = (
            supabase.table("subscription_plans")
            .select("*")
            .eq("is_active", True)
            .order("display_order")
            .execute()
        )

        plans = response.data
        return plans

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"プラン一覧取得エラー: {str(e)}")


@router.get("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_subscription_plan(plan_id: str):
    """
    特定のサブスクリプションプラン詳細を取得

    引数:
        plan_id: サブスクリプションプランID
    """
    try:
        supabase = get_supabase_client()

        response = (
            supabase.table("subscription_plans")
            .select("*")
            .eq("id", plan_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="プランが見つかりません")

        return response.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"プラン取得エラー: {str(e)}")


@router.get("/my-subscription", response_model=Optional[UserSubscriptionResponse])
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """
    現在のユーザーのサブスクリプション状態を取得

    認証が必要なエンドポイント。
    """
    try:
        user_id = current_user["id"]
        supabase = get_supabase_client()

        # ユーザーのアクティブなサブスクリプションを取得
        response = (
            supabase.table("user_subscriptions")
            .select("*, subscription_plans(name)")
            .eq("user_id", user_id)
            .eq("status", "active")
            .single()
            .execute()
        )

        if not response.data:
            return None

        subscription_data = response.data
        subscription_data["plan_name"] = subscription_data["subscription_plans"]["name"]

        return subscription_data

    except Exception as e:
        # サブスクリプションが存在しない場合はNoneを返す
        if "not found" in str(e).lower() or "no rows" in str(e).lower():
            return None
        raise HTTPException(
            status_code=500, detail=f"サブスクリプション取得エラー: {str(e)}"
        )


@router.post(
    "/create-checkout-session", response_model=CreateCheckoutSessionResponse
)
async def create_subscription_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Stripe Checkout Sessionを作成してサブスクリプション支払いを開始

    引数:
        request: Checkout Session作成リクエスト
        current_user: 認証済みユーザー情報

    戻り値:
        Checkout Session IDとURL
    """
    try:
        user_id = current_user["id"]
        user_email = current_user["email"]
        supabase = get_supabase_client()

        # プラン情報を取得
        plan_response = (
            supabase.table("subscription_plans")
            .select("*")
            .eq("id", request.plan_id)
            .single()
            .execute()
        )

        if not plan_response.data:
            raise HTTPException(status_code=404, detail="プランが見つかりません")

        plan = plan_response.data

        # 無料プランの場合はStripe不要
        if not plan["stripe_price_id"]:
            raise HTTPException(
                status_code=400, detail="無料プランはCheckout Session不要です"
            )

        # 既存のStripe Customerを確認
        existing_subscription = (
            supabase.table("user_subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if (
            existing_subscription.data
            and existing_subscription.data[0].get("stripe_customer_id")
        ):
            stripe_customer_id = existing_subscription.data[0]["stripe_customer_id"]
        else:
            # 新規Stripe Customer作成
            customer = create_customer(
                email=user_email,
                name=current_user.get("name"),
                metadata={"user_id": user_id},
            )
            stripe_customer_id = customer.id

        # Stripe Checkout Session作成
        session = create_checkout_session(
            customer_id=stripe_customer_id,
            price_id=plan["stripe_price_id"],
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={"user_id": user_id, "plan_id": request.plan_id},
        )

        return CreateCheckoutSessionResponse(session_id=session.id, url=session.url)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Checkout Session作成エラー: {str(e)}"
        )


@router.post("/cancel")
async def cancel_my_subscription(
    request: CancelSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    現在のユーザーのサブスクリプションをキャンセル

    引数:
        request: キャンセルリクエスト
        current_user: 認証済みユーザー情報
    """
    try:
        user_id = current_user["id"]
        supabase = get_supabase_client()

        # ユーザーのアクティブなサブスクリプションを取得
        subscription_response = (
            supabase.table("user_subscriptions")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
            .single()
            .execute()
        )

        if not subscription_response.data:
            raise HTTPException(
                status_code=404, detail="アクティブなサブスクリプションが見つかりません"
            )

        subscription = subscription_response.data

        # Stripe Subscriptionをキャンセル
        if subscription.get("stripe_subscription_id"):
            stripe_subscription = cancel_subscription(
                subscription["stripe_subscription_id"],
                at_period_end=not request.immediately,
            )

            # データベース更新
            update_data = {
                "cancel_at_period_end": not request.immediately,
                "canceled_at": datetime.utcnow().isoformat(),
            }

            if request.immediately:
                update_data["status"] = "canceled"

            supabase.table("user_subscriptions").update(update_data).eq(
                "id", subscription["id"]
            ).execute()

        return {"message": "サブスクリプションをキャンセルしました"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"サブスクリプションキャンセルエラー: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe Webhookイベントを受信して処理

    Stripeからのサブスクリプション状態変更イベントを処理し、
    データベースを更新します。

    対応イベント:
    - checkout.session.completed: 新規サブスクリプション作成
    - customer.subscription.updated: サブスクリプション更新
    - customer.subscription.deleted: サブスクリプション削除
    - invoice.payment_failed: 支払い失敗
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        raise HTTPException(
            status_code=500, detail="STRIPE_WEBHOOK_SECRETが設定されていません"
        )

    try:
        # Webhookイベントを検証
        event = construct_webhook_event(payload, sig_header, webhook_secret)

        supabase = get_supabase_client()

        # イベントタイプごとに処理
        if event["type"] == "checkout.session.completed":
            # 新規サブスクリプション作成
            session = event["data"]["object"]
            user_id = session["metadata"].get("user_id")
            plan_id = session["metadata"].get("plan_id")

            if user_id and plan_id:
                subscription_data = {
                    "user_id": user_id,
                    "plan_id": plan_id,
                    "stripe_customer_id": session.get("customer"),
                    "stripe_subscription_id": session.get("subscription"),
                    "status": "active",
                }

                supabase.table("user_subscriptions").insert(
                    subscription_data
                ).execute()

        elif event["type"] == "customer.subscription.updated":
            # サブスクリプション更新
            subscription = event["data"]["object"]
            stripe_subscription_id = subscription["id"]

            update_data = {
                "status": subscription["status"],
                "current_period_start": datetime.fromtimestamp(
                    subscription["current_period_start"]
                ).isoformat(),
                "current_period_end": datetime.fromtimestamp(
                    subscription["current_period_end"]
                ).isoformat(),
                "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            }

            supabase.table("user_subscriptions").update(update_data).eq(
                "stripe_subscription_id", stripe_subscription_id
            ).execute()

        elif event["type"] == "customer.subscription.deleted":
            # サブスクリプション削除
            subscription = event["data"]["object"]
            stripe_subscription_id = subscription["id"]

            supabase.table("user_subscriptions").update(
                {"status": "canceled", "canceled_at": datetime.utcnow().isoformat()}
            ).eq("stripe_subscription_id", stripe_subscription_id).execute()

        elif event["type"] == "invoice.payment_failed":
            # 支払い失敗
            invoice = event["data"]["object"]
            stripe_subscription_id = invoice.get("subscription")

            if stripe_subscription_id:
                supabase.table("user_subscriptions").update(
                    {"status": "past_due"}
                ).eq("stripe_subscription_id", stripe_subscription_id).execute()

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook処理エラー: {str(e)}")
