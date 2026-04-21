import os
from typing import List, Optional

from fastapi import FastAPI, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

# Твои файлы
from database import SessionLocal
from models import Product
from schemas import ProductBase

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/products/{product_id}", response_class=HTMLResponse)
async def get_product_page(request: Request, product_id: int, db: Session = Depends(get_db)):
    # Ищем товар в базе по ID
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    # Отправляем данные в шаблон
    return templates.TemplateResponse("product.html", {
        "request": request, 
        "product": product
    })

@app.get("/products")
def get_products(
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    min_price: Optional[int] = None, 
    max_price: Optional[int] = None, 
    type: Optional[List[str]] = Query(None), 
    color: Optional[str] = None,
    sort: Optional[str] = None,
    is_promo: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if is_promo:
        query = query.filter(Product.is_promo == True)
    else:
        query = query.filter(Product.is_promo == False)
    
    if min_price: query = query.filter(Product.price >= min_price)
    if max_price: query = query.filter(Product.price <= max_price)
    if type: query = query.filter(Product.type.in_(type))
    if color: query = query.filter(Product.color == color)
    if category and category != "all": query = query.filter(Product.category == category)
    if sub_category: query = query.filter(Product.sub_category == sub_category)
    
    # Сортировка
    if sort == "price-low":
        query = query.order_by(asc(Product.price))
    elif sort == "price-high":
        query = query.order_by(desc(Product.price))
    else:
        query = query.order_by(asc(Product.id))
        
    return query.all()

@app.get("/promotions", response_class=HTMLResponse)
async def get_promotions(request: Request):
    return templates.TemplateResponse("promotions.html", {"request": request})

@app.get("/about", response_class=HTMLResponse)
async def get_about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

@app.get("/contact", response_class=HTMLResponse)
async def get_contact(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})

@app.get("/catalog", response_class=HTMLResponse)
async def get_catalog(request: Request):
    return templates.TemplateResponse("catalog.html", {"request": request})