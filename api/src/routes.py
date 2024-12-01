from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from bson import ObjectId
from typing import List, Dict
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


@router.get("/stats/per-room", response_model=List[Dict])
async def get_average_price_per_room(request: Request):
    """
    Returns statistics for properties grouped by number of rooms:
    - Average rental price
    - Number of rooms
    - Count of properties participating in the average
    """
   
    pipeline = [
        {
            "$group": {
                "_id": "$rooms",
                "average_price": {"$avg": "$rental_price_usd_normalized"},
                "property_count": {"$sum": 1},
            }
        },
        {
            "$project": {
                "rooms": "$_id",
                "average_price": 1,
                "property_count": 1,
                "_id": 0,
            }
        },
        {"$sort": {"rooms": 1}},
    ]
    data = list(request.app.database["properties"].aggregate(pipeline))
    return JSONResponse(content=data)

