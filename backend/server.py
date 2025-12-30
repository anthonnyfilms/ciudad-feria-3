from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, status, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
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
import shutil
from PIL import Image, ImageDraw, ImageFont
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import asyncio
import hmac

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
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

# Email Configuration
GMAIL_USER = os.environ.get('GMAIL_USER', '')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')

# HMAC Key para QR seguro (anti-hackeo)
HMAC_SECRET_KEY = b'ciudad_feria_hmac_2026_inhackeable_qr_secret'

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
    template_entrada: Optional[str] = None
    posicion_qr: Optional[dict] = {"x": 50, "y": 50}
    link_externo: Optional[str] = None
    asientos_disponibles: int
    categorias_asientos: List[dict] = []
    # Sistema de asientos
    tipo_asientos: str = "general"  # "general", "mesas", "mixto"
    configuracion_asientos: Optional[dict] = None  # Configuración específica del mapa
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
    template_entrada: Optional[str] = None
    posicion_qr: Optional[dict] = {"x": 50, "y": 50}
    link_externo: Optional[str] = None
    asientos_disponibles: int = 1000
    categorias_asientos: List[dict] = []
    tipo_asientos: str = "general"
    configuracion_asientos: Optional[dict] = None

class EventoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[str] = None
    hora: Optional[str] = None
    ubicacion: Optional[str] = None
    categoria: Optional[str] = None
    precio: Optional[float] = None
    imagen: Optional[str] = None
    template_entrada: Optional[str] = None
    posicion_qr: Optional[dict] = None
    link_externo: Optional[str] = None
    asientos_disponibles: Optional[int] = None
    categorias_asientos: Optional[List[dict]] = None
    tipo_asientos: Optional[str] = None
    configuracion_asientos: Optional[dict] = None

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
    video_principal: Optional[str] = None
    descripcion_inicio: Optional[str] = "Vive la tradición, cultura y alegría de la feria más importante del Táchira. Asegura tus entradas digitales con códigos QR únicos e incopiables."
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
    telefono_comprador: Optional[str] = None
    cantidad: int
    precio_total: float
    metodo_pago: str
    comprobante_pago: Optional[str] = None
    asientos: Optional[List[str]] = []
    categoria_asiento: Optional[str] = None

class AprobarCompra(BaseModel):
    entrada_ids: List[str]
    
class MetodoPagoCreate(BaseModel):
    nombre: str
    tipo: str
    informacion: str
    icono: Optional[str] = None
    orden: int = 0

