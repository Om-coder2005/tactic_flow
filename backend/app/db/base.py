from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncAttrs

class Base(AsyncAttrs, DeclarativeBase):
    """
    Base class for all SQLAlchemy declarative models.
    AsyncAttrs is required to automatically resolve relationships inside an async runtime.
    """
    pass
