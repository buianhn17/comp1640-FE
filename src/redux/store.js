import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import ideaReducer from "./slices/ideaSlice";
import academicYearReducer from "./slices/academicYearSlice";
import departmentReducer from "./slices/departmentSlice";
import notificationReducer from './slices/notificationSlice'; // <--- Kiểm tra kỹ dòng này
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ideas: ideaReducer,
    academicYear: academicYearReducer,
    department: departmentReducer,
    notifications: notificationReducer,   // ← thêm mới
  }
});
