import json
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.clerk import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.db import get_db
from app.models.enums import PaymentStatus, TaskStatus
from app.models.task import Task
from app.schemas.payment import (
    CheckoutRequest,
    CheckoutResponse,
    PaymentOut,
    VerifyRequest,
)
from app.services import payment_service, razorpay_client, task_service
from app.services.user_service import upsert_user_from_principal

router = APIRouter(tags=["payments"])


def _task_or_404(db: Session, task_id: uuid.UUID) -> Task:
    task = task_service.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post("/payments/checkout", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> CheckoutResponse:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, payload.task_id)

    if task.poster_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your task")
    if task.status != TaskStatus.assigned or task.agreed_amount is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task must be assigned with an agreed amount before payment",
        )

    existing = payment_service.get_payment_by_task(db, task.id)
    if existing and existing.status in (PaymentStatus.released, PaymentStatus.refunded):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment is already finalized",
        )

    payment, order_id = payment_service.get_or_create_checkout(db, task, settings)
    return CheckoutResponse(
        payment=payment_service.to_payment_out(payment, settings),
        key_id=settings.razorpay_key_id or None,
        order_id=order_id,
        amount_paise=payment.amount * 100,
        currency=payment.currency,
        dev=not settings.razorpay_configured,
    )


@router.post("/payments/verify", response_model=PaymentOut)
def verify_payment(
    payload: VerifyRequest,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> PaymentOut:
    """Client handshake after the Razorpay checkout widget succeeds (localhost-friendly)."""
    me = upsert_user_from_principal(db, principal)
    payment = payment_service.get_payment_by_order_id(db, payload.razorpay_order_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.payer_id != me.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your payment")

    ok = razorpay_client.verify_payment_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
        settings.razorpay_key_secret,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature"
        )

    payment = payment_service.mark_held(db, payment, payload.razorpay_payment_id)
    return payment_service.to_payment_out(payment, settings)


@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    body = await request.body()
    if not razorpay_client.verify_webhook_signature(
        body, x_razorpay_signature or "", settings.razorpay_webhook_secret
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature"
        )

    event = json.loads(body)
    event_type = event.get("event")
    entity = (
        event.get("payload", {}).get("payment", {}).get("entity", {})
    )
    order_id = entity.get("order_id")
    payment_id = entity.get("id")

    if not order_id:
        return {"status": "ignored"}

    payment = payment_service.get_payment_by_order_id(db, order_id)
    if payment is None:
        return {"status": "ignored"}

    if event_type == "payment.authorized":
        payment_service.mark_held(db, payment, payment_id)
    elif event_type == "payment.captured":
        payment.status = PaymentStatus.released
        if payment_id:
            payment.provider_payment_id = payment_id
        db.commit()
    elif event_type == "payment.failed":
        payment_service.mark_failed(db, payment)

    return {"status": "ok"}


@router.get("/tasks/{task_id}/payment", response_model=PaymentOut)
def get_task_payment(
    task_id: uuid.UUID,
    principal: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> PaymentOut:
    me = upsert_user_from_principal(db, principal)
    task = _task_or_404(db, task_id)
    payment = payment_service.get_payment_by_task(db, task.id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No payment yet")
    if me.id not in (payment.payer_id, payment.payee_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant")
    return payment_service.to_payment_out(payment, settings)
