import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, CheckCircle, XCircle, Scan, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ValidarEntrada = () => {
  const navigate = useNavigate();
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [modoEscaneo, setModoEscaneo] = useState('entrada');
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Sesión cerrada');
    navigate('/secure-admin-panel-2026');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar', active: true },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

  const iniciarEscaneo = () => {
    setEscaneando(true);
    setResultado(null);

    // Wait for DOM to be ready
    setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      html5QrcodeScanner.render(
        async (decodedText) => {
          await validarQR(decodedText);
          html5QrcodeScanner.clear();
          setEscaneando(false);
        },
        (error) => {
          console.log(error);
        }
      );

      setScanner(html5QrcodeScanner);
    }, 100);
  };

  const validarQR = async (qrPayload) => {
    try {
      const response = await axios.post(`${API}/validar-entrada`, {
        qr_payload: qrPayload,
        accion: modoEscaneo
      });

      setResultado(response.data);

      if (response.data.valido) {
        toast.success(response.data.mensaje);
        // Sonido de éxito
        playSound(true);
      } else {
        toast.error(response.data.mensaje);
        // Sonido de alerta
        if (response.data.tipo_alerta) {
          playSound(false);
        }
      }
    } catch (error) {
      console.error('Error validando entrada:', error);
      const mensajeError = error.response?.data?.detail || 'Error al validar la entrada';
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
        // Alerta de 3 pitidos
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = 300;
            osc.type = 'square';
            gain.gain.value = 0.5;
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
          }, i * 400);
        }
      }
    }
  };

  const reiniciarEscaneo = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
    }
    setResultado(null);
    setEscaneando(false);
  };

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
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl font-heading font-black text-primary glow-text mb-4">
                Validar Entradas
              </h1>
              <p className="text-lg text-foreground/70">
                Escanea el código QR para validar entradas
              </p>
            </motion.div>

        {!escaneando && !resultado && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 rounded-3xl text-center"
          >
            <Scan className="w-24 h-24 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              Escanear Código QR
            </h2>
            <p className="text-foreground/70 mb-8">
              Haz clic en el botón para iniciar el escaneo
            </p>
            <motion.button
              onClick={iniciarEscaneo}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground px-12 py-5 rounded-full font-bold text-lg btn-glow"
              data-testid="button-iniciar-escaneo"
            >
              Iniciar Escaneo
            </motion.button>
          </motion.div>
        )}

        {escaneando && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 rounded-3xl"
          >
            <div id="qr-reader" className="rounded-xl overflow-hidden mb-6"></div>
            <button
              onClick={reiniciarEscaneo}
              className="w-full glass-card px-8 py-4 rounded-full font-bold text-foreground hover:border-primary/50 transition-all"
              data-testid="button-cancelar-escaneo"
            >
              Cancelar Escaneo
            </button>
          </motion.div>
        )}

        {resultado && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-12 rounded-3xl text-center ${
              resultado.valido ? 'border-2 border-primary' : 'border-2 border-accent'
            }`}
            data-testid="resultado-validacion"
          >
            {resultado.valido ? (
              <CheckCircle className="w-24 h-24 text-primary mx-auto mb-6" />
            ) : (
              <XCircle className="w-24 h-24 text-accent mx-auto mb-6" />
            )}

            <h2 className={`text-3xl font-heading font-bold mb-4 ${
              resultado.valido ? 'text-primary' : 'text-accent'
            }`}>
              {resultado.valido ? 'Entrada Válida' : 'Entrada Inválida'}
            </h2>

            <p className="text-lg text-foreground/80 mb-8">
              {resultado.mensaje}
            </p>

            {resultado.entrada && (
              <div className="glass-card p-6 rounded-2xl mb-8 text-left">
                <h3 className="text-xl font-bold text-foreground mb-4">Detalles de la Entrada</h3>
                <div className="space-y-2 text-foreground/70">
                  <p><strong>Evento:</strong> {resultado.entrada.nombre_evento}</p>
                  <p><strong>Nombre:</strong> {resultado.entrada.nombre_comprador}</p>
                  <p><strong>Email:</strong> {resultado.entrada.email_comprador}</p>
                </div>
              </div>
            )}

            <motion.button
              onClick={reiniciarEscaneo}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground px-12 py-5 rounded-full font-bold text-lg btn-glow"
              data-testid="button-escanear-otra"
            >
              Escanear Otra Entrada
            </motion.button>
          </motion.div>
        )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ValidarEntrada;