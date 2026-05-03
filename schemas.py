from pydantic import BaseModel, EmailStr
from typing import Optional, List


class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartItemOut(CartItemBase):
    id: int
    name: str
    price: int

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class UserMeResponse(BaseModel):
    authenticated: bool
    username: Optional[str] = None
    email: Optional[str] = None

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
    is_gift_promo: bool = False
    is_gift: bool = False

    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    gifts: List[ProductBase] = []