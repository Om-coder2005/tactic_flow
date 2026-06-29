from app.db.base import Base
from app.models.user import User, Session
from app.models.tactics import Project, Board, Frame
from app.models.system import FormationTemplate, ExportJob, AISummary

# This file centrally imports all models to guarantee Alembic maps them during metadata inspection.
