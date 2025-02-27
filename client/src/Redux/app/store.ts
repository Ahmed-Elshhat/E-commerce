import { configureStore } from "@reduxjs/toolkit";
import resetDataPassReducer from "../feature/resetDataPassSlice/resetDataPassSlice";


const store = configureStore({
  reducer: {
    resetDataPass: resetDataPassReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store;
