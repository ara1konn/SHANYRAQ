from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    id: int
    name: str
    price: int
    image_url: str
    description: Optional[str]
    category: str
    color: str
    type: str
    sub_category: str

    class Config:
        from_attributes = True