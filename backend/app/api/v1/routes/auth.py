import uuid
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.models.user import User, Session
from app.schemas.auth import GuestSessionResponse, UserResponse, UserCreate
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_password, get_password_hash
from app.api.deps import get_current_user, get_current_user_optional

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

def set_auth_cookies(response: Response, user_id: str):
    access_token = create_access_token(subject=user_id)
    refresh_token = create_refresh_token(subject=user_id)
    csrf_token = secrets.token_hex(32)
    
    is_prod = False # settings.ENV == "production" depending on your config, we'll keep it simple
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 60 * 60 # 30 days
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 60 * 60 # 30 days
    )
    # Non-httpOnly CSRF token for the frontend to read
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=is_prod,
        samesite="lax",
        path="/"
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("csrf_token", path="/")

@router.post("/guest")
@limiter.limit("5/minute")
async def create_guest(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Creates a temporary guest user and hands back cookies."""
    new_user = User(
        name=f"Guest_{str(uuid.uuid4())[:6]}",
        email=f"guest_{uuid.uuid4()}@local.com",
        role="guest",
        password_hash=""
    )
    db.add(new_user)
    await db.flush()

    set_auth_cookies(response, str(new_user.id))
    
    await db.commit()
    await db.refresh(new_user)

    # We return the user profile. The tokens are in cookies.
    return {"message": "Guest session created", "user": UserResponse.model_validate(new_user)}

@router.post("/register")
@limiter.limit("5/minute")
async def register(
    request: Request, 
    response: Response, 
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db),
    guest_user: User | None = Depends(get_current_user_optional)
):
    # Check if user exists
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        role="user",
        password_hash=get_password_hash(user_in.password)
    )
    db.add(new_user)
    await db.flush()
    
    set_auth_cookies(response, str(new_user.id))
    
    # Migrate guest projects if a guest session exists
    if guest_user and guest_user.role == "guest":
        from sqlalchemy import update
        from app.models.tactics import Project
        stmt_update = update(Project).where(Project.user_id == guest_user.id).values(user_id=new_user.id)
        await db.execute(stmt_update)
        
    await db.commit()
    await db.refresh(new_user)
    
    return {"message": "User registered", "user": UserResponse.model_validate(new_user)}

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == form_data.username)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    set_auth_cookies(response, str(user.id))
    return {"message": "Logged in successfully", "user": UserResponse.model_validate(user)}

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(user: User | None = Depends(get_current_user_optional)):
    if user:
        return {"user": UserResponse.model_validate(user)}
    return {"user": None}
