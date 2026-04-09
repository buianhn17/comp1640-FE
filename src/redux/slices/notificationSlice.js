import { createSlice } from '@reduxjs/toolkit';

/* ─── Notification types từ BE ───────────────────────────────
   "NEW_IDEA"     → QA_COORDINATOR nhận khi có idea mới trong dept
   "NEW_COMMENT"  → ACADEMIC/SUPPORT nhận khi có comment trên idea của mình
──────────────────────────────────────────────────────────── */

const MAX_NOTIFICATIONS = 50; // giữ tối đa 50 notifications trong store

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    messages: [],      // danh sách notification objects
    unreadCount: 0,    // badge count
  },
  reducers: {
    addNotification: (state, action) => {
      // Thêm vào đầu danh sách, giữ tối đa MAX_NOTIFICATIONS
      state.messages = [action.payload, ...state.messages].slice(0, MAX_NOTIFICATIONS);
      state.unreadCount += 1;
    },
    markOneAsRead: (state, action) => {
      // action.payload = ideaId hoặc index
      const idx = state.messages.findIndex(
        (m) => m.ideaId === action.payload && !m.isRead
      );
      if (idx !== -1) {
        state.messages[idx].isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.messages = state.messages.map((m) => ({ ...m, isRead: true }));
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.messages = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  markOneAsRead,
  markAllAsRead,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;