from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import User

router = APIRouter()


class UserSyncRequest(BaseModel):
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    google_id: Optional[str]
    google_scopes: Optional[str]
    has_gmail: bool
    has_calendar: bool
    created_at: Optional[str]

    class Config:
        from_attributes = True


class UpdateTokensRequest(BaseModel):
    google_access_token: str
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[str] = None
    google_scopes: str


def user_to_response(user: User) -> UserResponse:
    scopes = (user.google_scopes or "").split()
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        google_id=user.google_id,
        google_scopes=user.google_scopes,
        has_gmail="https://www.googleapis.com/auth/gmail.readonly" in scopes,
        has_calendar="https://www.googleapis.com/auth/calendar.readonly" in scopes,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.post("/sync", response_model=UserResponse)
def sync_user(body: UserSyncRequest, db: Session = Depends(get_db)):
    """Create or update user on login. Returns the user record."""
    user = db.query(User).filter(User.email == body.email).first()

    if user:
        if body.name:
            user.name = body.name
        if body.avatar_url:
            user.avatar_url = body.avatar_url
        if body.google_id:
            user.google_id = body.google_id
        user.updated_at = datetime.utcnow()
    else:
        user = User(
            email=body.email,
            name=body.name,
            avatar_url=body.avatar_url,
            google_id=body.google_id,
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    return user_to_response(user)


@router.get("/me", response_model=UserResponse)
def get_current_user(email: str, db: Session = Depends(get_db)):
    """Get user by email. Called from Next.js API routes."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(user)


class UserTokensResponse(BaseModel):
    google_access_token: Optional[str]
    google_refresh_token: Optional[str]
    google_token_expiry: Optional[str]
    google_scopes: Optional[str]


@router.get("/me/tokens", response_model=UserTokensResponse)
def get_tokens(email: str, db: Session = Depends(get_db)):
    """Get user's Google OAuth tokens. Internal use only."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserTokensResponse(
        google_access_token=user.google_access_token,
        google_refresh_token=user.google_refresh_token,
        google_token_expiry=user.google_token_expiry.isoformat() if user.google_token_expiry else None,
        google_scopes=user.google_scopes,
    )


@router.patch("/me/tokens", response_model=UserResponse)
def update_tokens(email: str, body: UpdateTokensRequest, db: Session = Depends(get_db)):
    """Store or update Google OAuth tokens after connecting Gmail/Calendar."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.google_access_token = body.google_access_token
    if body.google_refresh_token:
        user.google_refresh_token = body.google_refresh_token
    if body.google_token_expiry:
        user.google_token_expiry = datetime.fromisoformat(body.google_token_expiry)
    user.google_scopes = body.google_scopes
    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)
    return user_to_response(user)


@router.delete("/me/disconnect/{service}")
def disconnect_service(service: str, email: str, db: Session = Depends(get_db)):
    """Remove a specific Google scope (gmail or calendar)."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    gmail_scope = "https://www.googleapis.com/auth/gmail.readonly"
    calendar_scope = "https://www.googleapis.com/auth/calendar.readonly"

    scopes = set((user.google_scopes or "").split())

    if service == "gmail":
        scopes.discard(gmail_scope)
    elif service == "calendar":
        scopes.discard(calendar_scope)
    else:
        raise HTTPException(status_code=400, detail="Invalid service. Use 'gmail' or 'calendar'.")

    user.google_scopes = " ".join(scopes) if scopes else None

    # If no workspace scopes remain, clear tokens entirely
    if gmail_scope not in scopes and calendar_scope not in scopes:
        user.google_access_token = None
        user.google_refresh_token = None
        user.google_token_expiry = None

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {"status": "ok", "service": service, "disconnected": True}
