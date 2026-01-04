import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, 
  CreditCard, Shield, Table2, Users, Printer, Plus, Trash2, 
  Download, Eye, BadgeCheck, Activity, Ticket, Package, Palette, Upload, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminTicketsTermicos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [entradasGeneradas, setEntradasGeneradas] = useState([]);
  const [entradaPreview, setEntradaPreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState(1);
  const [mostrarDiseno, setMostrarDiseno] = useState(false);
  
  // Configuración de diseño del ticket térmico
  const [disenoTicket, setDisenoTicket] = useState({
    titulo: 'CIUDAD FERIA 2026',
    subtitulo: 'FERIA DE SAN SEBASTIÁN',
    ubicacion: 'San Cristóbal, Táchira - Venezuela',
    colorHeader: '#000000',
    colorPrecio: '#FFD700',
    mostrarNumero: true,
    mostrarCategoria: true,
    mostrarPrecio: true,
    mostrarUbicacion: true,
    logoBase64: null
  });
  
  // Form state - SIN evento, solo Ciudad Feria
  const [formData, setFormData] = useState({
    categoria: 'General',
    cantidad: 10,
    precio: 1.00,
    numero_inicio: 1
  });

  // Categorías predefinidas para Ciudad Feria
  const categoriasPredefinidas = [
    { nombre: 'General', precio: 1.00 },
    { nombre: 'Gradas', precio: 2.50 },
    { nombre: 'VIP', precio: 5.00 },
    { nombre: 'Premium', precio: 10.00 }
  ];

  useEffect(() => {
    obtenerUltimoNumero();
  }, []);

  const obtenerUltimoNumero = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/compras`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Buscar el número más alto de tickets de taquilla
      const ticketsTaquilla = response.data.filter(c => c.tipo_venta === 'taquilla');
      let maxNumero = 0;
      ticketsTaquilla.forEach(t => {
        if (t.numero_ticket && t.numero_ticket > maxNumero) {
          maxNumero = t.numero_ticket;
        }
      });
      
      const siguienteNumero = maxNumero + 1;
      setUltimoNumero(siguienteNumero);
      setFormData(prev => ({ ...prev, numero_inicio: siguienteNumero }));
    } catch (error) {
      console.error('Error obteniendo último número:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Sesión cerrada');
    navigate('/secure-admin-panel-2026');
  };

  const handleCategoriaChange = (e) => {
    const categoriaNombre = e.target.value;
    const categoria = categoriasPredefinidas.find(c => c.nombre === categoriaNombre);
    setFormData(prev => ({
      ...prev,
      categoria: categoriaNombre,
      precio: categoria?.precio || prev.precio
    }));
  };

  const generarEntradas = async () => {
    if (formData.cantidad < 1 || formData.cantidad > 100) {
      toast.error('La cantidad debe ser entre 1 y 100');
      return;
    }

    setGenerando(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/generar-entradas-termicas`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEntradasGeneradas(response.data.entradas);
      toast.success(`${response.data.cantidad} tickets generados (${response.data.numero_inicio} - ${response.data.numero_fin})`);
      
      // Actualizar número siguiente
      setUltimoNumero(response.data.numero_fin + 1);
      setFormData(prev => ({ ...prev, numero_inicio: response.data.numero_fin + 1 }));
    } catch (error) {
      console.error('Error generando entradas:', error);
      toast.error(error.response?.data?.detail || 'Error al generar tickets');
    } finally {
      setGenerando(false);
    }
  };

  const verPreview = async (entrada) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${API}/admin/entrada-termica/${entrada.id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const imageUrl = URL.createObjectURL(response.data);
      setEntradaPreview({ ...entrada, imageUrl });
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error obteniendo preview:', error);
      toast.error('Error al obtener preview del ticket');
    }
  };

  const descargarTicket = async (entrada) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${API}/admin/entrada-termica/${entrada.id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${entrada.numero_ticket || entrada.codigo_alfanumerico}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando ticket:', error);
      toast.error('Error al descargar ticket');
    }
  };

  const imprimirTodos = async () => {
    if (entradasGeneradas.length === 0) {
      toast.error('No hay tickets para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    const token = localStorage.getItem('admin_token');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Tickets Ciudad Feria 2026</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .ticket { width: 80mm; page-break-after: always; margin: 0; padding: 0; }
            .ticket img { width: 100%; height: auto; display: block; }
            .loading { text-align: center; padding: 20px; font-size: 14px; }
          </style>
        </head>
        <body><div class="loading">Cargando tickets...</div></body>
      </html>
    `);

    let ticketsHtml = '';
    for (const entrada of entradasGeneradas) {
      try {
        const response = await axios.get(
          `${API}/admin/entrada-termica/${entrada.id}`,
          { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
        );
        const imageUrl = URL.createObjectURL(response.data);
        ticketsHtml += `<div class="ticket"><img src="${imageUrl}" /></div>`;
      } catch (error) {
        console.error(`Error cargando ticket ${entrada.id}:`, error);
      }
    }

    printWindow.document.body.innerHTML = ticketsHtml;
    setTimeout(() => { printWindow.print(); }, 1500);
  };

  const limpiarLista = () => {
    setEntradasGeneradas([]);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos', active: true },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones' },
    { icon: Activity, label: 'Aforo', path: '/admin/aforo' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      
      {/* Header */}
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 rounded-full glass-card hover:border-accent/50 transition-all text-foreground/80 hover:text-accent"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 glass-card border-r border-white/10 min-h-screen p-6">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-4xl font-heading font-black text-foreground flex items-center gap-3">
              <Printer className="w-10 h-10 text-primary" />
              Tickets Térmicos 80mm
            </h2>
            <p className="text-foreground/60 mt-2">
              Genera tickets genéricos <strong>Ciudad Feria</strong> para impresora térmica de 80mm - Venta en taquilla
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario de generación */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Generar Tickets
                </h3>

                {/* Banner Ciudad Feria */}
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl p-4 mb-6 text-center">
                  <span className="text-2xl">🎪</span>
                  <h4 className="font-bold text-primary text-lg">CIUDAD FERIA 2026</h4>
                  <p className="text-xs text-foreground/60">Feria de San Sebastián</p>
                </div>

                <div className="space-y-4">
                  {/* Selector de categoría */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Categoría
                    </label>
                    <select
                      data-testid="categoria-select"
                      value={formData.categoria}
                      onChange={handleCategoriaChange}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      {categoriasPredefinidas.map((cat) => (
                        <option key={cat.nombre} value={cat.nombre}>
                          {cat.nombre} - ${cat.precio.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Número de inicio */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Número inicial
                    </label>
                    <input
                      type="number"
                      data-testid="numero-inicio-input"
                      min="1"
                      value={formData.numero_inicio}
                      onChange={(e) => setFormData({ ...formData, numero_inicio: parseInt(e.target.value) || 1 })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <p className="text-xs text-foreground/50 mt-1">Numeración secuencial desde #{formData.numero_inicio}</p>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Cantidad de tickets
                    </label>
                    <input
                      type="number"
                      data-testid="cantidad-input"
                      min="1"
                      max="100"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <p className="text-xs text-foreground/50 mt-1">
                      Generará tickets #{formData.numero_inicio} al #{formData.numero_inicio + formData.cantidad - 1}
                    </p>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Precio unitario ($)
                    </label>
                    <input
                      type="number"
                      data-testid="precio-input"
                      min="0"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  {/* Resumen */}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground/70">Tickets:</span>
                      <span className="font-bold text-foreground">{formData.cantidad}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground/70">Rango:</span>
                      <span className="font-bold text-foreground">#{formData.numero_inicio} - #{formData.numero_inicio + formData.cantidad - 1}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground/70">Precio c/u:</span>
                      <span className="font-bold text-foreground">${formData.precio.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-primary/30 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground/70 font-medium">Total:</span>
                        <span className="text-2xl font-black text-primary">
                          ${(formData.cantidad * formData.precio).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón generar */}
                  <motion.button
                    data-testid="generar-btn"
                    onClick={generarEntradas}
                    disabled={generando}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generando ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <Ticket className="w-5 h-5" />
                        Generar Tickets
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
              
              {/* Sección de Diseño del Ticket */}
              <div className="glass-card rounded-2xl p-6 mt-6">
                <button
                  onClick={() => setMostrarDiseno(!mostrarDiseno)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Palette className="w-5 h-5 text-secondary" />
                    Personalizar Diseño
                  </h3>
                  {mostrarDiseno ? <ChevronUp className="w-5 h-5 text-foreground/50" /> : <ChevronDown className="w-5 h-5 text-foreground/50" />}
                </button>
                
                {mostrarDiseno && (
                  <div className="mt-4 space-y-4">
                    {/* Preview del ticket */}
                    <div className="bg-white rounded-xl p-3 mx-auto" style={{ width: '280px' }}>
                      <div 
                        className="rounded-lg overflow-hidden text-center"
                        style={{ 
                          backgroundColor: disenoTicket.colorHeader,
                          padding: '8px'
                        }}
                      >
                        <div className="text-white font-bold text-sm">🎪 {disenoTicket.titulo}</div>
                        <div className="text-yellow-400 text-xs">{disenoTicket.subtitulo}</div>
                      </div>
                      
                      <div className="py-4 text-center">
                        {disenoTicket.mostrarNumero && (
                          <div className="text-2xl font-black text-gray-800">#0001</div>
                        )}
                        {disenoTicket.mostrarCategoria && (
                          <div className="inline-block px-3 py-1 rounded bg-gray-800 text-white text-xs mt-2">
                            {formData.categoria.toUpperCase()}
                          </div>
                        )}
                        <div className="my-4 flex justify-center">
                          <div className="w-20 h-20 bg-gray-300 rounded flex items-center justify-center text-gray-500 text-xs">
                            QR CODE
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 font-mono">CF-GEN-0001-XXXX</div>
                        {disenoTicket.mostrarPrecio && (
                          <div 
                            className="inline-block px-4 py-2 rounded font-bold mt-2"
                            style={{ backgroundColor: disenoTicket.colorPrecio }}
                          >
                            ${formData.precio.toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      {disenoTicket.mostrarUbicacion && (
                        <div className="border-t border-gray-200 pt-2 text-center">
                          <p className="text-xs text-gray-500">{disenoTicket.ubicacion}</p>
                          <p className="text-xs text-gray-400">Entrada válida para un solo uso</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Controles de diseño */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-foreground/60">Título</label>
                        <input
                          type="text"
                          value={disenoTicket.titulo}
                          onChange={(e) => setDisenoTicket({...disenoTicket, titulo: e.target.value})}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/60">Subtítulo</label>
                        <input
                          type="text"
                          value={disenoTicket.subtitulo}
                          onChange={(e) => setDisenoTicket({...disenoTicket, subtitulo: e.target.value})}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/60">Color Header</label>
                        <input
                          type="color"
                          value={disenoTicket.colorHeader}
                          onChange={(e) => setDisenoTicket({...disenoTicket, colorHeader: e.target.value})}
                          className="w-full h-9 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/60">Color Precio</label>
                        <input
                          type="color"
                          value={disenoTicket.colorPrecio}
                          onChange={(e) => setDisenoTicket({...disenoTicket, colorPrecio: e.target.value})}
                          className="w-full h-9 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-foreground/60">Ubicación</label>
                      <input
                        type="text"
                        value={disenoTicket.ubicacion}
                        onChange={(e) => setDisenoTicket({...disenoTicket, ubicacion: e.target.value})}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                    
                    {/* Checkboxes */}
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 text-sm text-foreground/70">
                        <input
                          type="checkbox"
                          checked={disenoTicket.mostrarNumero}
                          onChange={(e) => setDisenoTicket({...disenoTicket, mostrarNumero: e.target.checked})}
                          className="rounded"
                        />
                        Número
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground/70">
                        <input
                          type="checkbox"
                          checked={disenoTicket.mostrarCategoria}
                          onChange={(e) => setDisenoTicket({...disenoTicket, mostrarCategoria: e.target.checked})}
                          className="rounded"
                        />
                        Categoría
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground/70">
                        <input
                          type="checkbox"
                          checked={disenoTicket.mostrarPrecio}
                          onChange={(e) => setDisenoTicket({...disenoTicket, mostrarPrecio: e.target.checked})}
                          className="rounded"
                        />
                        Precio
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground/70">
                        <input
                          type="checkbox"
                          checked={disenoTicket.mostrarUbicacion}
                          onChange={(e) => setDisenoTicket({...disenoTicket, mostrarUbicacion: e.target.checked})}
                          className="rounded"
                        />
                        Ubicación
                      </label>
                    </div>
                    
                    <p className="text-xs text-foreground/40 text-center mt-2">
                      El diseño se aplica automáticamente a los nuevos tickets generados
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de tickets generados */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Tickets Generados ({entradasGeneradas.length})
                  </h3>
                  
                  {entradasGeneradas.length > 0 && (
                    <div className="flex gap-2">
                      <motion.button
                        data-testid="imprimir-todos-btn"
                        onClick={imprimirTodos}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-medium"
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir Todos
                      </motion.button>
                      <motion.button
                        data-testid="limpiar-btn"
                        onClick={limpiarLista}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Limpiar
                      </motion.button>
                    </div>
                  )}
                </div>

                {entradasGeneradas.length === 0 ? (
                  <div className="text-center py-16">
                    <Ticket className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                    <p className="text-foreground/50">
                      No hay tickets generados aún.<br />
                      Usa el formulario para generar un lote de tickets Ciudad Feria.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                    {entradasGeneradas.map((entrada, index) => (
                      <motion.div
                        key={entrada.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-background/50 border border-white/10 rounded-xl p-4"
                      >
                        <div className="text-center mb-3">
                          <span className="text-3xl font-black text-primary">
                            #{entrada.numero_ticket?.toString().padStart(4, '0') || (index + 1)}
                          </span>
                          <h4 className="font-mono font-bold text-foreground/70 text-xs mt-1">
                            {entrada.codigo_alfanumerico}
                          </h4>
                        </div>
                        
                        <div className="text-xs text-foreground/60 space-y-1 mb-3">
                          <p><span className="font-medium">Categoría:</span> {entrada.categoria_entrada}</p>
                          <p><span className="font-medium">Precio:</span> ${entrada.precio_total?.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            data-testid={`ver-btn-${index}`}
                            onClick={() => verPreview(entrada)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </button>
                          <button
                            data-testid={`descargar-btn-${index}`}
                            onClick={() => descargarTicket(entrada)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            PNG
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Preview */}
      {showPreviewModal && entradaPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-3xl max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">
              Ticket #{entradaPreview.numero_ticket?.toString().padStart(4, '0')}
            </h3>
            
            <div className="bg-white rounded-xl p-2 mb-4">
              <img 
                src={entradaPreview.imageUrl} 
                alt="Ticket Preview" 
                className="w-full"
              />
            </div>
            
            <div className="text-center text-sm text-foreground/60 mb-4">
              <p className="font-mono font-bold text-primary">
                {entradaPreview.codigo_alfanumerico}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => descargarTicket(entradaPreview)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Descargar PNG
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  URL.revokeObjectURL(entradaPreview.imageUrl);
                }}
                className="flex-1 py-3 rounded-xl glass-card font-bold text-foreground/80"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketsTermicos;
