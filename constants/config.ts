import { Platform } from 'react-native';

const TAILSCALE_IP = '100.79.201.46';
const PORT = 3001;

export const API_BASE_URL = Platform.OS === 'web'
  ? `http://localhost:${PORT}/api`
  : `http://${TAILSCALE_IP}:${PORT}/api`;