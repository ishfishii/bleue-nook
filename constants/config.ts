import { Platform } from 'react-native';

// TS_HOST is your PC's full Tailscale name, e.g. 'mypc.tail1234.ts.net'
const TS_HOST = 'raindrop.tail62b2d4.ts.net';
const PORT = 3001;

const TS_URL = `https://${TS_HOST}`;

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const isLocalhost = isWeb && window.location.hostname === 'localhost';

// API Base URL for backend requests
export const API_BASE_URL = isWeb
  ? isLocalhost
    ? `http://localhost:${PORT}/api` // dev server on this PC
    : '/api'                         // served from the ts.net origin (same origin as the page)
  : `${TS_URL}/api`;                 // Android app, over Tailscale HTTPS

// Frontend URL for OAuth redirects / callbacks
export const FRONTEND_URL = isWeb ? window.location.origin : TS_URL;