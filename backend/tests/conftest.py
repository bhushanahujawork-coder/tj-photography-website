"""Test configuration with async PostgreSQL test database."""

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.core.security import hash_password, create_access_token
from app.models import User, UserRole

TEST_DATABASE_URL = settings.DATABASE_URL + "_test"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_token() -> str:
    return create_access_token({"sub": "usr-1", "role": UserRole.ADMIN.value, "is_active": True})


@pytest_asyncio.fixture
async def photographer_token() -> str:
    return create_access_token({"sub": "usr-2", "role": UserRole.PHOTOGRAPHER.value, "is_active": True})


@pytest_asyncio.fixture
async def editor_token() -> str:
    return create_access_token({"sub": "usr-3", "role": UserRole.EDITOR.value, "is_active": True})


@pytest_asyncio.fixture
async def client_token() -> str:
    return create_access_token({"sub": "usr-4", "role": UserRole.CLIENT.value, "is_active": True})


@pytest_asyncio.fixture
async def test_users(db_session: AsyncSession):
    users = [
        User(
            id="usr-1", name="TJ", email="tj@tjphotography.com",
            role=UserRole.ADMIN.value, password_hash=hash_password("Password123"),
            is_active=True,
        ),
        User(
            id="usr-2", name="Sarah Johnson", email="sarah@tjphotography.com",
            role=UserRole.PHOTOGRAPHER.value, password_hash=hash_password("Password123"),
            is_active=True,
        ),
        User(
            id="usr-3", name="Mike Chen", email="mike@tjphotography.com",
            role=UserRole.EDITOR.value, password_hash=hash_password("Password123"),
            is_active=True,
        ),
        User(
            id="usr-4", name="Emily & James", email="emily.james@example.com",
            role=UserRole.CLIENT.value, password_hash=hash_password("Password123"),
            is_active=True,
        ),
    ]
    db_session.add_all(users)
    await db_session.commit()
    return users


@pytest_asyncio.fixture
async def auth_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture
async def photographer_headers(photographer_token: str) -> dict:
    return {"Authorization": f"Bearer {photographer_token}"}


@pytest_asyncio.fixture
async def client_headers(client_token: str) -> dict:
    return {"Authorization": f"Bearer {client_token}"}
