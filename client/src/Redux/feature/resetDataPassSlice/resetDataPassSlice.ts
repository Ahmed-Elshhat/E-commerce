import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialStateResetDataPass } from "../../../Types/app";

const initialState: initialStateResetDataPass = {
  email: "",
  resetCode: "",
};

const resetDataPassSlice = createSlice({
  name: "resetDataPass",
  initialState,

  reducers: {
    saveEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },

    saveResetCode: (state, action: PayloadAction<string>) => {
      state.resetCode = action.payload;
    },
    clearData: (state) => {
      state.email = "";
      state.resetCode = "";
    },
  },
});

export const { saveEmail, saveResetCode, clearData } =
  resetDataPassSlice.actions;
export default resetDataPassSlice.reducer;
