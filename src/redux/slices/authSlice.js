import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode"; // ← THÊM DÒNG NÀY

/* =========================
   NORMALIZE ROLE
========================= */
export const normalizeRole = (role = "") => {
  const r = role.replace("ROLE_", "").toUpperCase();

  if (r.includes("ADMIN")) return "ADMIN";
  if (r.includes("QA_MANAGER")) return "QA_MANAGER";
  if (r.includes("QA_COORDINATOR")) return "QA_COORDINATOR";
  if (r.includes("DEPT_MANAGER")) return "DEPT_MANAGER";
  if (r.includes("HR")) return "HR_MANAGER";
  if (r.includes("HEAD")) return "HEAD";
  if (r.includes("ACADEMIC")) return "ACADEMIC";
  if (r.includes("SUPPORT")) return "SUPPORT";

  return r;
};

/* =========================
   LOAD STORAGE
========================= */
const savedAuth = (() => {
  try {
    const data = JSON.parse(localStorage.getItem("auth"));
    if (!data) return null;

    return {
      ...data,
      user: data.user
        ? {
            ...data.user,
            role: normalizeRole(data.user.role),
          }
        : null,
    };
  } catch {
    return null;
  }
})();

const initialState = {
  user: savedAuth?.user || null,
  token: savedAuth?.token || null,
  userId: savedAuth?.userId || null, // ← LẤY TỪ DECODED TOKEN
  isAuthenticated: !!savedAuth?.token,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { token, ...userData } = action.payload;

      // 🔥 DECODE JWT để lấy userId
      let userId = null;
      try {
        const decoded = jwtDecode(token);
        userId = decoded.userId; // ← Backend lưu userId trong JWT
      } catch (err) {
        console.error('JWT decode error:', err);
      }

      const normalizedUser = {
        ...userData,
        role: normalizeRole(userData.role),
        id: userId, // ← Lưu vào user object
      };

      state.user = normalizedUser;
      state.token = token;
      state.userId = userId; // ← SET userId từ JWT
      state.isAuthenticated = true;

      localStorage.setItem(
        "auth",
        JSON.stringify({ user: normalizedUser, token, userId })
      );
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userId = null;
      state.isAuthenticated = false;
      localStorage.removeItem("auth");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;