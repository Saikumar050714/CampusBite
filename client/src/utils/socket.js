import { io } from 'socket.io-client';

// Use same-origin (Vite proxy forwards /socket.io to backend), with fallback to port 5000
const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export default socket;
