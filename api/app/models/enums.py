from enum import StrEnum


class TaskStatus(StrEnum):
    draft = "draft"
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class LocationType(StrEnum):
    in_person = "in_person"
    remote = "remote"


class OfferStatus(StrEnum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class PaymentStatus(StrEnum):
    authorized = "authorized"  # order created, awaiting customer authorization
    held = "held"  # funds authorized and held in escrow
    released = "released"  # captured and released to the tasker (fee deducted)
    refunded = "refunded"
    failed = "failed"


class ReviewRole(StrEnum):
    of_tasker = "of_tasker"  # poster reviewing the tasker
    of_poster = "of_poster"  # tasker reviewing the poster


class NotificationType(StrEnum):
    offer_received = "offer_received"
    offer_accepted = "offer_accepted"
    new_message = "new_message"
    task_completed = "task_completed"
