from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
import qrcode
from io import BytesIO
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import hashlib
import json
import logging
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ENCRYPTION_KEY = b'ciudad_feria_secret_key_2026_tachira_venezuela'
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'ciudad_feria_jwt_secret_2026')
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Models
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminUser(BaseModel):
    username: str
    hashed_password: str

class Evento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: str
    fecha: str
    hora: str
    ubicacion: str
    categoria: str
    precio: float
    imagen: str
    link_externo: Optional[str] = None
    asientos_disponibles: int
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventoCreate(BaseModel):
    nombre: str
    descripcion: str
    fecha: str
    hora: str
    ubicacion: str
    categoria: str
    precio: float
    imagen: str
    link_externo: Optional[str] = None
    asientos_disponibles: int = 1000

class EventoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[str] = None
    hora: Optional[str] = None
    ubicacion: Optional[str] = None
    categoria: Optional[str] = None
    precio: Optional[float] = None
    imagen: Optional[str] = None
    link_externo: Optional[str] = None
    asientos_disponibles: Optional[int] = None

class Categoria(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    slug: str
    color: str = "#FACC15"
    icono: Optional[str] = None
    orden: int = 0
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoriaCreate(BaseModel):
    nombre: str
    color: str = "#FACC15"
    icono: Optional[str] = None
    orden: int = 0

class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    color: Optional[str] = None
    icono: Optional[str] = None
    orden: Optional[int] = None

class ConfiguracionSitio(BaseModel):
    banner_principal: Optional[str] = None
    logo: Optional[str] = None
    color_primario: str = "#FACC15"
    color_secundario: str = "#3B82F6"
    color_acento: str = "#EF4444"
    redes_sociales: dict = {
        "facebook": "",
        "instagram": "",
        "twitter": "",
        "youtube": "",
        "tiktok": "",
        "whatsapp": ""
    }
    ultima_actualizacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompraEntrada(BaseModel):
    evento_id: str
    nombre_comprador: str
    email_comprador: str
    cantidad: int
    precio_total: float

class Entrada(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    evento_id: str
    nombre_evento: str
    nombre_comprador: str
    email_comprador: str
    fecha_compra: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    codigo_qr: str
    usado: bool = False
    fecha_uso: Optional[datetime] = None
    hash_validacion: str

# Auth Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# QR Functions
def generar_qr_seguro(datos: dict) -> str:
    datos_json = json.dumps(datos)
    iv = os.urandom(16)
    cipher = Cipher(
        algorithms.AES(ENCRYPTION_KEY[:32]),
        modes.CFB(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    datos_encriptados = encryptor.update(datos_json.encode()) + encryptor.finalize()
    payload = base64.b64encode(iv + datos_encriptados).decode()
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{qr_base64}", payload

def validar_qr(payload: str) -> Optional[dict]:
    try:
        datos_completos = base64.b64decode(payload)
        iv = datos_completos[:16]
        datos_encriptados = datos_completos[16:]
        
        cipher = Cipher(
            algorithms.AES(ENCRYPTION_KEY[:32]),
            modes.CFB(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        datos_json = decryptor.update(datos_encriptados) + decryptor.finalize()
        return json.loads(datos_json.decode())
    except Exception as e:
        logging.error(f"Error validando QR: {e}")
        return None

def generar_hash(datos: dict) -> str:
    datos_string = json.dumps(datos, sort_keys=True)
    return hashlib.sha256(datos_string.encode()).hexdigest()

# Public Routes
@api_router.get("/")
async def root():
    return {"message": "API Ciudad Feria - Feria de San Sebastián 2026"}

@api_router.get("/eventos", response_model=List[Evento])
async def listar_eventos():
    eventos = await db.eventos.find({}, {"_id": 0}).to_list(100)
    for evento in eventos:
        if isinstance(evento.get('fecha_creacion'), str):
            evento['fecha_creacion'] = datetime.fromisoformat(evento['fecha_creacion'])
    return eventos

@api_router.get("/eventos/{evento_id}", response_model=Evento)
async def obtener_evento(evento_id: str):
    evento = await db.eventos.find_one({"id": evento_id}, {"_id": 0})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if isinstance(evento.get('fecha_creacion'), str):
        evento['fecha_creacion'] = datetime.fromisoformat(evento['fecha_creacion'])
    return evento

@api_router.get("/categorias", response_model=List[Categoria])
async def listar_categorias():
    categorias = await db.categorias.find({}, {"_id": 0}).sort("orden", 1).to_list(100)
    for categoria in categorias:
        if isinstance(categoria.get('fecha_creacion'), str):
            categoria['fecha_creacion'] = datetime.fromisoformat(categoria['fecha_creacion'])
    return categorias

@api_router.get("/configuracion")
async def obtener_configuracion():
    config = await db.configuracion.find_one({}, {"_id": 0})
    if not config:
        config_default = ConfiguracionSitio().model_dump()
        config_default['ultima_actualizacion'] = config_default['ultima_actualizacion'].isoformat()
        await db.configuracion.insert_one(config_default)
        return config_default
    if isinstance(config.get('ultima_actualizacion'), str):
        config['ultima_actualizacion'] = datetime.fromisoformat(config['ultima_actualizacion'])
    return config

@api_router.post("/comprar-entrada")
async def comprar_entrada(compra: CompraEntrada):
    evento = await db.eventos.find_one({"id": compra.evento_id}, {"_id": 0})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if evento['asientos_disponibles'] < compra.cantidad:
        raise HTTPException(status_code=400, detail="No hay suficientes asientos disponibles")
    
    entradas = []
    for i in range(compra.cantidad):
        entrada_id = str(uuid.uuid4())
        datos_entrada = {
            "entrada_id": entrada_id,
            "evento_id": compra.evento_id,
            "nombre_evento": evento['nombre'],
            "nombre_comprador": compra.nombre_comprador,
            "email_comprador": compra.email_comprador,
            "numero_entrada": i + 1
        }
        
        hash_validacion = generar_hash(datos_entrada)
        datos_entrada['hash'] = hash_validacion
        
        qr_image, qr_payload = generar_qr_seguro(datos_entrada)
        
        entrada = Entrada(
            id=entrada_id,
            evento_id=compra.evento_id,
            nombre_evento=evento['nombre'],
            nombre_comprador=compra.nombre_comprador,
            email_comprador=compra.email_comprador,
            codigo_qr=qr_image,
            hash_validacion=hash_validacion
        )
        
        doc_entrada = entrada.model_dump()
        doc_entrada['fecha_compra'] = doc_entrada['fecha_compra'].isoformat()
        doc_entrada['qr_payload'] = qr_payload
        await db.entradas.insert_one(doc_entrada)
        entradas.append(entrada.model_dump())
    
    await db.eventos.update_one(
        {"id": compra.evento_id},
        {"$inc": {"asientos_disponibles": -compra.cantidad}}
    )
    
    return {
        "success": True,
        "message": f"{compra.cantidad} entrada(s) comprada(s) exitosamente",
        "entradas": entradas
    }

@api_router.post("/validar-entrada")
async def validar_entrada(request: Request):
    body = await request.json()
    qr_payload = body.get('qr_payload')
    
    if not qr_payload:
        raise HTTPException(status_code=400, detail="Payload QR no proporcionado")
    
    datos_entrada = validar_qr(qr_payload)
    if not datos_entrada:
        raise HTTPException(status_code=400, detail="Código QR inválido o corrupto")
    
    entrada_id = datos_entrada.get('entrada_id')
    entrada = await db.entradas.find_one({"id": entrada_id}, {"_id": 0})
    
    if not entrada:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    
    if entrada['usado']:
        return {
            "valido": False,
            "mensaje": "Esta entrada ya fue utilizada",
            "fecha_uso": entrada.get('fecha_uso')
        }
    
    hash_verificacion = generar_hash({
        "entrada_id": datos_entrada['entrada_id'],
        "evento_id": datos_entrada['evento_id'],
        "nombre_evento": datos_entrada['nombre_evento'],
        "nombre_comprador": datos_entrada['nombre_comprador'],
        "email_comprador": datos_entrada['email_comprador'],
        "numero_entrada": datos_entrada['numero_entrada']
    })
    
    if hash_verificacion != entrada['hash_validacion']:
        raise HTTPException(status_code=400, detail="Entrada ha sido modificada o es fraudulenta")
    
    await db.entradas.update_one(
        {"id": entrada_id},
        {
            "$set": {
                "usado": True,
                "fecha_uso": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "valido": True,
        "mensaje": "Entrada válida y registrada",
        "entrada": {
            "nombre_evento": entrada['nombre_evento'],
            "nombre_comprador": entrada['nombre_comprador'],
            "email_comprador": entrada['email_comprador']
        }
    }

@api_router.get("/mis-entradas/{email}")
async def obtener_mis_entradas(email: str):
    entradas = await db.entradas.find({"email_comprador": email}, {"_id": 0}).to_list(100)
    for entrada in entradas:
        if isinstance(entrada.get('fecha_compra'), str):
            entrada['fecha_compra'] = datetime.fromisoformat(entrada['fecha_compra'])
        if entrada.get('fecha_uso') and isinstance(entrada.get('fecha_uso'), str):
            entrada['fecha_uso'] = datetime.fromisoformat(entrada['fecha_uso'])
    return entradas

# Admin Routes
@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    admin = await db.admin_users.find_one({"username": login.username})
    
    if not admin:
        # Create default admin on first login attempt
        if login.username == "admin" and login.password == "admin123":
            hashed = get_password_hash("admin123")
            await db.admin_users.insert_one({"username": "admin", "hashed_password": hashed})
            admin = {"username": "admin", "hashed_password": hashed}
        else:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    if not verify_password(login.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    access_token = create_access_token(data={"sub": admin["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/admin/eventos", response_model=Evento)
async def crear_evento_admin(evento: EventoCreate, current_user: str = Depends(get_current_user)):
    evento_dict = evento.model_dump()
    evento_obj = Evento(**evento_dict)
    doc = evento_obj.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    await db.eventos.insert_one(doc)
    return evento_obj

@api_router.put("/admin/eventos/{evento_id}")
async def actualizar_evento_admin(evento_id: str, evento: EventoUpdate, current_user: str = Depends(get_current_user)):
    evento_existente = await db.eventos.find_one({"id": evento_id})
    if not evento_existente:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    update_data = {k: v for k, v in evento.model_dump().items() if v is not None}
    
    if update_data:
        await db.eventos.update_one({"id": evento_id}, {"$set": update_data})
    
    evento_actualizado = await db.eventos.find_one({"id": evento_id}, {"_id": 0})
    return evento_actualizado

@api_router.delete("/admin/eventos/{evento_id}")
async def eliminar_evento_admin(evento_id: str, current_user: str = Depends(get_current_user)):
    result = await db.eventos.delete_one({"id": evento_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return {"message": "Evento eliminado exitosamente"}

@api_router.put("/admin/configuracion")
async def actualizar_configuracion_admin(config: ConfiguracionSitio, current_user: str = Depends(get_current_user)):
    config_dict = config.model_dump()
    config_dict['ultima_actualizacion'] = datetime.now(timezone.utc).isoformat()
    
    await db.configuracion.delete_many({})
    await db.configuracion.insert_one(config_dict)
    
    return {"message": "Configuración actualizada exitosamente", "config": config_dict}

@api_router.get("/admin/estadisticas")
async def obtener_estadisticas_admin(current_user: str = Depends(get_current_user)):
    total_eventos = await db.eventos.count_documents({})
    total_entradas = await db.entradas.count_documents({})
    entradas_usadas = await db.entradas.count_documents({"usado": True})
    
    return {
        "total_eventos": total_eventos,
        "total_entradas_vendidas": total_entradas,
        "entradas_usadas": entradas_usadas,
        "entradas_pendientes": total_entradas - entradas_usadas
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()