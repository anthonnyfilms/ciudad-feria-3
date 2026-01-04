import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Shield } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [config, setConfig] = useState({
    descripcion_inicio: 'Vive la tradición, cultura y alegría de la feria más importante del Táchira. Asegura tus entradas digitales con códigos QR únicos e incopiables.',
    banner_principal: 'https://images.unsplash.com/photo-1750323313940-a267ef7d89fa?crop=entropy&cs=srgb&fm=jpg&q=85',
    imagen_fondo_home: ''
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await axios.get(`${API}/configuracion`);
      if (response.data) {
        setConfig(prev => ({
          ...prev,
          descripcion_inicio: response.data.descripcion_inicio || prev.descripcion_inicio,
          banner_principal: response.data.banner_principal || prev.banner_principal,
          imagen_fondo_home: response.data.imagen_fondo_home || ''
        }));
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Eventos Variados',
      description: 'Conciertos, cultura, deportes y más'
    },
    {
      icon: MapPin,
      title: 'San Cristóbal',
      description: 'Táchira, Venezuela'
    },
    {
      icon: Ticket,
      title: 'Entradas Digitales',
      description: 'Códigos QR seguros'
    },
    {
      icon: Shield,
      title: '100% Seguro',
      description: 'Imposible de clonar'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
        style={{
          backgroundImage: `url("${config.imagen_fondo_home || config.banner_principal}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-heading font-black text-primary glow-text mb-6 tracking-tighter">
              SAN SEBASTIÁN
            </h1>
            <h2 className="text-3xl sm:text-5xl font-heading font-bold text-foreground mb-8">
              FERIA 2026
            </h2>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              {config.descripcion_inicio}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/eventos"
                data-testid="hero-eventos-button"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary text-primary-foreground px-10 py-5 rounded-full font-bold text-lg transition-all btn-glow"
                >
                  Ver Eventos
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-8 rounded-2xl text-center group hover:border-primary/50 transition-all"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-all">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-foreground/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-3xl"
          >
            <h2 className="text-4xl font-heading font-bold text-primary mb-6">
              ¿Listo para la Feria?
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              Compra tus entradas ahora y recibe un código QR único y seguro.
              Sistema de validación encriptado con tecnología AES-256.
            </p>
            <Link to="/eventos">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-primary-foreground px-12 py-6 rounded-full font-bold text-xl btn-glow"
                data-testid="cta-comprar-button"
              >
                Comprar Entradas
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;