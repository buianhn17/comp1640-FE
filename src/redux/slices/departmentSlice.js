import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  departments: [
    { id: "1", name: "IT" },
    { id: "2", name: "Management" },
    { id: "3", name: "HR" },
  ],
};

const departmentSlice = createSlice({
  name: "department",
  initialState,
  reducers: {
    addDepartment: (state, action) => {
      state.departments.push(action.payload);
    },

    updateDepartment: (state, action) => {
      const index = state.departments.findIndex(
        (d) => d.id === action.payload.id
      );
      if (index !== -1) {
        state.departments[index] = action.payload;
      }
    },

    deleteDepartment: (state, action) => {
      state.departments = state.departments.filter(
        (d) => d.id !== action.payload
      );
    },
  },
});

export const {
  addDepartment,
  updateDepartment,
  deleteDepartment,
} = departmentSlice.actions;

export default departmentSlice.reducer;