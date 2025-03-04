import { configureStore } from "@reduxjs/toolkit";
import resetDataPassReducer from "../feature/resetDataPassSlice/resetDataPassSlice";
import userReducer from "../feature/userSlice/userSlice";

const store = configureStore({
  reducer: {
    resetDataPass: resetDataPassReducer,
    user: userReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
