from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config.config import get_settings

postgresql_user = get_settings().postgres_user
postgresql_password = get_settings().postgres_password
postgresql_db = get_settings().postgres_db
postgresql_host = get_settings().postgres_host
postgresql_port = get_settings().postgres_port

SQLALCHEMY_DATABASE_URL = f"postgresql://{postgresql_user}:{postgresql_password}@{postgresql_host}:{postgresql_port}/{postgresql_db}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



