# Ciudad Feria - Feria de San Sebastián 2026

## Descripción del Producto
Sistema web integral para la gestión y venta de entradas de la "Feria de San Sebastián 2026" en Venezuela.

## Stack Tecnológico
- **Backend:** FastAPI (Python), MongoDB (pymongo), JWT, qrcode, Pillow, reportlab
- **Frontend:** React, Tailwind CSS, Axios, Framer Motion, recharts, html5-qrcode, xlsx
- **Base de datos:** MongoDB

## Funcionalidades Implementadas

### Sitio Público
- [x] Homepage con información del evento e imagen de fondo personalizable
- [x] Lista de eventos con conteo de entradas disponibles
- [x] Detalle de eventos con selector de asientos (mesas/general/mixto)
- [x] Flujo de compra completo con verificación manual de pago
- [x] Generación de tickets con QR únicos no clonables
- [x] Envío de entradas por email

### Panel de Administración
- [x] Autenticación JWT (roles: admin, validator)
- [x] Dashboard con estadísticas y gráficos
- [x] CRUD de Eventos con configurador de asientos
- [x] CRUD de Categorías
- [x] CRUD de Categorías de Mesas
- [x] Gestión de Compras con aprobación/rechazo
- [x] Exportación a Excel de compras
- [x] Configuración de métodos de pago
- [x] Validador de entradas QR (scanner + entrada manual)
- [x] Diseñador de entradas personalizable
- [x] **Sistema de Acreditaciones:**
  - Diseñador visual por evento/categoría
  - Generación de PDF (individual y lote)
  - Pase general para todos los eventos
- [x] Monitor de Aforo en tiempo real
- [x] **Generador de Tickets Térmicos 80mm:**
  - Generación de lotes para venta en taquilla
  - Imagen optimizada para impresora térmica (576x400px)
  - Preview, descarga PNG e impresión masiva
- [x] Gestión de usuarios admin

### Configuración de Asientos
- [x] Tipo General: Zonas de entrada sin asiento fijo
- [x] Tipo Mesas: Mesas numeradas con sillas y categorías
- [x] Tipo Mixto: Combinación de mesas + zonas generales
- [x] Soporte para múltiples zonas generales (Gradas, General, VIP pie, etc.)

## Modelos de Datos Principales

### Eventos
```javascript
{
  id, nombre, descripcion, fecha, hora, ubicacion, categoria,
  precio, imagen, tipo_asientos,
  configuracion_asientos: {
    mesas: [...],
    categorias_generales: [{ nombre, precio, capacidad, color }]
  },
  config_acreditaciones: { categoria_id: { template_imagen, config_elementos } }
}
```

### Compras/Entradas
```javascript
{
  id, evento_id, nombre_comprador, email_comprador, telefono_comprador,
  cantidad, precio_unitario, precio_total, categoria_entrada,
  codigo_alfanumerico, codigo_qr, qr_payload, hash_validacion,
  metodo_pago, estado_pago, estado_entrada, historial_acceso,
  tipo_venta // "online" | "taquilla"
}
```

### Acreditaciones
```javascript
{
  id, evento_id, cedula, nombre, cargo, categoria,
  codigo, codigo_qr, qr_payload, acceso_todos_eventos
}
```

## Endpoints Principales

### Públicos
- `GET /api/eventos` - Lista de eventos
- `GET /api/eventos/{id}` - Detalle de evento
- `POST /api/comprar-entrada` - Compra de entrada
- `GET /api/mis-entradas?email=` - Consultar entradas

### Admin
- `POST /api/admin/login` - Autenticación
- CRUD `/api/admin/eventos`, `/api/admin/categorias`, etc.
- `POST /api/admin/aprobar/{id}` - Aprobar compra
- `POST /api/validar-entrada` - Validar QR
- `POST /api/admin/generar-entradas-termicas` - Generar tickets térmicos
- `GET /api/admin/entrada-termica/{id}` - Imagen de ticket térmico
- `GET /api/admin/acreditaciones/{id}/pdf` - PDF de acreditación
- `GET /api/admin/eventos/{id}/acreditaciones/pdf` - PDF lote

## Credenciales de Prueba
- **URL Admin:** `/secure-admin-panel-2026`
- **Usuario:** `admin` / `admin123`

## Tareas Pendientes

### P1 - Alta Prioridad
- Ninguna pendiente

### P2 - Media Prioridad
- Notificaciones por WhatsApp (diferido por usuario)

### P3 - Baja Prioridad (Refactorización)
- Dividir `server.py` en estructura modular (/routes, /models, /services)
- Crear `AdminLayout.jsx` compartido para el sidebar

## Historial de Cambios

### 2026-01-04
- **Feature:** Implementado Generador de Tickets Térmicos 80mm
  - Nueva página `AdminTicketsTermicos.jsx`
  - Endpoints para generación y obtención de imágenes
  - Formato optimizado para impresora térmica (576x400px)
  - Tests completos (11/11 pasaron)
- **Bug Fix:** Corregido bug donde múltiples zonas generales no se mostraban al editar evento
  - Actualizado `ConfiguradorAsientos.jsx` para cargar correctamente todas las categorías generales

### Anteriores
- Sistema completo de acreditaciones con diseñador visual
- Exportación Excel de compras
- Imagen de fondo personalizable en homepage
- Flujo de compra para entradas generales corregido
- Mejoras en scanner QR
