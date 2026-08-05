from app.models.download import Download
from app.repositories.base import BaseRepository


class DownloadRepository(BaseRepository[Download]):
    def __init__(self, session):
        super().__init__(Download, session)
