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
    old_price: Optional[int]
    discount_percent: Optional[int]
    is_promo: bool = False

    class Config:
        from_attributes = True