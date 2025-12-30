import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Calendar, MapPin, Ticket, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import SelectorAsientos from '../components/SelectorAsientos';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DetalleEvento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const [metodosPago, setMetodosPago] = useState([]);
  const [mostrarEntradas, setMostrarEntradas] = useState(false);
  const [entradasCompradas, setEntradasCompradas] = useState([]);
  const [seleccionAsientos, setSeleccionAsientos] = useState({ tipo: 'general', cantidad: 1, asientos: [] });
  const [pasoCompra, setPasoCompra] = useState(1); // 1: Asientos, 2: Datos personales

  useEffect(() => {
    cargarEvento();
    cargarMetodosPago();
  }, [id]);

  const cargarEvento = async () => {
    try {
      const response = await axios.get(`${API}/eventos/${id}`);
      setEvento(response.data);
    } catch (error) {
      console.error('Error cargando evento:', error);
      toast.error('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const cargarMetodosPago = async () => {
    try {
      const response = await axios.get(`${API}/metodos-pago`);
      setMetodosPago(response.data);
      if (response.data.length > 0) {
        setMetodoPago(response.data[0].id);
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  const handleComprobanteFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    setUploadingComprobante(true);
    
    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprobante(reader.result);
      setComprobanteFile(file);
      setUploadingComprobante(false);
      toast.success('Comprobante cargado');
    };
    reader.onerror = () => {
      toast.error('Error al cargar el archivo');
      setUploadingComprobante(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCompra = async (e) => {
    e.preventDefault();
    
    if (!nombre || !email || !metodoPago) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar selección de asientos
    const tipoAsientos = evento?.tipo_asientos || 'general';
    if (tipoAsientos !== 'general' && seleccionAsientos.asientos.length === 0) {
      toast.error('Por favor selecciona tus asientos');
      return;
    }

    setComprando(true);

    try {
      const cantidadFinal = tipoAsientos === 'general' ? seleccionAsientos.cantidad : seleccionAsientos.asientos.length;
      
      const response = await axios.post(`${API}/comprar-entrada`, {
        evento_id: id,
        nombre_comprador: nombre,
        email_comprador: email,
        telefono_comprador: telefono,
        cantidad: cantidadFinal,
        precio_total: evento.precio * cantidadFinal,
        metodo_pago: metodoPago,
        comprobante_pago: comprobante || null,
        asientos: seleccionAsientos.asientos
      });

      if (response.data.requiere_aprobacion) {
        toast.success('Compra registrada. Espera la aprobación del pago.', { duration: 5000 });
        setTimeout(() => {
          navigate('/mis-entradas');
        }, 2000);
      } else {
        setEntradasCompradas(response.data.entradas);
        setMostrarEntradas(true);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error comprando entrada:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar la compra');
    } finally {
      setComprando(false);
    }
  };

  const handleSeleccionAsientos = (seleccion) => {
    setSeleccionAsientos(seleccion);
    setCantidad(seleccion.total || seleccion.cantidad || 1);
  };

  const descargarEntrada = (entrada, index) => {
    const link = document.createElement('a');
    link.href = entrada.codigo_qr;
    link.download = `entrada-${evento.nombre}-${index + 1}.png`;
    link.click();
    toast.success('Entrada descargada');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <p className="mt-4 text-foreground/70">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-foreground/70 text-xl">Evento no encontrado</p>
          <button
            onClick={() => navigate('/eventos')}
            className="mt-4 text-primary hover:underline"
          >
            Volver a eventos
          </button>
        </div>
      </div>
    );
  }

  if (mostrarEntradas) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <Toaster richColors position="top-center" />
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-3xl text-center"
          >
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-4xl font-heading font-bold text-primary mb-4">
              ¡Compra Exitosa!
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              Tus entradas han sido generadas con códigos QR únicos y seguros.
            </p>

            <div className="space-y-6 mb-8">
              {entradasCompradas.map((entrada, index) => (
                <div key={entrada.id} className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    Entrada #{index + 1}
                  </h3>
                  <img
                    src={entrada.codigo_qr}
                    alt="Código QR"
                    className="w-64 h-64 mx-auto mb-4 rounded-xl"
                    data-testid={`qr-code-${index}`}
                  />
                  <p className="text-sm text-foreground/60 mb-4">
                    ID: {entrada.id}
                  </p>
                  <button
                    onClick={() => descargarEntrada(entrada, index)}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                    data-testid={`download-button-${index}`}
                  >
                    Descargar QR
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/eventos')}
                className="w-full glass-card px-8 py-4 rounded-full font-bold text-foreground hover:border-primary/50 transition-all"
              >
                Ver más eventos
              </button>
              <button
                onClick={() => navigate('/mis-entradas')}
                className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold hover:shadow-lg transition-all"
              >
                Ver mis entradas
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <Toaster richColors position="top-center" />
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/eventos')}
          className="flex items-center gap-2 text-foreground/70 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a eventos
        </button>

        <div className="space-y-8">
          {/* Imagen del Evento - Siempre arriba */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl overflow-hidden max-w-4xl mx-auto"
          >
            <img
              src={evento.imagen}
              alt={evento.nombre}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </motion.div>

          {/* Detalles y Formulario */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info del evento - Columna izquierda */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <h1 className="text-3xl lg:text-4xl font-heading font-black text-primary glow-text mb-4">
                {evento.nombre}
              </h1>
              <p className="text-base text-foreground/80 mb-6">
                {evento.descripcion}
              </p>

              <div className="space-y-4 glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-foreground">{evento.fecha} - {evento.hora}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-foreground">{evento.ubicacion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-primary" />
                  <span className="text-foreground">
                    {evento.asientos_disponibles} asientos disponibles
                  </span>
                </div>
                <div className="border-t border-white/10 pt-4 mt-4">
                  <span className="text-foreground/60 text-sm">Desde</span>
                  <p className="text-3xl font-black text-primary">${evento.precio}</p>
                </div>
              </div>
            </motion.div>

            {/* Formulario de compra - Columnas derechas */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="glass-card p-6 lg:p-8 rounded-3xl">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
                  Comprar Entradas
                </h3>

                {/* Paso 1: Selector de Asientos (si aplica) */}
                {evento.tipo_asientos && evento.tipo_asientos !== 'general' && pasoCompra === 1 && (
                  <div className="space-y-6">
                    <p className="text-foreground/70 text-center mb-4">
                      Selecciona tus sillas en el mapa
                    </p>
                    <SelectorAsientos
                      eventoId={id}
                      precioBase={evento.precio}
                      onSeleccionChange={handleSeleccionAsientos}
                      maxSeleccion={10}
                    />
                  
                    {seleccionAsientos.asientos.length > 0 && (
                      <motion.button
                        type="button"
                        onClick={() => setPasoCompra(2)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-lg"
                      >
                        Continuar ({seleccionAsientos.asientos.length} silla{seleccionAsientos.asientos.length > 1 ? 's' : ''} - ${seleccionAsientos.precioTotal?.toFixed(2) || '0.00'})
                      </motion.button>
                    )}
                  </div>
                )}

              {/* Formulario de datos (Paso 2 para mesas, o directo para general) */}
              {(evento.tipo_asientos === 'general' || !evento.tipo_asientos || pasoCompra === 2) && (
                <form onSubmit={handleCompra} className="space-y-6">
                  {/* Selector de cantidad para entradas generales */}
                  {(evento.tipo_asientos === 'general' || !evento.tipo_asientos) && (
                    <SelectorAsientos
                      eventoId={id}
                      precioBase={evento.precio}
                      onSeleccionChange={handleSeleccionAsientos}
                      maxSeleccion={10}
                    />
                  )}

                  {/* Factura detallada (para mesas) */}
                  {evento.tipo_asientos && evento.tipo_asientos !== 'general' && seleccionAsientos.detalles && (
                    <div className="glass-card p-6 rounded-xl bg-primary/5 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-foreground">📋 Tu Factura</h4>
                        <button
                          type="button"
                          onClick={() => setPasoCompra(1)}
                          className="text-primary text-sm hover:underline"
                        >
                          Modificar
                        </button>
                      </div>
                      
                      {/* Detalle por asiento */}
                      <div className="space-y-2 mb-4">
                        {seleccionAsientos.asientos.map((asiento, idx) => {
                          const detalle = seleccionAsientos.detalles?.find(d => d.asientos?.includes(asiento));
                          const precio = detalle?.precioUnitario || evento.precio;
                          return (
                            <div key={asiento} className="flex justify-between items-center py-2 border-b border-white/10">
                              <span className="text-foreground">{asiento.replace('-', ' • ')}</span>
                              <span className="font-bold text-foreground">${precio.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Subtotal por categoría */}
                      {seleccionAsientos.detalles?.map((detalle, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-foreground/70 mb-1">
                          <span>{detalle.tipo} x{detalle.cantidad}</span>
                          <span>${(detalle.precioUnitario * detalle.cantidad).toFixed(2)}</span>
                        </div>
                      ))}
                      
                      {/* Total */}
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/20">
                        <span className="text-xl font-bold text-foreground">TOTAL:</span>
                        <span className="text-3xl font-black text-primary">
                          ${seleccionAsientos.precioTotal?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Tu nombre"
                      required
                      data-testid="input-nombre"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="tu@email.com"
                      required
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="+58 412 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Método de Pago *
                    </label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    >
                      {metodosPago.map((metodo) => (
                        <option key={metodo.id} value={metodo.id}>{metodo.nombre}</option>
                      ))}
                    </select>
                    {metodoPago && metodosPago.find(m => m.id === metodoPago) && (
                      <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        {/* Imagen del método de pago */}
                        {metodosPago.find(m => m.id === metodoPago).imagen && (
                          <div className="mb-4 bg-white rounded-xl p-3">
                            <img 
                              src={metodosPago.find(m => m.id === metodoPago).imagen} 
                              alt="Método de pago" 
                              className="max-h-32 mx-auto object-contain"
                            />
                          </div>
                        )}
                        <p className="text-sm text-foreground/80 whitespace-pre-line">
                          {metodosPago.find(m => m.id === metodoPago).informacion}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Comprobante de Pago *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleComprobanteFile}
                      className="w-full bg-input border border-border rounded-xl px-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                      disabled={uploadingComprobante}
                    />
                    <p className="text-xs text-foreground/50 mt-2">
                      Sube una foto o captura de tu comprobante de pago (máx. 5MB)
                    </p>
                    {comprobante && (
                      <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <img 
                          src={comprobante} 
                          alt="Comprobante" 
                          className="max-h-40 rounded-lg mx-auto"
                        />
                        <p className="text-xs text-primary text-center mt-2">✓ Comprobante cargado</p>
                      </div>
                    )}
                  </div>

                  <div className="glass-card p-6 rounded-2xl">
                    {/* Logo/Imagen del evento en resumen */}
                    {evento.imagen && (
                      <div className="mb-4 flex items-center gap-4">
                        <img 
                          src={evento.imagen} 
                          alt={evento.nombre} 
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-foreground">{evento.nombre}</h4>
                          <p className="text-xs text-foreground/60">{evento.fecha} - {evento.hora}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground/70">Precio por entrada:</span>
                      <span className="text-foreground font-bold">${evento.precio}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground/70">Cantidad:</span>
                      <span className="text-foreground font-bold">{seleccionAsientos.total || cantidad}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl border-t border-foreground/10 pt-2 mt-2">
                      <span className="text-foreground font-bold">Total:</span>
                      <span className="text-primary font-black text-2xl">
                        ${(evento.precio * (seleccionAsientos.total || cantidad)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={comprando}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary text-primary-foreground py-5 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-comprar"
                  >
                    {comprando ? 'Procesando...' : 'Comprar Ahora'}
                  </motion.button>
                </form>
              )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleEvento;