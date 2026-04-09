import { Client } from '@stomp/stompjs';

// ✅ SỬA: Dùng localhost từ .env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = API_BASE_URL.replace('http', 'ws').replace('https', 'wss') + '/ws/notifications';

console.log('[WS-Init] API_BASE_URL:', API_BASE_URL);
console.log('[WS-Init] WS_URL:', WS_URL);

let client = null;
let isConnected = false;

/* ─── Lấy JWT token từ localStorage ─────────────────────── */
const getToken = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('auth'));
    return auth?.token || null;
  } catch {
    return null;
  }
};

/* ─── Connect ────────────────────────────────────────────── */
export const connectWebSocket = (userId, onMessageReceived, onConnect, onError) => {
  console.log('[WS-Check] Đang khởi tạo kết nối cho User:', userId);
  
  if (isConnected && client?.active) {
    console.log('[WS] Already connected');
    return;
  }

  const token = getToken();

  // ✅ SỬA: Dùng WebSocket thay vì SockJS (không cần polyfill)
  client = new Client({
    brokerURL: WS_URL,  // ← Raw WebSocket URL
    connectHeaders: {
      userId: String(userId),
      Authorization: token ? `Bearer ${token}` : '',
    },
    onConnect: () => {
      console.log('[WS] ✓ Connected');
      isConnected = true;

      client.subscribe('/user/queue/notifications', (message) => {
        try {
          const notification = JSON.parse(message.body);
          console.log('[WS] 📬 Notification:', notification);
          if (onMessageReceived) onMessageReceived(notification);
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      });

      if (onConnect) onConnect();
    },
    onDisconnect: () => {
      console.log('[WS] Disconnected');
      isConnected = false;
    },
    onStompError: (frame) => {
      console.error('[WS] STOMP error:', frame.body);
      isConnected = false;
      if (onError) onError(frame);
    },
    onWebSocketError: (error) => {
      console.error('[WS] WebSocket error:', error);
      isConnected = false;
      if (onError) onError(error);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.activate();
};

export const disconnectWebSocket = () => {
  if (client?.active) {
    client.deactivate();
    isConnected = false;
    console.log('[WS] ✓ Disconnected');
  }
};

export const isWebSocketConnected = () => isConnected;

export default { connectWebSocket, disconnectWebSocket, isWebSocketConnected };