import secrets
from typing import Optional

from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings


def token_matches(token: Optional[str], settings: Settings) -> bool:
    return bool(token) and secrets.compare_digest(token.encode(), settings.API_TOKEN.encode())


def require_token(
    authorization: Optional[str] = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token_matches(token, settings):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
