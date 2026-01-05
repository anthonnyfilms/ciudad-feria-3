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
- [x] Botón "Mis Entradas" removido del sitio público

### Panel de Administración
- [x] Autenticación JWT (roles: admin, validator)
- [x] Dashboard con estadísticas y gráficos
- [x] CRUD de Eventos con configurador de asientos
- [x] CRUD de Categorías
- [x] CRUD de Categorías de Mesas
- [x] Gestión de Compras con aprobación/rechazo
- [x] Exportación a Excel de compras
- [x] Configuración de métodos de pago
- [x] **Validador de entradas QR** (scanner + entrada manual) - CORREGIDO
- [x] Diseñador de entradas personalizable
- [x] **Sistema de Acreditaciones:**
  - Diseñador visual por evento/categoría
  - Generación de PDF (individual y lote)
  - Pase general para todos los eventos
- [x] Monitor de Aforo en tiempo real
- [x] **Generador de Tickets Térmicos 80mm:**
  - Tickets genéricos "CIUDAD FERIA 2026" (sin evento específico)
  - Logo, numeración secuencial (#0001, #0002...)
  - Imagen optimizada para impresora térmica (576x450px)
  - Preview, descarga PNG e impresión masiva
  - Categorías: General ($1), Gradas ($2.50), VIP ($5), Premium ($10)
- [x] Gestión de usuarios admin

### Validación de Entradas
- [x] Validación por escaneo QR
- [x] Validación manual por código alfanumérico
- [x] Soporte para tickets normales y tickets térmicos (taquilla)
- [x] Registro de entrada/salida con historial

## Credenciales de Prueba
- **URL Admin:** `/admin-ciudadferia`
- **Usuario:** `admin` / `admin123`

## Historial de Cambios

### 2026-01-05
- **Bug Fix:** Diseñador de Acreditaciones - Toggle de visibilidad de elementos
  - El checkbox de visibilidad (Cédula, Nombre, etc.) ahora actualiza correctamente la vista previa
  - Implementado `previewKey` para forzar re-render del componente de preview
  - Corregida la actualización inmutable del estado `elementos`

### 2026-01-04 (Sesión Anterior)
- **Removido:** Botón "Mis Entradas" del sitio público
- **Feature:** Tickets Térmicos ahora son genéricos "CIUDAD FERIA 2026"
  - No requieren evento específico
  - Numeración secuencial (#0001, #0002, etc.)
  - Header con logo "CIUDAD FERIA" y "FERIA DE SAN SEBASTIÁN 2026"
  - Categoría en rectángulo azul/amarillo
  - Precio en rectángulo amarillo
  - Footer con ubicación (San Cristóbal, Táchira)
- **Bug Fix:** Validación QR ahora funciona para ambos tipos de tickets
  - Tickets normales (compra online)
  - Tickets térmicos (venta taquilla)
- **Bug Fix:** Template de entrada se carga correctamente desde URLs completas
- **Bug Fix:** Editor de zonas generales carga todas las zonas al editar

### Anteriores
- Sistema completo de acreditaciones con diseñador visual
- Exportación Excel de compras
- Imagen de fondo personalizable en homepage
- Flujo de compra para entradas generales corregido

## Tareas Pendientes

### P3 - Baja Prioridad (Refactorización)
- Dividir `server.py` en estructura modular (/routes, /models, /services)
- Crear `AdminLayout.jsx` compartido para el sidebar
