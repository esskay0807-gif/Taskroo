import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.enums import PaymentStatus, TaskStatus
from app.models.payment import Payment
from app.models.task import Task
from app.schemas.payment import PaymentOut
from app.services import razorpay_client


def compute_fee(amount: int, percent: int) -> tuple[int, int]:
    """Return (fee, net) for a gross amount and fee percent (fee rounded)."""
    fee = round(amount * percent / 100)
    return fee, amount - fee


def to_payment_out(payment: Payment, settings: Settings) -> PaymentOut:
    out = PaymentOut.model_validate(payment)
    return out.model_copy(update={"service_fee_percent": settings.service_fee_percent})


def get_payment_by_task(db: Session, task_id: uuid.UUID) -> Payment | None:
    return db.execute(
        select(Payment).where(Payment.task_id == task_id)
    ).scalar_one_or_none()


def get_payment_by_order_id(db: Session, order_id: str) -> Payment | None:
    return db.execute(
        select(Payment).where(Payment.provider_order_id == order_id)
    ).scalar_one_or_none()


def get_or_create_checkout(
    db: Session, task: Task, settings: Settings
) -> tuple[Payment, str | None]:
    """Ensure a Payment + (real) Razorpay order exist for the task. Returns
    (payment, order_id). In dev fallback (no Razorpay keys), the payment is marked
    held immediately to simulate a successful authorization."""
    payment = get_payment_by_task(db, task.id)
    if payment is None:
        payment = Payment(
            task_id=task.id,
            payer_id=task.poster_id,
            payee_id=task.assigned_tasker_id,
            amount=task.agreed_amount,
            currency="INR",
            status=PaymentStatus.authorized,
        )
        db.add(payment)
        db.flush()  # assign id for the receipt

    if settings.razorpay_configured:
        if not payment.provider_order_id:
            order = razorpay_client.create_order(
                settings,
                amount_paise=payment.amount * 100,
                currency=payment.currency,
                receipt=f"task_{task.id}",
            )
            payment.provider_order_id = order["id"]
        order_id = payment.provider_order_id
    else:
        # Dev fallback: simulate instant authorization → funds held.
        if not payment.provider_order_id:
            payment.provider_order_id = f"dev_order_{payment.id}"
        if payment.status == PaymentStatus.authorized:
            payment.status = PaymentStatus.held
            payment.provider_payment_id = f"dev_pay_{payment.id}"
        order_id = payment.provider_order_id

    db.commit()
    db.refresh(payment)
    return payment, order_id


def mark_held(db: Session, payment: Payment, provider_payment_id: str) -> Payment:
    payment.status = PaymentStatus.held
    payment.provider_payment_id = provider_payment_id
    db.commit()
    db.refresh(payment)
    return payment


def mark_failed(db: Session, payment: Payment) -> Payment:
    payment.status = PaymentStatus.failed
    db.commit()
    db.refresh(payment)
    return payment


def capture_and_release(
    db: Session, task: Task, payment: Payment, settings: Settings
) -> Payment:
    """Capture the held payment, deduct the service fee, release to the payee, and
    mark the task completed. Caller must have verified poster ownership, task
    assigned, and payment held."""
    if settings.razorpay_configured and payment.provider_payment_id:
        razorpay_client.capture_payment(
            settings,
            payment_id=payment.provider_payment_id,
            amount_paise=payment.amount * 100,
            currency=payment.currency,
        )

    fee, net = compute_fee(payment.amount, settings.service_fee_percent)
    payment.fee_amount = fee
    payment.net_amount = net
    payment.status = PaymentStatus.released

    task.status = TaskStatus.completed

    db.commit()
    db.refresh(payment)
    return payment
