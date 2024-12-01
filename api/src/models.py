from typing_extensions import Annotated
from pydantic import BaseModel, Field, BeforeValidator
from datetime import datetime
from typing import Optional



PyObjectId = Annotated[str, BeforeValidator(str)]

class Property(BaseModel):
    id: PyObjectId = Field(..., alias="_id") 
    zp_id: Optional[str] = None
    address: Optional[str] = None
    bathrooms: Optional[int] = None
    bedrooms: Optional[int] = None
    expenses_currency_original: Optional[str] = None
    expenses_price_original: Optional[float] = None
    expenses_price_usd_normalized: Optional[float] = None
    latitude: Optional[float] = None
    location: Optional[str] = None
    longitude: Optional[float] = None
    parking: Optional[int] = None
    rental_currency_original: Optional[str] = None
    rental_price_original: Optional[float] = None
    rental_price_usd_normalized: Optional[float] = None
    rooms: Optional[int] = None
    scraped_at: Optional[datetime] = None
    square_meters_area: Optional[int] = None
    usd_buy_price: Optional[float] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AveragePricePerRoom(BaseModel):
    avg_price_per_room: float
    total_rooms: int
    
