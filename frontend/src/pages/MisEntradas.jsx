import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Calendar, MapPin, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MisEntradas = () => {
  const [email, setEmail] = useState('');
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscarEntradas = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    setBuscado(true);

    try {
      const response = await axios.get(`${API}/mis-entradas/${email}`);
      setEntradas(response.data);
      
      if (response.data.length === 0) {
        toast.info('No se encontraron entradas para este email');
      } else {
        toast.success(`Se encontraron ${response.data.length} entrada(s)`);
      }
    } catch (error) {
      console.error('Error buscando entradas:', error);
      toast.error('Error al buscar entradas');
    } finally {
      setLoading(false);
    }
  };

  const descargarEntrada = (entrada) => {
    const link = document.createElement('a');
    link.href = entrada.codigo_qr;
    link.download = `entrada-${entrada.nombre_evento}-${entrada.id}.png`;
    link.click();
    toast.success('Entrada descargada');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <Toaster richColors position="top-center" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-heading font-black text-primary glow-text mb-4">
            Mis Entradas
          </h1>
          <p className="text-lg text-foreground/70">
            Busca y descarga tus entradas digitales
          </p>
        </motion.div>

        {/* Formulario de Búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 rounded-3xl mb-12"
        >
          <form onSubmit={buscarEntradas} className="space-y-4">
            <div>
              <label className="block text-foreground/80 mb-2 font-medium">
                Email de Compra
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl px-6 py-4 pr-12 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="tu@email.com"
                  required
                  data-testid="input-email-search"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-buscar-entradas"
            >
              {loading ? 'Buscando...' : 'Buscar Entradas'}
            </motion.button>
          </form>
        </motion.div>

        {/* Lista de Entradas */}
        {buscado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {entradas.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center">
                <p className="text-foreground/70 text-lg">
                  No se encontraron entradas para este email
                </p>
              </div>
            ) : (
              entradas.map((entrada, index) => (
                <motion.div
                  key={entrada.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 rounded-2xl"
                  data-testid={`entrada-card-${index}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* QR Code o Estado Pendiente */}
                    <div className="flex justify-center items-center">
                      {entrada.estado_pago === 'aprobado' ? (
                        <img
                          src={entrada.codigo_qr}
                          alt="Código QR"
                          className="w-48 h-48 rounded-xl"
                        />
                      ) : (
                        <div className="w-48 h-48 rounded-xl glass-card flex flex-col items-center justify-center text-center p-4">
                          <div className="text-4xl mb-3">⏳</div>
                          <p className="text-accent font-bold mb-2">Pendiente de Aprobación</p>
                          <p className="text-foreground/60 text-xs">
                            Tu pago está siendo verificado. Te notificaremos cuando sea aprobado.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Detalles */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
                          {entrada.nombre_evento}
                        </h3>
                        <p className="text-foreground/70">
                          {entrada.nombre_comprador}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-foreground/60">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Comprado: {new Date(entrada.fecha_compra).toLocaleDateString()}
                          </span>
                        </div>
                        {entrada.asiento && (
                          <div className="text-foreground/80 font-medium">
                            🪑 Asiento: {entrada.asiento}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            entrada.estado_pago === 'aprobado'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-accent/20 text-accent'
                          }`}>
                            {entrada.estado_pago === 'aprobado' ? '✅ Pago Aprobado' : '⏳ Pago Pendiente'}
                          </span>
                          {entrada.usado && entrada.estado_pago === 'aprobado' && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-secondary/20 text-secondary">
                              ✓ Entrada Usada
                            </span>
                          )}
                        </div>
                      </div>

                      {entrada.estado_pago === 'aprobado' && (
                        <div className="pt-4">
                          <button
                            onClick={() => descargarEntrada(entrada)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
                            data-testid={`download-button-${index}`}
                          >
                            <Download className="w-4 h-4" />
                            Descargar QR
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-foreground/40 pt-4 border-t border-white/10">
                        ID: {entrada.id}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MisEntradas;