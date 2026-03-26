from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import LLMConfig
from api.schemas.llm_config import LLMConfigCreate, LLMConfigUpdate, LLMConfigResponse, VALID_PROVIDERS
from services.encryption_service import EncryptionService
from typing import List

router = APIRouter()


def _to_response(config: LLMConfig) -> dict:
    return {
        "id": config.id,
        "provider": config.provider,
        "model": config.model,
        "api_key_masked": "sk-••••••••",
        "base_url": config.base_url,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "is_default": config.is_default,
    }


@router.post("/llm-configs")
def create_llm_config(payload: LLMConfigCreate, db: Session = Depends(get_db)):
    if payload.provider not in VALID_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Provider must be one of {VALID_PROVIDERS}")

    enc = EncryptionService()
    encrypted_key = enc.encrypt(payload.api_key)

    # First config becomes default
    is_default = db.query(LLMConfig).count() == 0

    config = LLMConfig(
        provider=payload.provider,
        model=payload.model,
        api_key_encrypted=encrypted_key,
        base_url=payload.base_url,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        is_default=is_default,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return _to_response(config)


@router.get("/llm-configs")
def get_llm_configs(db: Session = Depends(get_db)):
    configs = db.query(LLMConfig).all()
    return [_to_response(c) for c in configs]


@router.get("/llm-configs/{config_id}")
def get_llm_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return _to_response(config)


@router.put("/llm-configs/{config_id}")
def update_llm_config(config_id: int, update: LLMConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM config not found")

    if update.api_key:
        enc = EncryptionService()
        config.api_key_encrypted = enc.encrypt(update.api_key)

    if update.model is not None:
        config.model = update.model
    if update.base_url is not None:
        config.base_url = update.base_url
    if update.temperature is not None:
        config.temperature = update.temperature
    if update.max_tokens is not None:
        config.max_tokens = update.max_tokens
    if update.is_default is True:
        # Unset other defaults
        db.query(LLMConfig).filter(LLMConfig.id != config_id).update({"is_default": False})
        config.is_default = True

    db.commit()
    db.refresh(config)
    return _to_response(config)


@router.delete("/llm-configs/{config_id}")
def delete_llm_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM config not found")
    db.delete(config)
    db.commit()
    return {"message": "LLM config deleted"}
