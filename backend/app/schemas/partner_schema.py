from pydantic import BaseModel
from typing import List

class Partner(BaseModel):
    name: str
    type: str
    location: str
    latitude: float
    longitude: float
    npa_flag: bool

class PartnerListResponse(BaseModel):
    partners: List[Partner]