from fastapi import FastAPI, Depends, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Product
from schemas import ProductBase
from typing import List
from typing import List, Optional
from sqlalchemy import asc, desc

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "API работает"}


def update_products():
    db = SessionLocal()
    db.query(Product).filter(Product.name.contains("Диван")).update({"product_type": "soft"})
    db.commit()

@app.get("/products")
def get_products(
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    min_price: Optional[int] = None, 
    max_price: Optional[int] = None, 
    type: Optional[List[str]] = Query(None), 
    color: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    
    if min_price:
        query = query.filter(Product.price >= min_price)
    if max_price:
        query = query.filter(Product.price <= max_price)
    if type:
        query = query.filter(Product.type.in_(type))
    if color:
        query = query.filter(Product.color == color)

    if category and category != "all":
        query = query.filter(Product.category == category)

    if sub_category:
        query = query.filter(Product.sub_category == sub_category)
    
    if sort == "price-low":
        query = query.order_by(asc(Product.price))
    elif sort == "price-high":
        query = query.order_by(desc(Product.price))
    elif sort == "popular":
        query = query.order_by(desc(Product.id))
    else:
        query = query.order_by(asc(Product.id))
        
    return query.all()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(BASE_DIR, "static")),
    name="static"
)