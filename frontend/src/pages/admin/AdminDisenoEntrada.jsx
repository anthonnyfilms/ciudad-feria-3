import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, Shield, Table2, Upload, Move, ZoomIn, ZoomOut, RotateCw, Save, Eye, Users, BarChart3, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDisenoEntrada = () => {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [fondoImagen, setFondoImagen] = useState(null);
  const [fondoPreview, setFondoPreview] = useState(null);
  const [qrConfig, setQrConfig] = useState({
    x: 50,
    y: 50,
    size: 150,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado && eventos.length > 0) {
      cargarConfiguracionEvento();
    }
  }, [eventoSeleccionado, eventos]);

  const cargarEventos = async () => {
    try {
      // Usar endpoint público de eventos
      const response = await axios.get(`${API}/eventos`);
      setEventos(response.data);
      if (response.data.length > 0 && !eventoSeleccionado) {
        setEventoSeleccionado(response.data[0].id);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const cargarConfiguracionEvento = async () => {
    const evento = eventos.find(e => e.id === eventoSeleccionado);
    if (evento) {
      if (evento.template_entrada) {
        setFondoPreview(evento.template_entrada);
        setFondoImagen(evento.template_entrada);
      } else {
        setFondoPreview(null);
        setFondoImagen(null);
      }
      if (evento.posicion_qr) {
        setQrConfig({
          x: evento.posicion_qr.x || 50,
          y: evento.posicion_qr.y || 50,
          size: evento.posicion_qr.size || 150,
          rotation: evento.posicion_qr.rotation || 0
        });
      } else {
        setQrConfig({ x: 50, y: 50, size: 150, rotation: 0 });
      }
    }
  };

  const handleFondoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setFondoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload al servidor
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload-imagen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Guardar solo la ruta relativa para que funcione en cualquier dominio
      setFondoImagen(response.data.url);
      toast.success('Imagen de fondo cargada');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast.error('Error al subir imagen');
    }
  };

  // Drag & Drop mejorado para el QR
  const handleMouseDown = (e) => {
    if (!previewRef.current) return;
    e.preventDefault();
    
    const rect = previewRef.current.getBoundingClientRect();
    const qrCurrentX = (qrConfig.x / 100) * rect.width;
    const qrCurrentY = (qrConfig.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - qrCurrentX,
      y: e.clientY - rect.top - qrCurrentY
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    setQrConfig(prev => ({
      ...prev,
      x: Math.max(5, Math.min(95, newX)),
      y: Math.max(5, Math.min(95, newY))
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e) => {
    if (!previewRef.current) return;
    const touch = e.touches[0];
    
    const rect = previewRef.current.getBoundingClientRect();
    const qrCurrentX = (qrConfig.x / 100) * rect.width;
    const qrCurrentY = (qrConfig.y / 100) * rect.height;
    
    setDragOffset({
      x: touch.clientX - rect.left - qrCurrentX,
      y: touch.clientY - rect.top - qrCurrentY
    });
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !previewRef.current) return;
    const touch = e.touches[0];
    
    const rect = previewRef.current.getBoundingClientRect();
    const newX = ((touch.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const newY = ((touch.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    setQrConfig(prev => ({
      ...prev,
      x: Math.max(5, Math.min(95, newX)),
      y: Math.max(5, Math.min(95, newY))
    }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const guardarConfiguracion = async () => {
    if (!eventoSeleccionado) {
      toast.error('Selecciona un evento');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/eventos/${eventoSeleccionado}`,
        {
          template_entrada: fondoImagen || fondoPreview,
          posicion_qr: qrConfig
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('✅ Configuración de entrada guardada');
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin-ciudadferia');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos' },
    { icon: Upload, label: 'Diseño Entrada', path: '/admin/diseno-entrada', active: true },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  const eventoActual = eventos.find(e => e.id === eventoSeleccionado);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎪</span>
              <div>
                <h1 className="text-xl font-heading font-black text-primary">Panel Admin</h1>
                <p className="text-xs text-foreground/50">Ciudad Feria 2026</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 rounded-full glass-card hover:border-accent/50 transition-all text-foreground/80 hover:text-accent">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 glass-card border-r border-white/10 min-h-screen p-6">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-4xl font-heading font-black text-foreground">
              🎫 Diseñador de Entrada
            </h2>
            <p className="text-foreground/60 mt-2">
              Personaliza el diseño de las entradas. Sube tu flyer y posiciona el código QR donde quieras.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panel de Configuración */}
            <div className="space-y-6">
              {/* Selector de Evento */}
              <div className="glass-card p-6 rounded-2xl">
                <label className="block text-foreground/80 mb-2 font-medium">
                  📅 Evento
                </label>
                <select
                  value={eventoSeleccionado}
                  onChange={(e) => setEventoSeleccionado(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none"
                >
                  {eventos.map(evento => (
                    <option key={evento.id} value={evento.id}>{evento.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Upload de Fondo */}
              <div className="glass-card p-6 rounded-2xl">
                <label className="block text-foreground/80 mb-4 font-medium">
                  🖼️ Fondo de la Entrada (Tu diseño/flyer)
                </label>
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-all">
                    {fondoPreview ? (
                      <div className="space-y-3">
                        <img src={fondoPreview} alt="Vista previa" className="max-h-32 mx-auto rounded-lg" />
                        <p className="text-primary text-sm">✓ Imagen cargada - Clic para cambiar</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mx-auto mb-3 text-foreground/50" />
                        <p className="text-foreground/70">Haz clic para subir tu diseño</p>
                        <p className="text-xs text-foreground/50 mt-1">PNG, JPG (Recomendado: 600x900px)</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFondoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Controles del QR */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Move className="w-5 h-5 text-primary" />
                  Posición y Tamaño del QR
                </h3>
                
                <p className="text-foreground/60 text-sm mb-4">
                  💡 Tip: Puedes arrastrar el QR directamente en la vista previa
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-foreground/70 flex items-center justify-between">
                      <span>Posición Horizontal (X)</span>
                      <span className="text-primary font-mono">{qrConfig.x.toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={qrConfig.x}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-foreground/70 flex items-center justify-between">
                      <span>Posición Vertical (Y)</span>
                      <span className="text-primary font-mono">{qrConfig.y.toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={qrConfig.y}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-foreground/70 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ZoomIn className="w-4 h-4" /> Tamaño del QR
                      </span>
                      <span className="text-primary font-mono">{qrConfig.size}px</span>
                    </label>
                    <input
                      type="range"
                      min="80"
                      max="250"
                      value={qrConfig.size}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <motion.button
                onClick={guardarConfiguracion}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? 'Guardando...' : 'Guardar Diseño'}
              </motion.button>
            </div>

            {/* Vista Previa Interactiva */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Vista Previa de la Entrada
              </h3>
              
              <div 
                ref={previewRef}
                className={`relative bg-gray-800 rounded-xl overflow-hidden mx-auto select-none ${isDragging ? 'cursor-grabbing' : ''}`}
                style={{ width: '300px', height: '450px' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Fondo */}
                {fondoPreview ? (
                  <img 
                    src={fondoPreview} 
                    alt="Fondo entrada" 
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="text-center">
                      <span className="text-6xl">🎪</span>
                      <p className="text-foreground/50 mt-4">Feria San Sebastián 2026</p>
                      <p className="text-foreground/30 text-sm mt-2">Sube tu diseño arriba</p>
                    </div>
                  </div>
                )}
                
                {/* QR Arrastrable */}
                <div 
                  className={`absolute bg-white p-2 rounded-lg shadow-xl transition-shadow ${isDragging ? 'shadow-2xl ring-2 ring-primary cursor-grabbing' : 'cursor-grab hover:ring-2 hover:ring-primary/50'}`}
                  style={{
                    left: `${qrConfig.x}%`,
                    top: `${qrConfig.y}%`,
                    transform: `translate(-50%, -50%)`,
                    width: `${qrConfig.size * 0.5}px`,
                    height: `${qrConfig.size * 0.5}px`
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  {/* QR simulado */}
                  <div className="w-full h-full bg-white rounded grid grid-cols-7 grid-rows-7 gap-px p-1">
                    {Array.from({ length: 49 }).map((_, i) => {
                      // Patrón más realista de QR
                      const row = Math.floor(i / 7);
                      const col = i % 7;
                      const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
                      const isBlack = isCorner || (Math.random() > 0.5);
                      return (
                        <div 
                          key={i} 
                          className={`${isBlack ? 'bg-black' : 'bg-white'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Info de ejemplo en panel inferior */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-3 text-white text-xs">
                  <p className="font-bold text-primary truncate">{eventoActual?.nombre || 'Nombre del Evento'}</p>
                  <p className="text-white/70">👤 Nombre del Comprador</p>
                  <p className="text-white/70">🪑 Mesa VIP - Silla 5</p>
                  <p className="text-white/50 text-[10px] mt-1">📅 {eventoActual?.fecha || '2026-01-20'} - {eventoActual?.hora || '20:00'}</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-primary/10 rounded-xl text-center">
                <p className="text-sm text-foreground/70">
                  🖱️ Arrastra el código QR para posicionarlo
                </p>
                <p className="text-xs text-foreground/50 mt-1">
                  La entrada final incluirá el QR real con los datos del comprador
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDisenoEntrada;
