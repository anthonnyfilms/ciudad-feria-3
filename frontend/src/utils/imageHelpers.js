const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Helper para obtener URL completa de imagen (maneja rutas relativas y absolutas)
export const getImageUrl = (url) => {
  if (!url) return null;
  // Si ya es URL completa o base64, verificar si necesita actualizar dominio
  if (url.startsWith('http') || url.startsWith('data:')) {
    // Si es una URL con dominio diferente pero tiene /api/uploads/, extraer y reconstruir
    if (url.includes('/api/uploads/')) {
      const path = '/api/uploads/' + url.split('/api/uploads/').pop();
      return `${BACKEND_URL}${path}`;
    }
    return url;
  }
  // Si es ruta relativa, agregar BACKEND_URL
  return `${BACKEND_URL}${url}`;
};

// Helper para guardar solo la ruta relativa
export const getRelativePath = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url; // Base64 se guarda completo
  if (url.includes('/api/uploads/')) {
    return '/api/uploads/' + url.split('/api/uploads/').pop();
  }
  return url;
};
