import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Scan } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ValidarEntrada = () => {
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);

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
  };

  const validarQR = async (qrPayload) => {
    try {
      const response = await axios.post(`${API}/validar-entrada`, {
        qr_payload: qrPayload
      });

      setResultado({
        valido: response.data.valido,
        mensaje: response.data.mensaje,
        entrada: response.data.entrada
      });

      if (response.data.valido) {
        toast.success('Entrada válida');
      } else {
        toast.error(response.data.mensaje);
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
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <Toaster richColors position="top-center" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-heading font-black text-primary glow-text mb-4">
            Validar Entrada
          </h1>
          <p className="text-lg text-foreground/70">
            Escanea el código QR para validar la entrada
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
      </div>
    </div>
  );
};

export default ValidarEntrada;