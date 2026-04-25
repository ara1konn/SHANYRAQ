from sqlalchemy import Column, Integer, String, Text, Boolean, ARRAY, Table, ForeignKey
from database import Base
from sqlalchemy.orm import relationship

product_gifts = Table(
    "product_gifts",
    Base.metadata,
    Column("main_product_id", Integer, ForeignKey("products.id"), primary_key=True),
    Column("gift_product_id", Integer, ForeignKey("products.id"), primary_key=True)
)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Integer)
    images = Column(ARRAY(String))

    description = Column(Text)
    category = Column(String)
    color = Column(String)
    type = Column(String)
    sub_category = Column(String)
    material = Column(String)
    size = Column(String)

    old_price = Column(Integer, nullable=True)
    discount_percent = Column(Integer, nullable=True)

    is_promo = Column(Boolean, default=False)
    is_hit = Column(Boolean, default=False)

    is_gift_promo = Column(Boolean, default=False)
    is_gift = Column(Boolean, default=False)

    gifts = relationship(
        "Product",
        secondary="product_gifts",
        primaryjoin="Product.id == product_gifts.c.main_product_id",
        secondaryjoin="Product.id == product_gifts.c.gift_product_id",
        backref="is_gift_for"
    )