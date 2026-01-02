import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Eventos from './pages/Eventos';
import DetalleEvento from './pages/DetalleEvento';
import MisEntradas from './pages/MisEntradas';
import ValidarEntrada from './pages/admin/ValidarEntrada';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventos from './pages/admin/AdminEventos';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminCategoriasMesas from './pages/admin/AdminCategoriasMesas';
import AdminCompras from './pages/admin/AdminCompras';
import AdminMetodosPago from './pages/admin/AdminMetodosPago';
import AdminConfiguracion from './pages/admin/AdminConfiguracion';
import AdminDisenoEntrada from './pages/admin/AdminDisenoEntrada';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminAsistencia from './pages/admin/AdminAsistencia';
import AdminAcreditaciones from './pages/admin/AdminAcreditaciones';
import AdminAforo from './pages/admin/AdminAforo';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import WhatsAppButton from './components/WhatsAppButton';
import './App.css';

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><Home /><Footer /><WhatsAppButton /></>} />
          <Route path="/eventos" element={<><Navbar /><Eventos /><Footer /><WhatsAppButton /></>} />
          <Route path="/evento/:id" element={<><Navbar /><DetalleEvento /><Footer /><WhatsAppButton /></>} />
          <Route path="/mis-entradas" element={<><Navbar /><MisEntradas /><Footer /><WhatsAppButton /></>} />
          
          {/* Admin Routes */}
          <Route path="/secure-admin-panel-2026" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <PrivateRoute>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="eventos" element={<AdminEventos />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="categorias-mesas" element={<AdminCategoriasMesas />} />
                <Route path="compras" element={<AdminCompras />} />
                <Route path="metodos-pago" element={<AdminMetodosPago />} />
                <Route path="validar" element={<ValidarEntrada />} />
                <Route path="diseno-entrada" element={<AdminDisenoEntrada />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
                <Route path="asistencia" element={<AdminAsistencia />} />
                <Route path="configuracion" element={<AdminConfiguracion />} />
              </Routes>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;