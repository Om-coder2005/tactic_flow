from fastapi import APIRouter, Depends
from app.api.deps import verify_csrf

from app.api.v1.routes import auth, projects, boards, frames, exports, ai, formations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"], dependencies=[Depends(verify_csrf)])
api_router.include_router(boards.router, prefix="/projects", tags=["boards"], dependencies=[Depends(verify_csrf)])
api_router.include_router(frames.router, prefix="/projects", tags=["frames"], dependencies=[Depends(verify_csrf)])
api_router.include_router(ai.router, prefix="/projects", tags=["ai"], dependencies=[Depends(verify_csrf)])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"], dependencies=[Depends(verify_csrf)])
api_router.include_router(formations.router, prefix="/formations", tags=["formations"], dependencies=[Depends(verify_csrf)])
