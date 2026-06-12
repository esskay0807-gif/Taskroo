"""Avatar upload presigning.

When R2 is configured we hand the client a presigned PUT URL straight to Cloudflare R2
(S3-compatible). When it isn't (local dev), we fall back to a URL served by this API
(`/v1/uploads/dev/{key}`) so the full pick → upload → display loop still works without keys.
"""

import os
import uuid

from app.config import Settings
from app.schemas.user import PresignResponse

# Local directory used by the dev upload fallback.
DEV_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".dev_uploads")


def _extension(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext.lower()


# Maps the upload "kind" to a key prefix / folder.
_KIND_PREFIX = {"avatar": "avatars", "task": "tasks", "review": "reviews"}


def build_upload_key(kind: str, clerk_id: str, filename: str) -> str:
    # Avoid path traversal / weird ids in the key by namespacing on a uuid.
    prefix = _KIND_PREFIX.get(kind, "misc")
    safe_id = clerk_id.replace("/", "_")
    return f"{prefix}/{safe_id}/{uuid.uuid4().hex}{_extension(filename)}"


def presign_upload(
    settings: Settings, kind: str, clerk_id: str, filename: str, content_type: str
) -> PresignResponse:
    key = build_upload_key(kind, clerk_id, filename)

    if settings.r2_configured:
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
        upload_url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.r2_bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=3600,
        )
        public_base = settings.r2_public_base_url.rstrip("/")
        public_url = f"{public_base}/{key}" if public_base else upload_url.split("?")[0]
        return PresignResponse(
            upload_url=upload_url,
            public_url=public_url,
            key=key,
            method="PUT",
            headers={"Content-Type": content_type},
        )

    # Dev fallback — upload + serve via this API.
    base = settings.api_base_url.rstrip("/")
    dev_url = f"{base}/v1/uploads/dev/{key}"
    return PresignResponse(
        upload_url=dev_url,
        public_url=dev_url,
        key=key,
        method="PUT",
        headers={"Content-Type": content_type},
    )


def dev_upload_path(key: str) -> str:
    """Resolve a safe absolute path under DEV_UPLOAD_DIR for a given key."""
    full = os.path.normpath(os.path.join(DEV_UPLOAD_DIR, key))
    if not full.startswith(os.path.normpath(DEV_UPLOAD_DIR) + os.sep):
        raise ValueError("Invalid upload key")
    return full
