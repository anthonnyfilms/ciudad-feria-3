import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, CheckCircle, XCircle, Scan, Shield, Table2, Camera, RefreshCw, Menu, X, User, Clock, BarChart3, BadgeCheck, Activity , Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ValidarEntrada = () => {
  const navigate = useNavigate();
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [modoEscaneo, setModoEscaneo] = useState('entrada');
  const [cameraError, setCameraError] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [codigoManual, setCodigoManual] = useState('');
  const [modoManual, setModoManual] = useState(false);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Check user role
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'admin');
      } catch (e) {
        setUserRole('admin');
      }
    }
    
    return () => {
      stopScanner();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Sesión cerrada');
    navigate('/admin-ciudadferia');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar', active: true },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos' },
    { icon: BarChart3, label: 'Asistencia', path: '/admin/asistencia' },
    { icon: Tag, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones' },
    { icon: Activity, label: 'Aforo', path: '/admin/aforo' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  // Filter menu items for validator role
  const visibleMenuItems = userRole === 'validador' 
    ? menuItems.filter(item => item.path === '/admin/validar')
    : menuItems;

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current = null;
      } catch (err) {
        console.log('Error stopping scanner:', err);
      }
    }
  };

  const iniciarEscaneo = async () => {
    setEscaneando(true);
    setResultado(null);
    setCameraError(null);

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader-container");
      
      const qrCodeSuccessCallback = async (decodedText) => {
        await stopScanner();
        setEscaneando(false);
        await validarQR(decodedText);
      };

      const config = { 
        fps: 20, 
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        formatsToSupport: [ 0 ], // Solo QR Code
        fps: 15, // Mayor frecuencia de escaneo
        rememberLastUsedCamera: true,
        // Soportar QR en cualquier orientación
        supportedScanTypes: [0] // SCAN_TYPE_CAMERA
      };

      try {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback,
          () => {}
        );
      } catch (err) {
        try {
          await html5QrCodeRef.current.start(
            { facingMode: "user" },
            config,
            qrCodeSuccessCallback,
            () => {}
          );
        } catch (err2) {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await html5QrCodeRef.current.start(
              cameras[0].id,
              config,
              qrCodeSuccessCallback,
              () => {}
            );
          } else {
            throw new Error('No se encontraron cámaras');
          }
        }
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setCameraError(err.message || 'Error al iniciar la cámara');
      toast.error('Error al iniciar la cámara');
      setEscaneando(false);
    }
  };

  const validarQR = async (qrPayload) => {
    try {
      // Primero intentar validar como entrada
      let response = await axios.post(`${API}/validar-entrada`, {
        qr_payload: qrPayload,
        accion: modoEscaneo
      });

      // Si no es válido, intentar como acreditación
      if (!response.data.valido) {
        const acredResponse = await axios.post(`${API}/validar-acreditacion`, {
          qr_payload: qrPayload,
          accion: modoEscaneo
        });
        if (acredResponse.data.valido) {
          response = acredResponse;
        }
      }

      setResultado(response.data);

      if (response.data.valido) {
        toast.success(response.data.mensaje);
        playSound(true);
      } else {
        toast.error(response.data.mensaje);
        playSound(false);
      }
    } catch (error) {
      console.error('Error validando:', error);
      const mensajeError = error.response?.data?.detail || 'Error al validar';
      setResultado({
        valido: false,
        mensaje: mensajeError,
        entrada: null
      });
      toast.error(mensajeError);
      playSound(false);
    }
  };

  const validarCodigoManual = async () => {
    if (!codigoManual.trim()) {
      toast.error('Ingresa un código');
      return;
    }
    
    const codigo = codigoManual.trim().toUpperCase();
    
    try {
      let response;
      
      // Si empieza con AC- es acreditación, si no es entrada
      if (codigo.startsWith('AC-')) {
        response = await axios.post(`${API}/validar-acreditacion`, {
          codigo: codigo,
          accion: modoEscaneo
        });
      } else {
        response = await axios.post(`${API}/validar-entrada-codigo`, {
          codigo: codigo,
          accion: modoEscaneo
        });
      }

      setResultado(response.data);

      if (response.data.valido) {
        toast.success(response.data.mensaje);
        playSound(true);
        setCodigoManual('');
      } else {
        toast.error(response.data.mensaje);
        playSound(false);
      }
    } catch (error) {
      console.error('Error validando código:', error);
      const mensajeError = error.response?.data?.detail || 'Código no encontrado';
      setResultado({
        valido: false,
        mensaje: mensajeError,
        entrada: null
      });
      toast.error(mensajeError);
      playSound(false);
    }
  };

  const playSound = (success) => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (success) {
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else {
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = 300;
            osc.type = 'square';
            gain.gain.value = 0.4;
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.15);
          }, i * 200);
        }
      }
    }
  };

  const reiniciarEscaneo = async () => {
    await stopScanner();
    setResultado(null);
    setEscaneando(false);
    setCameraError(null);
  };

  // Mobile-optimized layout
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      
      {/* Mobile Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎪</span>
            <div>
              <h1 className="text-lg font-heading font-bold text-primary">Ciudad Feria</h1>
              <p className="text-[10px] text-foreground/50">Validador de Entradas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="lg:hidden p-2 rounded-lg glass-card"
            >
              {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:border-accent/50 transition-all text-foreground/80 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden"
            onClick={() => setMenuAbierto(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 h-full glass-card p-4"
              onClick={e => e.stopPropagation()}
            >
              <nav className="space-y-2 mt-4">
                {visibleMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuAbierto(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      item.active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/70 hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-accent hover:bg-accent/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 glass-card border-r border-white/10 min-h-screen p-6">
          <nav className="space-y-2">
            {visibleMenuItems.map((item) => (
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

        {/* Main Content - Mobile Optimized */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-lg mx-auto">
            
            {/* Mode Toggle - Entrada/Salida */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setModoEscaneo('entrada')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  modoEscaneo === 'entrada'
                    ? 'bg-green-500 text-white'
                    : 'glass-card text-foreground/70'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Entrada
              </button>
              <button
                onClick={() => setModoEscaneo('salida')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  modoEscaneo === 'salida'
                    ? 'bg-orange-500 text-white'
                    : 'glass-card text-foreground/70'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Salida
              </button>
            </div>

            {/* Mode Toggle - QR/Manual */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setModoManual(false); setResultado(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  !modoManual
                    ? 'bg-primary text-white'
                    : 'glass-card text-foreground/70'
                }`}
              >
                <Camera className="w-4 h-4" />
                Escanear QR
              </button>
              <button
                onClick={() => { setModoManual(true); setResultado(null); stopScanner(); setEscaneando(false); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  modoManual
                    ? 'bg-primary text-white'
                    : 'glass-card text-foreground/70'
                }`}
              >
                <Shield className="w-4 h-4" />
                Código Manual
              </button>
            </div>

            {/* Manual Code Input */}
            {modoManual && !resultado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 rounded-3xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-lg font-heading font-bold text-foreground mb-1">
                    Validación Manual
                  </h2>
                  <p className="text-foreground/60 text-sm">
                    Ingresa el código de la entrada (ej: CF-2026-ABC123)
                  </p>
                </div>
                
                <input
                  type="text"
                  value={codigoManual}
                  onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                  placeholder="CF-2026-XXXXXX"
                  className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-4 text-center text-xl font-mono text-foreground focus:outline-none focus:border-primary mb-4"
                  onKeyDown={(e) => e.key === 'Enter' && validarCodigoManual()}
                />
                
                <motion.button
                  onClick={validarCodigoManual}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-xl font-bold text-lg ${
                    modoEscaneo === 'entrada'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  } text-white`}
                >
                  Validar {modoEscaneo === 'entrada' ? 'Entrada' : 'Salida'}
                </motion.button>
              </motion.div>
            )}

            {/* Scanner Start Button */}
            {!modoManual && !escaneando && !resultado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 rounded-3xl text-center"
              >
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Scan className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                  Escanear QR
                </h2>
                <p className="text-foreground/60 text-sm mb-6">
                  Presiona para activar la cámara
                </p>
                <motion.button
                  onClick={iniciarEscaneo}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg"
                >
                  <Camera className="w-5 h-5 inline mr-2" />
                  Iniciar Escaneo
                </motion.button>
              </motion.div>
            )}

            {/* Active Scanner */}
            {!modoManual && escaneando && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-3xl overflow-hidden"
              >
                {/* Scanner Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-foreground text-sm font-medium">Cámara activa</span>
                  </div>
                  <span className="text-xs text-foreground/50">
                    {modoEscaneo === 'entrada' ? '🟢 Registrando entrada' : '🟠 Registrando salida'}
                  </span>
                </div>
                
                {/* Video Container */}
                <div 
                  id="qr-reader-container" 
                  className="bg-black relative"
                  style={{ 
                    width: '100%', 
                    minHeight: '300px',
                    maxHeight: '60vh'
                  }}
                ></div>

                {cameraError && (
                  <div className="p-4 bg-accent/20 text-center">
                    <p className="text-accent text-sm">{cameraError}</p>
                  </div>
                )}

                {/* Scanner Controls */}
                <div className="p-4 flex gap-3">
                  <button
                    onClick={reiniciarEscaneo}
                    className="flex-1 py-3 rounded-xl glass-card font-medium text-foreground/80 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      await reiniciarEscaneo();
                      setTimeout(() => iniciarEscaneo(), 300);
                    }}
                    className="flex-1 py-3 rounded-xl bg-primary/20 text-primary font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reiniciar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Result Display */}
            {resultado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-card rounded-3xl overflow-hidden ${
                  resultado.valido 
                    ? 'border-2 border-green-500/50' 
                    : 'border-2 border-red-500/50'
                }`}
              >
                {/* Result Header */}
                <div className={`p-6 text-center ${
                  resultado.valido 
                    ? 'bg-green-500/20' 
                    : 'bg-red-500/20'
                }`}>
                  {resultado.valido ? (
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                  )}
                  <h3 className={`text-2xl font-bold ${
                    resultado.valido ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {resultado.valido ? '¡Entrada Válida!' : 'Entrada No Válida'}
                  </h3>
                  <p className="text-foreground/70 mt-2">{resultado.mensaje}</p>
                </div>

                {/* Entry Details */}
                {resultado.entrada && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-foreground/50">Comprador</p>
                        <p className="font-medium text-foreground">{resultado.entrada.nombre_comprador}</p>
                      </div>
                    </div>
                    
                    {resultado.entrada.asiento && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <Table2 className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-foreground/50">Ubicación</p>
                          <p className="font-medium text-foreground">{resultado.entrada.asiento}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-foreground/50">Registro</p>
                        <p className="font-medium text-foreground">
                          {resultado.entrada.hora_entrada || resultado.entrada.hora_salida || new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={reiniciarEscaneo}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold"
                  >
                    Escanear Otra Entrada
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default ValidarEntrada;
// build-fix-1767085501
