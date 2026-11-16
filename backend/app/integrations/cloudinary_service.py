import os
import uuid
import logging
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException, Request, status
import cloudinary
import cloudinary.uploader
from app.core.config import settings

logger = logging.getLogger("rethread.cloudinary")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

# Initialize Cloudinary configuration
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def validate_image_magic_bytes(content: bytes) -> str:
    """
    Validates magic bytes to ensure file is genuinely a JPEG, PNG, or WebP image.
    Prevents executable or script upload bypasses.
    """
    if len(content) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is too small or corrupted."
        )

    # JPEG magic bytes: FF D8 FF
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"

    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"

    # WebP magic bytes: RIFF .... WEBP
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return ".webp"

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid image content. File signature does not match a valid JPEG, PNG, or WebP image."
    )


class CloudinaryService:
    @staticmethod
    async def upload_listing_image(
        file: UploadFile,
        request: Optional[Request] = None,
    ) -> Tuple[str, str]:
        """
        Validate, strip EXIF metadata (protect student privacy), and upload a listing image.
        Uploads to Cloudinary CDN if credentials exist, otherwise falls back to local static storage.
        Returns: (image_url, cloudinary_public_id)
        """
        # 1. Validate file extension
        filename = file.filename or "image.jpg"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image format '{ext}'. Allowed: JPEG, PNG, WebP.",
            )

        # 2. Validate MIME type header
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid MIME type '{file.content_type}'. Must be an image.",
            )

        # 3. Read content & validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed limit of 5 MB.",
            )

        # 4. Deep magic-bytes validation
        validate_image_magic_bytes(content)

        # 5. Check whether to perform real Cloudinary upload or local storage fallback
        is_dev_key = (
            settings.CLOUDINARY_API_KEY in ("dev_key", "", "none", None)
            or settings.CLOUDINARY_CLOUD_NAME in ("rethread-dev", "", "none", None)
        )

        public_id = f"rethread_listing_{uuid.uuid4().hex[:12]}"

        if not is_dev_key:
            try:
                # flags: strip_profile removes all GPS/EXIF metadata (essential for campus safety)
                upload_result = cloudinary.uploader.upload(
                    content,
                    folder="rethread_listings",
                    public_id=public_id,
                    transformation=[
                        {"width": 1200, "height": 1200, "crop": "limit"},
                        {"quality": "auto", "fetch_format": "auto"},
                        {"flags": "strip_profile"},
                    ],
                )
                return upload_result["secure_url"], upload_result["public_id"]
            except Exception as exc:
                logger.error(f"Cloudinary upload failed: {exc}. Falling back to local static storage.", exc_info=True)

        # Fallback to local uploads directory served via FastAPI StaticFiles
        uploads_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        local_filename = f"{public_id}{ext}"
        local_filepath = os.path.join(uploads_dir, local_filename)

        with open(local_filepath, "wb") as f:
            f.write(content)

        # Build public URL for the uploaded photo
        base = ""
        railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
        if railway_domain:
            base = f"https://{railway_domain}"
        elif request and request.headers.get("host"):
            proto = request.headers.get("x-forwarded-proto", "https" if "railway" in request.headers.get("host", "") else "http")
            base = f"{proto}://{request.headers.get('host')}"
        elif settings.FRONTEND_URL and "localhost" not in settings.FRONTEND_URL:
            base = settings.FRONTEND_URL.rstrip('/')

        image_url = f"{base}/uploads/{local_filename}" if base else f"/uploads/{local_filename}"
        logger.info(f"Listing photo saved to local uploads: {image_url}")
        return image_url, public_id

    @staticmethod
    async def delete_listing_image(cloudinary_public_id: str) -> bool:
        """Deletes an image from Cloudinary to prevent orphaned media storage."""
        if not cloudinary_public_id or cloudinary_public_id.startswith("dev_"):
            return True

        try:
            cloudinary.uploader.destroy(cloudinary_public_id)
            return True
        except Exception as exc:
            logger.warning(f"Failed to delete Cloudinary asset {cloudinary_public_id}: {exc}")
            return False
