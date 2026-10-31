from fastapi import APIRouter, Depends, UploadFile, File, status
from app.core.dependencies import get_current_user
from app.models.user import User
from app.integrations.cloudinary_service import CloudinaryService

router = APIRouter(prefix="/uploads", tags=["Uploads & Media"])


@router.post("/listing-images", status_code=status.HTTP_201_CREATED)
async def upload_listing_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload and optimize a listing photo via Cloudinary.
    Enforces format (JPEG/PNG/WebP) and 5 MB size limit.
    """
    image_url, public_id = await CloudinaryService.upload_listing_image(file)
    return {
        "image_url": image_url,
        "cloudinary_public_id": public_id,
        "display_order": 0,
    }


@router.delete("/listing-images/{public_id}", status_code=status.HTTP_200_OK)
async def delete_listing_image(
    public_id: str,
    current_user: User = Depends(get_current_user),
):
    """Remove an uploaded photo from Cloudinary storage."""
    success = CloudinaryService.delete_image(public_id)
    return {"success": success, "deleted_id": public_id}
