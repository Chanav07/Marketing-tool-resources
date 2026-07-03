import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.brand import Brand


class VoiceProfile(Base):
    """Phase 3 — Voice codifier. One profile per brand.

    Stored as JSONB documents since the profile is edited and saved as a whole:
    - samples:       list[str]                  (3-5 copy examples you love)
    - banned_terms:  list[str]                  (exact words never to appear)
    - rewrite_pairs: list[{"dont": str, "do": str}]  (weak line -> better line)
    """

    __tablename__ = "voice_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    samples: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    banned_terms: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    rewrite_pairs: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )

    brand: Mapped["Brand"] = relationship(back_populates="voice_profile")
