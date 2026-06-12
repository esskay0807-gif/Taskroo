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
