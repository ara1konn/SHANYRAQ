from pydantic import BaseModel
from typing import Optional, List

class ProductBase(BaseModel):
    id: int
    name: str
    price: int
    images: List[str]
    description: Optional[str] = None
    category: str
    color: str
    type: str
    material : str
    size : Optional[str]
    sub_category: str
    old_price: Optional[int] 
    discount_percent: Optional[int] 
    is_promo: bool
    is_hit: bool

    class Config:
        from_attributes = True