class Entrada(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    evento_id: str
    nombre_evento: str
    nombre_comprador: str
    email_comprador: str
    telefono_comprador: Optional[str] = None
    fecha_compra: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    codigo_qr: str
    qr_payload: str = ""
    asiento: Optional[str] = None
    mesa: Optional[str] = None
    estado_pago: str = "pendiente"
    metodo_pago: Optional[str] = None
    comprobante_pago: Optional[str] = None
    usado: bool = False
    fecha_uso: Optional[datetime] = None
    estado_entrada: str = "fuera"
    historial_acceso: List[dict] = []
    hash_validacion: str

class MetodoPago(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    tipo: str
    informacion: str
    icono: Optional[str] = None
    activo: bool = True
    orden: int = 0

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
def generar_codigo_alfanumerico(evento_id: str, entrada_id: str) -> str:
    """Genera un código alfanumérico único tipo CF-2026-ABC123"""
    import random
    import string
    
    # Tomar las últimas 6 letras/números del entrada_id
    codigo_unico = entrada_id.replace('-', '')[-6:].upper()
    
    # Generar parte aleatoria adicional
    parte_aleatoria = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    
    return f"CF-2026-{codigo_unico}-{parte_aleatoria}"

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
    
    tipo_asientos = evento.get('tipo_asientos', 'general')
    
    # Validar según tipo de asientos
    if tipo_asientos == 'general':
        if evento['asientos_disponibles'] < compra.cantidad:
            raise HTTPException(status_code=400, detail="No hay suficientes entradas disponibles")
    else:
        # Para mesas o mixto, verificar asientos específicos
        if compra.asientos:
            for asiento_id in compra.asientos:
                entrada_existente = await db.entradas.find_one({
                    "evento_id": compra.evento_id,
                    "asiento": asiento_id,
                    "estado_pago": {"$ne": "rechazado"}
                })
                if entrada_existente:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"El asiento {asiento_id} ya no está disponible"
                    )
    
    entradas = []
    for i in range(compra.cantidad):
        entrada_id = str(uuid.uuid4())
        
        # Generar código alfanumérico
        codigo_alfanumerico = generar_codigo_alfanumerico(compra.evento_id, entrada_id)
        
        # Asignar asiento si está especificado
        asiento = compra.asientos[i] if compra.asientos and i < len(compra.asientos) else None
        
        # Extraer información de mesa si aplica
        mesa_info = None
        if asiento and asiento.startswith('M'):
            # Formato: M{mesa_id}-S{silla}
            parts = asiento.split('-')
            if len(parts) == 2:
                mesa_info = parts[0].replace('M', '')
        
        datos_entrada = {
            "entrada_id": entrada_id,
            "codigo_alfanumerico": codigo_alfanumerico,
            "evento_id": compra.evento_id,
            "nombre_evento": evento['nombre'],
            "nombre_comprador": compra.nombre_comprador,
            "email_comprador": compra.email_comprador,
            "telefono_comprador": compra.telefono_comprador,
            "numero_entrada": i + 1,
            "asiento": asiento
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
            telefono_comprador=compra.telefono_comprador,
            codigo_qr=qr_image,
            qr_payload=qr_payload,
            asiento=asiento,
            mesa=mesa_info,
            estado_pago="pendiente",
            metodo_pago=compra.metodo_pago,
            comprobante_pago=compra.comprobante_pago,
            hash_validacion=hash_validacion,
            estado_entrada="fuera",
            historial_acceso=[]
        )
        
        doc_entrada = entrada.model_dump()
        doc_entrada['fecha_compra'] = doc_entrada['fecha_compra'].isoformat()
        doc_entrada['codigo_alfanumerico'] = codigo_alfanumerico
        doc_entrada['categoria_asiento'] = compra.categoria_asiento
        await db.entradas.insert_one(doc_entrada)
        
        entrada_dict = entrada.model_dump()
        entrada_dict['codigo_alfanumerico'] = codigo_alfanumerico
        entradas.append(entrada_dict)
    
    # Solo decrementar para entradas generales
    if tipo_asientos == 'general':
        await db.eventos.update_one(
            {"id": compra.evento_id},
            {"$inc": {"asientos_disponibles": -compra.cantidad}}
        )
    
    return {
        "success": True,
        "message": f"{compra.cantidad} entrada(s) en espera de aprobación",
        "entradas": entradas,
        "requiere_aprobacion": True
    }

@api_router.post("/validar-entrada")
async def validar_entrada(request: Request):
    body = await request.json()
    qr_payload = body.get('qr_payload')
    accion = body.get('accion', 'verificar')  # verificar, entrada, salida
    
    if not qr_payload:
        raise HTTPException(status_code=400, detail="Payload QR no proporcionado")
    
    datos_entrada = validar_qr(qr_payload)
    if not datos_entrada:
        raise HTTPException(status_code=400, detail="Código QR inválido o corrupto")
    
    entrada_id = datos_entrada.get('entrada_id')
    entrada = await db.entradas.find_one({"id": entrada_id}, {"_id": 0})
    
    if not entrada:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    
    # Verificar estado de pago
    if entrada.get('estado_pago') != 'aprobado':
        return {
            "valido": False,
            "mensaje": "Esta entrada no ha sido aprobada aún. Espere la confirmación del pago.",
            "requiere_aprobacion": True
        }
    
    # Verificar hash
    hash_verificacion = generar_hash({
        "entrada_id": datos_entrada['entrada_id'],
        "evento_id": datos_entrada['evento_id'],
        "nombre_evento": datos_entrada['nombre_evento'],
        "nombre_comprador": datos_entrada['nombre_comprador'],
        "email_comprador": datos_entrada['email_comprador'],
        "telefono_comprador": datos_entrada.get('telefono_comprador'),
        "numero_entrada": datos_entrada['numero_entrada'],
        "asiento": datos_entrada.get('asiento')
    })
    
    if hash_verificacion != entrada['hash_validacion']:
        return {
            "valido": False,
            "mensaje": "⚠️ ALERTA: Entrada fraudulenta detectada",
            "tipo_alerta": "fraude"
        }
    
    if accion == 'verificar':
        return {
            "valido": True,
            "mensaje": "Entrada válida",
            "entrada": {
                "nombre_evento": entrada['nombre_evento'],
                "nombre_comprador": entrada['nombre_comprador'],
                "email_comprador": entrada['email_comprador'],
                "asiento": entrada.get('asiento'),
                "mesa": entrada.get('mesa'),
                "estado_actual": entrada.get('estado_entrada', 'fuera')
            }
        }
    
    elif accion == 'entrada':
        if entrada.get('estado_entrada') == 'dentro':
            return {
                "valido": False,
                "mensaje": "🚨 ALERTA: Esta persona ya está dentro del evento",
                "tipo_alerta": "ya_dentro",
                "entrada": {
                    "nombre_comprador": entrada['nombre_comprador'],
                    "asiento": entrada.get('asiento')
                }
            }
        
        # Registrar entrada
        historial = entrada.get('historial_acceso', [])
        historial.append({
            "tipo": "entrada",
            "fecha": datetime.now(timezone.utc).isoformat()
        })
        
        await db.entradas.update_one(
            {"id": entrada_id},
            {
                "$set": {
                    "estado_entrada": "dentro",
                    "usado": True,
                    "fecha_uso": datetime.now(timezone.utc).isoformat(),
                    "historial_acceso": historial
                }
            }
        )
        
        return {
            "valido": True,
            "mensaje": "✅ Entrada registrada exitosamente",
            "tipo_accion": "entrada",
            "entrada": {
                "nombre_comprador": entrada['nombre_comprador'],
                "asiento": entrada.get('asiento'),
                "mesa": entrada.get('mesa')
            }
        }
    
    elif accion == 'salida':
        if entrada.get('estado_entrada') != 'dentro':
            return {
                "valido": False,
                "mensaje": "Esta persona no está registrada como dentro del evento",
                "tipo_alerta": "no_dentro"
            }
        
        # Registrar salida
        historial = entrada.get('historial_acceso', [])
        historial.append({
            "tipo": "salida",
            "fecha": datetime.now(timezone.utc).isoformat()
        })
        
        await db.entradas.update_one(
            {"id": entrada_id},
            {
                "$set": {
                    "estado_entrada": "fuera",
                    "historial_acceso": historial
                }
            }
        )
        
        return {
            "valido": True,
            "mensaje": "✅ Salida registrada exitosamente",
            "tipo_accion": "salida",
            "entrada": {
                "nombre_comprador": entrada['nombre_comprador'],
                "asiento": entrada.get('asiento')
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
    from datetime import timedelta
    
    total_eventos = await db.eventos.count_documents({})
    total_entradas = await db.entradas.count_documents({})
    entradas_usadas = await db.entradas.count_documents({"usado": True})
    entradas_aprobadas = await db.entradas.count_documents({"estado_pago": "aprobado"})
    entradas_pendientes_pago = await db.entradas.count_documents({"estado_pago": "pendiente"})
    
    # Estadísticas por evento
    pipeline_eventos = [
        {
            "$group": {
                "_id": "$evento_id",
                "nombre_evento": {"$first": "$nombre_evento"},
                "total_vendidas": {"$sum": 1},
                "aprobadas": {
                    "$sum": {"$cond": [{"$eq": ["$estado_pago", "aprobado"]}, 1, 0]}
                },
                "ingresos": {
                    "$sum": {"$cond": [{"$eq": ["$estado_pago", "aprobado"]}, 1, 0]}
                }
            }
        }
    ]
    ventas_por_evento = await db.entradas.aggregate(pipeline_eventos).to_list(100)
    
    # Estadísticas por hora (últimas 24 horas)
    hace_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    pipeline_horas = [
        {
            "$match": {
                "fecha_compra": {"$gte": hace_24h.isoformat()}
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d %H:00",
                        "date": {"$dateFromString": {"dateString": "$fecha_compra"}}
                    }
                },
                "ventas": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    return {
        "total_eventos": total_eventos,
        "total_entradas_vendidas": total_entradas,
        "entradas_usadas": entradas_usadas,
        "entradas_aprobadas": entradas_aprobadas,
        "entradas_pendientes": total_entradas - entradas_usadas,
        "entradas_pendientes_pago": entradas_pendientes_pago,
        "ventas_por_evento": ventas_por_evento
    }

@api_router.get("/admin/compras")
async def listar_compras_admin(
    evento_id: Optional[str] = None,
    estado: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    filtro = {}
    if evento_id:
        filtro["evento_id"] = evento_id
    if estado:
        filtro["estado_pago"] = estado
    
    entradas = await db.entradas.find(filtro, {"_id": 0}).sort("fecha_compra", -1).to_list(1000)
    for entrada in entradas:
        if isinstance(entrada.get('fecha_compra'), str):
            entrada['fecha_compra'] = datetime.fromisoformat(entrada['fecha_compra'])
    return entradas

@api_router.post("/admin/aprobar-compra")
async def aprobar_compra_admin(datos: AprobarCompra, current_user: str = Depends(get_current_user)):
    result = await db.entradas.update_many(
        {"id": {"$in": datos.entrada_ids}},
        {"$set": {"estado_pago": "aprobado"}}
    )
    
    return {
        "message": f"{result.modified_count} entrada(s) aprobada(s)",
        "aprobadas": result.modified_count
    }

@api_router.post("/admin/rechazar-compra")
async def rechazar_compra_admin(datos: AprobarCompra, current_user: str = Depends(get_current_user)):
    # Devolver asientos y eliminar entradas
    entradas = await db.entradas.find({"id": {"$in": datos.entrada_ids}}).to_list(100)
    
    for entrada in entradas:
        await db.eventos.update_one(
            {"id": entrada['evento_id']},
            {"$inc": {"asientos_disponibles": 1}}
        )
    
    result = await db.entradas.delete_many({"id": {"$in": datos.entrada_ids}})
    
    return {
        "message": f"{result.deleted_count} entrada(s) rechazada(s)",
        "eliminadas": result.deleted_count
    }

@api_router.get("/metodos-pago")
async def listar_metodos_pago():
    metodos = await db.metodos_pago.find({"activo": True}, {"_id": 0}).sort("orden", 1).to_list(100)
    return metodos

@api_router.post("/admin/metodos-pago")
async def crear_metodo_pago_admin(metodo: MetodoPagoCreate, current_user: str = Depends(get_current_user)):
    metodo_dict = metodo.model_dump()
    metodo_dict["id"] = str(uuid.uuid4())
    metodo_dict["activo"] = True
    await db.metodos_pago.insert_one(metodo_dict)
    return metodo_dict

@api_router.put("/admin/metodos-pago/{metodo_id}")
async def actualizar_metodo_pago_admin(
    metodo_id: str,
    metodo: MetodoPagoCreate,
    current_user: str = Depends(get_current_user)
):
    await db.metodos_pago.update_one(
        {"id": metodo_id},
        {"$set": metodo.model_dump()}
    )
    return {"message": "Método de pago actualizado"}

@api_router.delete("/admin/metodos-pago/{metodo_id}")
async def eliminar_metodo_pago_admin(metodo_id: str, current_user: str = Depends(get_current_user)):
    await db.metodos_pago.delete_one({"id": metodo_id})
    return {"message": "Método de pago eliminado"}

@api_router.post("/admin/categorias", response_model=Categoria)
async def crear_categoria_admin(categoria: CategoriaCreate, current_user: str = Depends(get_current_user)):
    # Generar slug desde el nombre
    slug = categoria.nombre.lower().replace(" ", "-").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    
    categoria_dict = categoria.model_dump()
    categoria_obj = Categoria(**categoria_dict, slug=slug)
    doc = categoria_obj.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    await db.categorias.insert_one(doc)
    return categoria_obj

@api_router.put("/admin/categorias/{categoria_id}")
async def actualizar_categoria_admin(categoria_id: str, categoria: CategoriaUpdate, current_user: str = Depends(get_current_user)):
    categoria_existente = await db.categorias.find_one({"id": categoria_id})
    if not categoria_existente:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    update_data = {k: v for k, v in categoria.model_dump().items() if v is not None}
    
    # Si se actualiza el nombre, actualizar el slug también
    if "nombre" in update_data:
        update_data["slug"] = update_data["nombre"].lower().replace(" ", "-").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    
    if update_data:
        await db.categorias.update_one({"id": categoria_id}, {"$set": update_data})
    
    categoria_actualizada = await db.categorias.find_one({"id": categoria_id}, {"_id": 0})
    return categoria_actualizada

@api_router.delete("/admin/categorias/{categoria_id}")
async def eliminar_categoria_admin(categoria_id: str, current_user: str = Depends(get_current_user)):
    result = await db.categorias.delete_one({"id": categoria_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría eliminada exitosamente"}

# ==================== SISTEMA DE ASIENTOS ====================

@api_router.get("/eventos/{evento_id}/asientos")
async def obtener_asientos_evento(evento_id: str):
    """Obtener el mapa de asientos de un evento con estado de ocupación"""
    evento = await db.eventos.find_one({"id": evento_id}, {"_id": 0})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Obtener asientos ocupados (entradas no rechazadas)
    entradas = await db.entradas.find(
        {"evento_id": evento_id, "estado_pago": {"$ne": "rechazado"}},
        {"asiento": 1, "mesa": 1, "estado_pago": 1, "_id": 0}
    ).to_list(1000)
    
    asientos_ocupados = []
    asientos_pendientes = []
    
    for entrada in entradas:
        if entrada.get('asiento'):
            if entrada.get('estado_pago') == 'aprobado':
                asientos_ocupados.append(entrada['asiento'])
            else:
                asientos_pendientes.append(entrada['asiento'])
    
    return {
        "evento_id": evento_id,
        "tipo_asientos": evento.get('tipo_asientos', 'general'),
        "configuracion": evento.get('configuracion_asientos'),
        "capacidad_total": evento.get('asientos_disponibles', 0),
        "asientos_ocupados": asientos_ocupados,
        "asientos_pendientes": asientos_pendientes,
        "disponibles": evento.get('asientos_disponibles', 0) - len(asientos_ocupados) - len(asientos_pendientes)
    }

@api_router.post("/admin/eventos/{evento_id}/configurar-asientos")
async def configurar_asientos_evento(
    evento_id: str, 
    request: Request,
    current_user: str = Depends(get_current_user)
):
    """Configurar el sistema de asientos para un evento"""
    body = await request.json()
    
    evento = await db.eventos.find_one({"id": evento_id})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    tipo_asientos = body.get('tipo_asientos', 'general')
    configuracion = body.get('configuracion', {})
    
    # Calcular capacidad total según configuración
    capacidad_total = 0
    
    if tipo_asientos == 'general':
        capacidad_total = configuracion.get('capacidad', 100)
    
    elif tipo_asientos == 'mesas':
        mesas = configuracion.get('mesas', [])
        for mesa in mesas:
            capacidad_total += mesa.get('sillas', 10)
    
    elif tipo_asientos == 'mixto':
        # Mesas + entradas generales
        mesas = configuracion.get('mesas', [])
        for mesa in mesas:
            capacidad_total += mesa.get('sillas', 10)
        capacidad_total += configuracion.get('entradas_generales', 0)
    
    # Actualizar evento
    await db.eventos.update_one(
        {"id": evento_id},
        {
            "$set": {
                "tipo_asientos": tipo_asientos,
                "configuracion_asientos": configuracion,
                "asientos_disponibles": capacidad_total
            }
        }
    )
    
    # Crear/actualizar documento de asientos
    await db.asientos.delete_many({"evento_id": evento_id})
    
    asientos_docs = []
    
    if tipo_asientos == 'mesas':
        mesas = configuracion.get('mesas', [])
        for mesa in mesas:
            mesa_id = mesa.get('id', str(uuid.uuid4()))
            num_sillas = mesa.get('sillas', 10)
            precio = mesa.get('precio', evento.get('precio', 0))
            categoria = mesa.get('categoria', 'General')
            
            for silla_num in range(1, num_sillas + 1):
                asiento_id = f"M{mesa_id}-S{silla_num}"
                asientos_docs.append({
                    "id": asiento_id,
                    "evento_id": evento_id,
                    "tipo": "mesa",
                    "mesa_id": mesa_id,
                    "mesa_nombre": mesa.get('nombre', f'Mesa {mesa_id}'),
                    "silla_numero": silla_num,
                    "categoria": categoria,
                    "precio": precio,
                    "estado": "disponible"
                })
    
    elif tipo_asientos == 'mixto':
        # Crear asientos de mesas
        mesas = configuracion.get('mesas', [])
        for mesa in mesas:
            mesa_id = mesa.get('id', str(uuid.uuid4()))
            num_sillas = mesa.get('sillas', 10)
            precio = mesa.get('precio', evento.get('precio', 0))
            categoria = mesa.get('categoria', 'VIP')
            
            for silla_num in range(1, num_sillas + 1):
                asiento_id = f"M{mesa_id}-S{silla_num}"
                asientos_docs.append({
                    "id": asiento_id,
                    "evento_id": evento_id,
                    "tipo": "mesa",
                    "mesa_id": mesa_id,
                    "mesa_nombre": mesa.get('nombre', f'Mesa {mesa_id}'),
                    "silla_numero": silla_num,
                    "categoria": categoria,
                    "precio": precio,
                    "estado": "disponible"
                })
        
        # Entradas generales no necesitan documento individual
    
    if asientos_docs:
        await db.asientos.insert_many(asientos_docs)
    
    return {
        "success": True,
        "message": f"Configuración de asientos actualizada",
        "tipo": tipo_asientos,
        "capacidad_total": capacidad_total,
        "asientos_creados": len(asientos_docs)
    }

@api_router.post("/reservar-asientos")
async def reservar_asientos(request: Request):
    """Reservar asientos temporalmente durante el proceso de compra"""
    body = await request.json()
    evento_id = body.get('evento_id')
    asientos_ids = body.get('asientos', [])
    session_id = body.get('session_id', str(uuid.uuid4()))
    
    if not evento_id:
        raise HTTPException(status_code=400, detail="evento_id requerido")
    
    evento = await db.eventos.find_one({"id": evento_id}, {"_id": 0})
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Verificar disponibilidad de asientos
    if evento.get('tipo_asientos') != 'general' and asientos_ids:
        for asiento_id in asientos_ids:
            # Verificar si ya está ocupado
            entrada_existente = await db.entradas.find_one({
                "evento_id": evento_id,
                "asiento": asiento_id,
                "estado_pago": {"$ne": "rechazado"}
            })
            
            if entrada_existente:
                raise HTTPException(
                    status_code=400, 
                    detail=f"El asiento {asiento_id} ya no está disponible"
                )
    
    return {
        "success": True,
        "session_id": session_id,
        "asientos_reservados": asientos_ids,
        "expira_en": 600  # 10 minutos
    }

# ==================== UPLOAD DE IMÁGENES ====================

@api_router.post("/upload-imagen")
async def upload_imagen(file: UploadFile = File(...)):
    """Subir una imagen y retornar la URL"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
    
    # Generar nombre único
    extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{extension}"
    file_path = UPLOADS_DIR / filename
    
    # Guardar archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Retornar URL relativa
    return {
        "success": True,
        "url": f"/api/uploads/{filename}",
        "filename": filename
    }

@api_router.get("/uploads/{filename}")
async def get_upload(filename: str):
    """Servir archivos subidos"""
    from fastapi.responses import FileResponse
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)

# ==================== CATEGORÍAS DE MESAS ====================

@api_router.get("/categorias-mesas")
async def obtener_categorias_mesas():
    """Obtener todas las categorías de mesas"""
    categorias = await db.categorias_mesas.find({}, {"_id": 0}).to_list(100)
    if not categorias:
        # Categorías por defecto
        categorias_default = [
            {"id": str(uuid.uuid4()), "nombre": "General", "color": "#10B981"},
            {"id": str(uuid.uuid4()), "nombre": "VIP", "color": "#F59E0B"},
            {"id": str(uuid.uuid4()), "nombre": "Premium", "color": "#8B5CF6"}
        ]
        await db.categorias_mesas.insert_many(categorias_default)
        return categorias_default
    return categorias

@api_router.post("/admin/categorias-mesas")
async def crear_categoria_mesa(request: Request, current_user: str = Depends(get_current_user)):
    """Crear una nueva categoría de mesa"""
    body = await request.json()
    nombre = body.get('nombre')
    color = body.get('color', '#10B981')
    
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre es requerido")
    
    categoria = {
        "id": str(uuid.uuid4()),
        "nombre": nombre,
        "color": color
    }
    
    await db.categorias_mesas.insert_one(categoria)
    if '_id' in categoria:
        del categoria['_id']
    
    return categoria

@api_router.put("/admin/categorias-mesas/{categoria_id}")
async def actualizar_categoria_mesa(categoria_id: str, request: Request, current_user: str = Depends(get_current_user)):
    """Actualizar una categoría de mesa"""
    body = await request.json()
    
    update_data = {}
    if 'nombre' in body:
        update_data['nombre'] = body['nombre']
    if 'color' in body:
        update_data['color'] = body['color']
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.categorias_mesas.update_one(
        {"id": categoria_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    return {"success": True, "message": "Categoría actualizada"}

@api_router.delete("/admin/categorias-mesas/{categoria_id}")
async def eliminar_categoria_mesa(categoria_id: str, current_user: str = Depends(get_current_user)):
    """Eliminar una categoría de mesa"""
    result = await db.categorias_mesas.delete_one({"id": categoria_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"success": True, "message": "Categoría eliminada"}

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