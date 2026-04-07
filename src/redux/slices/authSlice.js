import { createSlice } from "@reduxjs/toolkit";

/* =========================
   NORMALIZE ROLE (🔥 FIX)
========================= */
export const normalizeRole = (role = "") => {
  const r = role.replace("ROLE_", "").toUpperCase();

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

/* =========================
   INITIAL STATE
========================= */
const initialState = {
  user: savedAuth?.user || null,
  token: savedAuth?.token || null,
  isAuthenticated: !!savedAuth?.token,
};

/* =========================
   SLICE
========================= */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, token } = action.payload;

      const normalizedUser = {
        ...user,
        role: normalizeRole(user.role), // 🔥 FIX
      };

      state.user = normalizedUser;
      state.token = token;
      state.isAuthenticated = true;

      localStorage.setItem(
        "auth",
        JSON.stringify({ user: normalizedUser, token })
      );
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("auth");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;