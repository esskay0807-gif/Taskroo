import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import PaymentStatus


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    payer_id: uuid.UUID
    payee_id: uuid.UUID
    amount: int
    currency: str
    status: PaymentStatus
    provider: str
    provider_order_id: str | None
    provider_payment_id: str | None
    fee_amount: int | None
    net_amount: int | None
    # Echoed from config for display; not a stored column (overridden when serialized).
    service_fee_percent: int = 15
    created_at: datetime
    updated_at: datetime


class CheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    task_id: uuid.UUID


class CheckoutResponse(BaseModel):
    payment: PaymentOut
    key_id: str | None
    order_id: str | None
    amount_paise: int
    currency: str
    dev: bool


class VerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
