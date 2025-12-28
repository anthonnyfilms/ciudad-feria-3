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

    setComprando(true);

    try {
      const response = await axios.post(`${API}/comprar-entrada`, {
        evento_id: id,
        nombre_comprador: nombre,
        email_comprador: email,
        telefono_comprador: telefono,
        cantidad: cantidad,
        precio_total: evento.precio * cantidad,
        metodo_pago: metodoPago,
        comprobante_pago: comprobante || null
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Imagen del Evento */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-3xl overflow-hidden"
          >
            <img
              src={evento.imagen}
              alt={evento.nombre}
              className="w-full h-full object-cover min-h-[400px]"
            />
          </motion.div>

          {/* Detalles y Formulario */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-heading font-black text-primary glow-text mb-4">
              {evento.nombre}
            </h1>
            <p className="text-lg text-foreground/80 mb-6">
              {evento.descripcion}
            </p>

            <div className="space-y-4 mb-8 glass-card p-6 rounded-2xl">
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
            </div>

            <div className="glass-card p-8 rounded-3xl">
              <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
                Comprar Entradas
              </h3>
              <form onSubmit={handleCompra} className="space-y-6">
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

                <div>
                  <label className="block text-foreground/80 mb-2 font-medium">
                    Cantidad de Entradas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(10, evento.asientos_disponibles)}
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value))}
                    className="w-full bg-input border border-border rounded-xl px-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    data-testid="input-cantidad"
                  />
                </div>

                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground/70">Precio por entrada:</span>
                    <span className="text-foreground font-bold">${evento.precio}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl">
                    <span className="text-foreground font-bold">Total:</span>
                    <span className="text-primary font-black text-2xl">
                      ${(evento.precio * cantidad).toFixed(2)}
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
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DetalleEvento;