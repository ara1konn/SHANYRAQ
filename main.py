import os
from datetime import datetime, timedelta
from typing import List, Optional

import models
from database import engine

models.Base.metadata.create_all(bind=engine)

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc
from sqlalchemy import or_, func
from sqlalchemy import case
from jose import jwt


import models, schemas, auth_utils
from database import SessionLocal, SECRET_KEY, ALGORITHM
from models import Product, CartItem, User
from schemas import ProductBase, CartItemCreate, UserMeResponse

load_dotenv()

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", SECRET_KEY)
    ALGORITHM = os.getenv("ALGORITHM", ALGORITHM)
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

settings = Settings()
app = FastAPI()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Достаем пользователя из токена
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Достаем токен из куки
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Вы не авторизованы")

    try:
        # Декодируем токен
        payload = auth_utils.decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Невалидный токен")
    except Exception:
        raise HTTPException(status_code=401, detail="Ошибка авторизации")

    # Ищем пользователя в базе
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    
    return user

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Роутер для операций с пользователями
user_router = APIRouter(prefix="/api/users", tags=["Users"])
# Эндпоинт для фронтенда: проверить авторизацию и получить базовую информацию о пользователе
@user_router.get("/me", response_model=UserMeResponse)
async def get_current_user_info(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    
    if not token:
        return {"authenticated": False, "username": None, "email": None}

    try:
        # Декодируем сразу чистый токен из куки
        payload = auth_utils.decode_access_token(token)
        if not payload:
            return {"authenticated": False, "username": None, "email": None}

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user:
            return {"authenticated": False, "username": None, "email": None}

        return {
            "authenticated": True,
            "username": user.username,
            "email": user.email
        }
    except Exception:
        return {"authenticated": False, "username": None, "email": None}
# Подключаем роутер к основному приложению
app.include_router(user_router)    

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request, db: Session = Depends(get_db)):
    hits = db.query(Product).filter(Product.is_hit == True).all()
    
    return templates.TemplateResponse("index.html", {
        "request": request, 
        "hit_products": hits
    })

SYNONYMS = {
    "шкаф": ["гардероб", "шкаф купе"],
    "диван": ["софа", "угловой диван"],
    "кровать": ["кровать"],
    "кресло": ["софа", "угловой диван"],
    "полка": ["книжняя полка", "стеллаж"],
    "лампа": ["торшер", "угловой диван"],
    "зеркало": ["зеркала"],
    "ковер": ["ковры"],
    "стол": ["обеденный стол", "журнальный стол", "письменнный стол", "буфеты", "барные столы", "туалетный стол"],
    "стул": ["барный стул", "табурет", "письменнный стол", "буфеты"]
}

def expand_query(query: str):
    words = [query]

    for key, values in SYNONYMS.items():
        if query == key or key in query:
            words.extend(values)

    return words

@app.get("/api/products/search")
def search_products(query: str, db: Session = Depends(get_db)):

    query = query.strip().lower()

    if not query:
        return []

    search_terms = expand_query(query)

    filters = []

    for term in search_terms:
        filters.append(func.lower(models.Product.name).like(f"%{term}%"))
        filters.append(func.lower(models.Product.description).like(f"%{term}%"))

    products = db.query(models.Product).filter(
        or_(*filters)
    ).order_by(
        case(
            (models.Product.name.ilike(f"%{query}%"), 1),
            else_=2
        )
    ).limit(20).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "images": p.images,
            "price": p.price
        }
        for p in products
    ]


@app.get("/products/regular")
def get_regular_products(
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    min_price: Optional[int] = None, 
    max_price: Optional[int] = None, 
    type: Optional[List[str]] = Query(None),
    color: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(
        Product.is_promo == False,
        Product.is_gift_promo == False
    )

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

    return query.all()


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
    ids: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if ids:
        ids_list = [int(i) for i in ids.split(",") if i.isdigit()]
        query = query.filter(Product.id.in_(ids_list))
        return query.all()
    
    query = query.filter(Product.is_gift_promo == False)

    if is_promo is not None:
        query = query.filter(Product.is_promo == is_promo)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)
        
    if type: query = query.filter(Product.type.in_(type))
    if color: query = query.filter(Product.color == color)
    if category and category != "all": query = query.filter(Product.category == category)
    if sub_category: query = query.filter(Product.sub_category == sub_category)

    if sort == "price-low":
        query = query.order_by(asc(Product.price))
    elif sort == "price-high":
        query = query.order_by(desc(Product.price))
    else:
        query = query.order_by(asc(Product.id))

    return query.all()

@app.get("/products/{product_id}", response_class=HTMLResponse)
async def get_product_page(request: Request, product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    
    return templates.TemplateResponse("product.html", {
        "request": request, 
        "product": product,
        "category_name": product.name,
        
    })

@app.get("/promotions")
async def get_promotions(request: Request, db: Session = Depends(get_db)):
        promo_with_gifts = db.query(Product).filter(
            Product.is_gift_promo == True,
            Product.gifts.any()
        ).all()
        
        return templates.TemplateResponse("promotions.html", {
            "request": request, 
            "promo_products": promo_with_gifts
        })

@app.get("/about", response_class=HTMLResponse)
async def get_about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

@app.get("/contact", response_class=HTMLResponse)
async def get_contact(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})

@app.get("/catalog", response_class=HTMLResponse)
async def get_catalog(request: Request):
    return templates.TemplateResponse("catalog.html", {"request": request})

@app.get("/favorites", response_class=HTMLResponse)
async def get_favorites(request: Request):
    return templates.TemplateResponse("favorites.html", {"request": request})

#Неблокирующая аутентификация: пользователь или None
async def get_optional_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        return None

    try:
        payload = auth_utils.decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None

        return db.query(models.User).filter(models.User.id == int(user_id)).first()
    except:
        return None

# Получить ID всех избранных товаров (для фронтенда)
@app.get("/api/favorites")
async def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    # Если пользователь авторизован — берем из БД
    if current_user:
        favs = db.query(models.FavoriteItem).filter(
            models.FavoriteItem.user_id == current_user.id
        ).all()
        return [f.product_id for f in favs]
    
    # Если не авторизован — возвращаем пустой список
    return []

# 2. Добавить или удалить (Toggle)
@app.post("/api/favorites/{product_id}")
async def toggle_favorite_server(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Проверяем, есть ли уже в избранном
    existing = db.query(models.FavoriteItem).filter(
        models.FavoriteItem.user_id == current_user.id,
        models.FavoriteItem.product_id == product_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "removed"}
    
    new_fav = models.FavoriteItem(user_id=current_user.id, product_id=product_id)
    db.add(new_fav)
    db.commit()
    return {"status": "added"}

# 3. Слияние (Merge) при логине
@app.post("/api/favorites/merge")
async def merge_favorites(
    data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    local_ids = data.get("ids", [])
    
    for pid in local_ids:
        pid_int = int(pid)
        # Проверяем, чтобы не создать дубликат
        exists = db.query(models.FavoriteItem).filter(
            models.FavoriteItem.user_id == current_user.id,
            models.FavoriteItem.product_id == pid_int
        ).first()
        
        if not exists:
            db.add(models.FavoriteItem(user_id=current_user.id, product_id=pid_int))
    
    db.commit()
    return {"status": "merged"}

@app.get("/login", response_class=HTMLResponse)
async def get_auth(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})

@app.get("/profile")
async def get_profile_page(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})

