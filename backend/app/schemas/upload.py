from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FileInfoItem(BaseModel):
    name: str
    size: int = 0
    content_type: str = "image/jpeg"


class FileAllocation(BaseModel):
    file_id: str
    filename: str
    size: int = 0
    content_type: str = "image/jpeg"
    upload_url: str


class UploadInitRequest(BaseModel):
    wedding_id: str = Field(description="Wedding ID to upload to")
    album_id: Optional[str] = Field(default=None, description="Album ID to assign uploaded photos")
    folder_id: Optional[str] = Field(default=None, description="Folder ID to assign uploaded photos")
    files: list[FileInfoItem] = Field(description="List of file metadata (name, size, content_type)")

    model_config = ConfigDict(from_attributes=True)


class UploadInitResponse(BaseModel):
    upload_id: str = Field(description="Unique upload session identifier")
    files: list[FileAllocation] = Field(description="List of file allocations with file_id and upload_url")

    model_config = ConfigDict(from_attributes=True)


class UploadCompleteRequest(BaseModel):
    upload_id: str = Field(description="Upload session ID")
    file_id: str = Field(description="File ID to mark complete")
    status: str = Field(description="Upload status (completed/failed)")
    metadata: Optional[dict] = Field(default=None, description="Additional file metadata")

    model_config = {"from_attributes": True}


class UploadProgressResponse(BaseModel):
    upload_id: str = Field(description="Upload session ID")
    total_files: int = Field(ge=0, description="Total number of files in session")
    completed: int = Field(ge=0, description="Number of completed files")
    failed: int = Field(ge=0, description="Number of failed files")
    progress_percent: float = Field(ge=0.0, le=100.0, description="Upload progress percentage")

    model_config = {"from_attributes": True}
