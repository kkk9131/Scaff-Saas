"""
Stripe クライアント初期化モジュール

Stripe APIとの連携を管理するユーティリティ。
環境変数からStripe Secret Keyを読み取り、Stripeクライアントを初期化します。
"""

import os
import stripe
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

# Stripe Secret Keyを設定
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Stripeプライス設定を環境変数から取得
STRIPE_PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO")
STRIPE_PRICE_ID_ENTERPRISE = os.getenv("STRIPE_PRICE_ID_ENTERPRISE")


def get_stripe_client():
    """
    Stripeクライアントインスタンスを取得

    戻り値:
        stripe: 設定済みのStripeクライアントモジュール
    """
    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEYが環境変数に設定されていません")
    return stripe


def create_customer(email: str, name: str = None, metadata: dict = None) -> stripe.Customer:
    """
    新しいStripe Customerを作成

    引数:
        email: 顧客のメールアドレス
        name: 顧客名（オプション）
        metadata: カスタムメタデータ（オプション）

    戻り値:
        作成されたStripe Customerオブジェクト
    """
    stripe_client = get_stripe_client()

    customer_data = {"email": email}
    if name:
        customer_data["name"] = name
    if metadata:
        customer_data["metadata"] = metadata

    customer = stripe_client.Customer.create(**customer_data)
    return customer


def create_checkout_session(
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    metadata: dict = None
) -> stripe.checkout.Session:
    """
    Stripe Checkout Sessionを作成（サブスクリプション支払い）

    引数:
        customer_id: Stripe Customer ID
        price_id: Stripe Price ID
        success_url: 支払い成功時のリダイレクトURL
        cancel_url: 支払いキャンセル時のリダイレクトURL
        metadata: カスタムメタデータ（オプション）

    戻り値:
        作成されたCheckout Sessionオブジェクト
    """
    stripe_client = get_stripe_client()

    session_data = {
        "customer": customer_id,
        "payment_method_types": ["card"],
        "line_items": [
            {
                "price": price_id,
                "quantity": 1,
            }
        ],
        "mode": "subscription",
        "success_url": success_url,
        "cancel_url": cancel_url,
    }

    if metadata:
        session_data["metadata"] = metadata

    session = stripe_client.checkout.Session.create(**session_data)
    return session


def get_subscription(subscription_id: str) -> stripe.Subscription:
    """
    Stripe Subscriptionの詳細を取得

    引数:
        subscription_id: Stripe Subscription ID

    戻り値:
        Subscriptionオブジェクト
    """
    stripe_client = get_stripe_client()
    subscription = stripe_client.Subscription.retrieve(subscription_id)
    return subscription


def cancel_subscription(subscription_id: str, at_period_end: bool = True) -> stripe.Subscription:
    """
    Stripe Subscriptionをキャンセル

    引数:
        subscription_id: Stripe Subscription ID
        at_period_end: True=期間終了時にキャンセル、False=即座にキャンセル

    戻り値:
        更新されたSubscriptionオブジェクト
    """
    stripe_client = get_stripe_client()

    if at_period_end:
        subscription = stripe_client.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True
        )
    else:
        subscription = stripe_client.Subscription.delete(subscription_id)

    return subscription


def construct_webhook_event(payload: bytes, sig_header: str, webhook_secret: str):
    """
    Stripe Webhookイベントを検証して構築

    引数:
        payload: Webhookリクエストのボディ（bytes）
        sig_header: Stripe-Signatureヘッダー値
        webhook_secret: Stripe Webhook Secret

    戻り値:
        検証されたStripe Eventオブジェクト

    例外:
        ValueError: 署名検証失敗時
        stripe.error.SignatureVerificationError: 署名検証エラー
    """
    stripe_client = get_stripe_client()

    try:
        event = stripe_client.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        return event
    except ValueError as e:
        # Invalid payload
        raise ValueError(f"Invalid Webhook payload: {str(e)}")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise stripe.error.SignatureVerificationError(
            f"Webhook signature verification failed: {str(e)}"
        )


def get_price_id_by_plan_name(plan_name: str) -> str:
    """
    プラン名からStripe Price IDを取得

    引数:
        plan_name: プラン名（"プロプラン" or "エンタープライズプラン"）

    戻り値:
        対応するStripe Price ID

    例外:
        ValueError: サポートされていないプラン名の場合
    """
    if plan_name == "プロプラン":
        if not STRIPE_PRICE_ID_PRO:
            raise ValueError("STRIPE_PRICE_ID_PROが環境変数に設定されていません")
        return STRIPE_PRICE_ID_PRO
    elif plan_name == "エンタープライズプラン":
        if not STRIPE_PRICE_ID_ENTERPRISE:
            raise ValueError("STRIPE_PRICE_ID_ENTERPRISEが環境変数に設定されていません")
        return STRIPE_PRICE_ID_ENTERPRISE
    else:
        raise ValueError(f"サポートされていないプラン名: {plan_name}")
