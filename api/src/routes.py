from fastapi import APIRouter, Request, HTTPException, status
from bson import ObjectId
from typing import List
from models import Property

router = APIRouter()


@router.get(
    "/",
    response_description="List all properties",
    response_model=List[Property],
)
def list_properties(request: Request):
    properties = list(request.app.database["properties"].find(limit=100))
    return properties


@router.get(
    "/{id}", response_description="Get a single property by id", response_model=Property
)
def find_property(id: str, request: Request):
    if (
        property := request.app.database["properties"].find_one({"_id": ObjectId(id)})
    ) is not None:
        return property
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail=f"Property with ID {id} not found"
    )
