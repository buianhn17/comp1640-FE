import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import ideaReducer from "./slices/ideaSlice";
import academicYearReducer from "./slices/academicYearSlice";
import departmentReducer from "./slices/departmentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ideas: ideaReducer,
    academicYear: academicYearReducer,
    department: departmentReducer,
  }
});
