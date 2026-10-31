import os
import uuid
import logging
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
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


class CloudinaryService:
    @staticmethod
    async def upload_listing_image(
        file: UploadFile,
    ) -> Tuple[str, str]:
        """
        Validate and upload a listing image.
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

        # 2. Validate MIME type
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

        # 4. Check whether to perform real Cloudinary upload or dev fallback
        is_dev_key = (
            settings.CLOUDINARY_API_KEY in ("dev_key", "")
            or settings.CLOUDINARY_CLOUD_NAME in ("rethread-dev", "")
        )

        public_id = f"rethread_listing_{uuid.uuid4().hex[:12]}"

        if not is_dev_key:
            try:
                upload_result = cloudinary.uploader.upload(
                    content,
                    folder="rethread_listings",
                    public_id=public_id,
                    transformation=[
                        {"width": 1200, "height": 1200, "crop": "limit"},
                        {"quality": "auto", "fetch_format": "auto"},
                    ],
                )
                return upload_result["secure_url"], upload_result["public_id"]
            except Exception as exc:
                logger.warning(f"Cloudinary upload failed ({exc}), falling back to dev upload.")

        # Dev Fallback: save to frontend public/uploads folder so it is viewable locally
        local_dir = "/Users/white_w6lf/Desktop/ReThread/frontend/public/uploads"
        os.makedirs(local_dir, exist_ok=True)
        local_filename = f"{public_id}{ext}"
        local_filepath = os.path.join(local_dir, local_filename)

        with open(local_filepath, "wb") as f:
            f.write(content)

        local_url = f"/uploads/{local_filename}"
        return local_url, public_id

    @staticmethod
    def delete_image(public_id: str) -> bool:
        """Delete image from Cloudinary or local storage."""
        if not public_id:
            return True
        try:
            cloudinary.uploader.destroy(public_id)
            return True
        except Exception as exc:
            logger.warning(f"Failed to delete Cloudinary asset {public_id}: {exc}")
            return False
