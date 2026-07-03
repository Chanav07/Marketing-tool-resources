import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.brand import Brand
from app.models.voice import VoiceProfile
from app.schemas.voice import VoiceProfileIn, VoiceProfileOut

router = APIRouter(tags=["voice"])


async def _ensure_brand(brand_id: uuid.UUID, db: AsyncSession) -> None:
    if await db.get(Brand, brand_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Brand not found")


async def _get_profile(brand_id: uuid.UUID, db: AsyncSession) -> VoiceProfile | None:
    result = await db.execute(
        select(VoiceProfile).where(VoiceProfile.brand_id == brand_id)
    )
    return result.scalar_one_or_none()


@router.get("/brands/{brand_id}/voice", response_model=VoiceProfileOut)
async def get_voice(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _ensure_brand(brand_id, db)
    profile = await _get_profile(brand_id, db)
    if profile is None:
        # Create an empty profile on first read so the client always has a row.
        profile = VoiceProfile(brand_id=brand_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.put("/brands/{brand_id}/voice", response_model=VoiceProfileOut)
async def put_voice(
    brand_id: uuid.UUID,
    payload: VoiceProfileIn,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_brand(brand_id, db)
    profile = await _get_profile(brand_id, db)
    if profile is None:
        profile = VoiceProfile(brand_id=brand_id)
        db.add(profile)

    profile.samples = payload.samples
    profile.banned_terms = payload.banned_terms
    profile.rewrite_pairs = [p.model_dump() for p in payload.rewrite_pairs]

    await db.commit()
    await db.refresh(profile)
    return profile
