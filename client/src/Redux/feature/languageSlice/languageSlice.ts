import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialStateLang } from "../../../Types/app";

const initialState: initialStateLang = {
  lang: "",
};

const resetDataPassSlice = createSlice({
  name: "language",
  initialState,

  reducers: {
    saveLang: (state, action: PayloadAction<string>) => {
      state.lang = action.payload;
    },
  },
});

export const { saveLang } = resetDataPassSlice.actions;
export default resetDataPassSlice.reducer;
