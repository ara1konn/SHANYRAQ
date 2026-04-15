from sqlalchemy import Column, Integer, String, Text
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Integer)
    image_url = Column(Text)
    description = Column(Text)
    category = Column(String)
    color = Column(String)
    type = Column(String)
    sub_category = Column(String)