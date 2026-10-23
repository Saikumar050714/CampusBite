import { io } from 'socket.io-client';

// In local Vite dev mode (port 5173), direct socket to backend on port 5000.
// In production (served by Express server on any port/domain), use same-origin ('/')
const SOCKET_URL = (typeof window !== 'undefined' && window.location.port === '5173')
  ? 'http://localhost:5000'
  : '/';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export default socket;