@app.get("/cart", response_class=HTMLResponse)
async def get_cart_page(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    cart_items = []
    
    if token:
        try:
            payload = auth_utils.decode_access_token(token)
            user_id = payload.get("sub")
            cart_items = db.query(CartItem).options(
                joinedload(CartItem.product)
            ).filter(CartItem.user_id == int(user_id)).all()
        except:
            pass
    
    return templates.TemplateResponse("cart.html", {
    "request": request
})

# Эндпоинт: добавить/обновить/удалить товар в корзине.
@app.post("/api/cart/add")
async def api_add_to_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id

    quantity = item.quantity 

    existing_item = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == item.product_id
    ).first()

    if existing_item:
        new_qty = existing_item.quantity + quantity

        if new_qty <= 0:
            db.delete(existing_item)
            db.commit()
            return {"status": "removed"}

        existing_item.quantity = new_qty
        db.commit()
        db.refresh(existing_item)

        return {
            "status": "updated",
            "quantity": existing_item.quantity
        }
    
    if quantity <= 0:
        return {"status": "ignored"}

    new_item = CartItem(
        user_id=user_id,
        product_id=item.product_id,
        quantity=quantity
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {
        "status": "added",
        "item_id": new_item.id
    }


# Получить полный список товаров в корзине текущего пользователя.
from sqlalchemy.orm import joinedload
@app.get("/api/cart/items")
async def get_cart_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        return []

    return db.query(CartItem)\
        .options(joinedload(CartItem.product))\
        .filter(CartItem.user_id == current_user.id)\
        .all()


# Удалить конкретный товар из корзины текущего пользователя.
@app.delete("/api/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(CartItem).filter(
        CartItem.product_id == product_id, 
        CartItem.user_id == current_user.id
    ).first()
    
    if not item:
        return {"status": "not_found_but_ok"}
    
    db.delete(item)
    db.commit()
    return {"status": "removed"}


# Получить список ID товаров в корзине
@app.get("/api/cart/ids")
async def get_cart_ids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(CartItem.product_id).filter(
        CartItem.user_id == current_user.id
    ).all()

    return [i[0] for i in items]


# Регистрация нового пользователя
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        (models.User.email == user_data.email) | 
        (models.User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с такими данными уже есть")

    hashed_pw = auth_utils.hash_password(user_data.password)

    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# Аутентификация пользователя
@app.post("/api/auth/login")
async def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.email == data.username_or_email) | 
        (models.User.username == data.username_or_email)
    ).first()

    if not user or not auth_utils.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.encode(
        {"sub": str(user.id), "exp": datetime.utcnow() + access_token_expires},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    response = JSONResponse(content={"message": "Успешный вход"})

    response.set_cookie(
        key="access_token",
        value=access_token, 
        httponly=True,
        samesite="lax",
        secure=False 
    )

    return response


# Выход пользователя
@app.post("/api/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Вы успешно вышли"})
    # Удаляем куку access_token
    response.delete_cookie(key="access_token", path="/")
    return response

# Страница заказов
@app.get("/orders", response_class=HTMLResponse)
async def get_orders_page(request: Request):
    return templates.TemplateResponse("orders.html", {"request": request})

# Создание заказа
@app.post("/api/orders/create")
def create_order(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = models.Order(
        user_id=current_user.id,
        name=data["name"],
        phone=data["phone"],
        address=data["address"]
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    # берём корзину пользователя из БД
    cart_items = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).all()

    # сохраняем товары
    for item in cart_items:
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.product.price
        )
        db.add(order_item)

    # очищаем корзину
    db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).delete()

    db.commit()

    return {"message": "Order created"}

# Получение своих заказов
@app.get("/api/orders/my")
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(models.Order).filter(
        models.Order.user_id == current_user.id
    ).order_by(models.Order.id.desc()).all()

    result = []

    for order in orders:
        items = db.query(models.OrderItem).filter(
            models.OrderItem.order_id == order.id
        ).all()

        total = 0
        items_list = []

        for item in items:
            product = db.query(models.Product).filter(
                models.Product.id == item.product_id
            ).first()

            total += item.price * item.quantity

            items_list.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
                "product": {
                    "name": product.name,
                    "images": product.images
                }
            })

        result.append({
            "id": order.id,
            "address": order.address,
            "phone": order.phone,
            "status": order.status,
            "created_at": order.created_at,
            "total": total,
            "items": items_list
        })

    return result

# Удаление заказа
@app.delete("/api/orders/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ищем заказ
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id 
    ).first()

    if not order:
        return {"status": "not_found"}

    # сначала удаляем товары заказа
    db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id
    ).delete()

    # потом сам заказ
    db.delete(order)
    db.commit()

    return {"status": "deleted"}