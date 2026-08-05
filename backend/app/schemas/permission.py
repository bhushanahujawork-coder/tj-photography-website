from pydantic import BaseModel, Field


class PermissionResponse(BaseModel):
    role: str = Field(description="User role")
    permission: str = Field(description="Permission name")
    allowed: bool = Field(description="Whether the permission is granted")

    model_config = {"from_attributes": True}


class PermissionUpdateRequest(BaseModel):
    wedding_id: str = Field(description="Wedding ID to update permissions for")
    role: str = Field(description="Role to update")
    permissions: dict[str, bool] = Field(description="Map of permission names to boolean values")

    model_config = {"from_attributes": True}


class PermissionMatrixResponse(BaseModel):
    wedding_id: str = Field(description="Wedding ID")
    matrix: dict[str, dict[str, bool]] = Field(description="Role-to-permission mapping matrix")

    model_config = {"from_attributes": True}


class DefaultPermissionsResponse(BaseModel):
    defaults: dict[str, dict[str, bool]] = Field(description="Default role-to-permission mapping matrix")

    model_config = {"from_attributes": True}
