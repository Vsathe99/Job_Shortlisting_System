from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
async def register(payload: schemas.UserRegister):
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if payload.role not in ("recruiter", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'recruiter' or 'admin'")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    await user.insert()

    token = create_access_token({"sub": user.email, "role": user.role})
    return schemas.Token(
        access_token=token,
        user=schemas.UserOut.model_validate(user, from_attributes=True),
    )


@router.post("/login", response_model=schemas.Token)
async def login(
    payload: schemas.UserLogin,
):
    user = await User.find_one(User.email == payload.email)

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": user.email, "role": user.role})

    return schemas.Token(
        access_token=token,
        user=schemas.UserOut.model_validate(user, from_attributes=True),
    )


@router.get("/me", response_model=schemas.UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return schemas.UserOut.model_validate(current_user, from_attributes=True)
