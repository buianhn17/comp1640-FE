import { createSlice } from "@reduxjs/toolkit";

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
      // Vì Backend trả về phẳng (email, role, department_id nằm ngoài cùng)
      // ta lấy token riêng, và gom tất cả các trường còn lại vào 'user'
      const { token, ...userData } = action.payload;

      const normalizedUser = {
        ...userData,
        role: normalizeRole(userData.role),
        // Đảm bảo department_id được giữ lại trong object user
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