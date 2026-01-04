import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Ticket } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Eventos = () => {
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [eventosRes, categoriasRes] = await Promise.all([
        axios.get(`${API}/eventos`),
        axios.get(`${API}/categorias`)
      ]);
      setEventos(eventosRes.data);
      setCategorias(categoriasRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventosFiltrados = categoriaSeleccionada === 'todas'
    ? eventos
    : eventos.filter(e => {
        // Comparar con categoria, categoria_id o slug
        return e.categoria === categoriaSeleccionada || 
               e.categoria_id === categoriaSeleccionada ||
               e.categoria?.toLowerCase() === categoriaSeleccionada.toLowerCase();
      });

  const categoriasConTodas = [
    { id: 'todas', nombre: 'Todos', slug: 'todas' },
    ...categorias
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <p className="mt-4 text-foreground/70">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-heading font-black text-primary glow-text mb-4">
            Eventos de la Feria
          </h1>
          <p className="text-lg text-foreground/70">
            Descubre todos los eventos de la Feria de San Sebastián 2026
          </p>
        </motion.div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categoriasConTodas.map((categoria) => (
            <button
              key={categoria.slug}
              onClick={() => setCategoriaSeleccionada(categoria.slug)}
              data-testid={`filter-${categoria.slug}`}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                categoriaSeleccionada === categoria.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card text-foreground/70 hover:text-foreground hover:border-primary/50'
              }`}
              style={
                categoriaSeleccionada === categoria.slug && categoria.id !== 'todas'
                  ? { backgroundColor: categoria.color, color: '#020617' }
                  : {}
              }
            >
              {categoria.icono && <span className="mr-2">{categoria.icono}</span>}
              {categoria.nombre}
            </button>
          ))}
        </div>

        {/* Grid de Eventos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventosFiltrados.map((evento, index) => (
            <motion.div
              key={evento.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl overflow-hidden group hover:border-primary/50 transition-all hover:-translate-y-2"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={evento.imagen}
                  alt={evento.nombre}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold">
                  ${evento.precio}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">
                  {evento.nombre}
                </h3>
                <p className="text-foreground/70 mb-4 line-clamp-2">
                  {evento.descripcion}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-foreground/60">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{evento.fecha} - {evento.hora}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/60">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{evento.ubicacion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/60">
                    <Ticket className="w-4 h-4" />
                    <span className="text-sm">{evento.entradas_disponibles || evento.asientos_disponibles || 0} entradas disponibles</span>
                  </div>
                </div>

                <Link to={`/evento/${evento.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-full font-bold hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] transition-all"
                    data-testid={`evento-${evento.id}-button`}
                  >
                    Comprar Entradas
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {eventosFiltrados.length === 0 && (
          <div className="text-center py-20">
            <p className="text-foreground/50 text-lg">
              No hay eventos en esta categoría
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Eventos;