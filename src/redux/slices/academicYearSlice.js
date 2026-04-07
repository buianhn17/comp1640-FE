import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [
    {
      id: "2023-2024",
      name: "Academic Year 2023-2024",
      closureDate: "2027-03-31",
      finalClosureDate: "2027-04-15"
    },
    {
      id: "2024-2025",
      name: "Academic Year 2024-2025",
      closureDate: "2027-03-31",
      finalClosureDate: "2027-04-15"
    }
  ],
  currentAcademicYear: {
    id: "2024-2025",
    name: "Academic Year 2024-2025",
    closureDate: "2027-03-31",
    finalClosureDate: "2027-04-15"
  }
};

const academicYearSlice = createSlice({
  name: "academicYear",
  initialState,
  reducers: {
    setCurrentAcademicYear: (state, action) => {
      state.currentAcademicYear = action.payload;
    },

    addAcademicYear: (state, action) => {
      state.items.push(action.payload);
    },

    updateAcademicYear: (state, action) => {
      const index = state.items.findIndex(
        (year) => year.id === action.payload.id
      );

      if (index !== -1) {
        state.items[index] = action.payload;
      }

      // Nếu đang edit year active → cập nhật luôn current
      if (
        state.currentAcademicYear &&
        state.currentAcademicYear.id === action.payload.id
      ) {
        state.currentAcademicYear = action.payload;
      }
    }
  }
});

export const {
  setCurrentAcademicYear,
  addAcademicYear,
  updateAcademicYear
} = academicYearSlice.actions;

export default academicYearSlice.reducer;