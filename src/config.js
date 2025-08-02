// Configuration for the control application
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDevServer = window.location.port === '3001';

// Voor productie, gebruik het huidige hostname (werkt voor IP adressen en hostnamen)
const getApiUrl = () => {
  if (isDevelopment && isDevServer) {
    return 'http://localhost:8090'; // Direct to backend, proxy handles /api routes
  }
  // Voor productie of build versie, gebruik zelfde host als de pagina
  return `http://${window.location.hostname}:8090`;
};

const config = {
  API_BASE_URL: getApiUrl(),
  
  // Client identification
  CLIENT_TYPE: 'control',
  CLIENT_NAME_PREFIX: 'Control Panel',
};

export default config;