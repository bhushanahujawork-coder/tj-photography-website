from app.models.album import Album
from app.repositories.base import BaseRepository


class AlbumRepository(BaseRepository[Album]):
    def __init__(self, session):
        super().__init__(Album, session)
