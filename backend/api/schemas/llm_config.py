from pydantic import BaseModel
from typing import Optional


VALID_PROVIDERS = ["openai", "anthropic", "gemini", "ollama"]


class LLMConfigCreate(BaseModel):
    provider: str
    model: str
    api_key: str                        # raw key - encrypted before storing
    base_url: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048


class LLMConfigUpdate(BaseModel):
    model: Optional[str] = None
    api_key: Optional[str] = None       # raw key - encrypted before storing
    base_url: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    is_default: Optional[bool] = None


class LLMConfigResponse(BaseModel):
    id: int
    provider: str
    model: str
    api_key_masked: str                 # never return raw or encrypted key
    base_url: Optional[str]
    temperature: float
    max_tokens: int
    is_default: bool

    class Config:
        from_attributes = True
