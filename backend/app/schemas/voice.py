import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RewritePair(BaseModel):
    dont: str = Field(..., min_length=1, max_length=2000)
    do: str = Field(..., min_length=1, max_length=2000)

    @field_validator("dont", "do")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("rewrite pair sides cannot be blank")
        return v


class VoiceProfileIn(BaseModel):
    samples: list[str] = Field(default_factory=list, max_length=20)
    banned_terms: list[str] = Field(default_factory=list, max_length=200)
    rewrite_pairs: list[RewritePair] = Field(default_factory=list, max_length=50)

    @field_validator("samples", "banned_terms")
    @classmethod
    def clean_str_list(cls, v: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for item in v:
            s = (item or "").strip()
            if s and s.lower() not in seen:
                seen.add(s.lower())
                out.append(s)
        return out


class VoiceProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    brand_id: uuid.UUID
    samples: list[str]
    banned_terms: list[str]
    rewrite_pairs: list[RewritePair]
    created_at: datetime
    updated_at: datetime
