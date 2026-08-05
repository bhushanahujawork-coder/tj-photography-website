from typing import Optional

from sqlalchemy import select

from app.models.participant import Participant
from app.repositories.base import BaseRepository


class ParticipantRepository(BaseRepository[Participant]):
    def __init__(self, session):
        super().__init__(Participant, session)
