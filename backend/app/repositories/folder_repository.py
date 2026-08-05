from app.models.folder import Folder
from app.repositories.base import BaseRepository


class FolderRepository(BaseRepository[Folder]):
    def __init__(self, session):
        super().__init__(Folder, session)
